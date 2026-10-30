-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Display names of other users (name only)
CREATE OR REPLACE FUNCTION public.get_display_names(_ids uuid[])
RETURNS TABLE (id uuid, name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name FROM public.profiles p WHERE p.id = ANY(_ids)
$$;
REVOKE ALL ON FUNCTION public.get_display_names(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_display_names(uuid[]) TO authenticated;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('like','message','gift','credits')),
  actor_id uuid,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  amount integer,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications mark read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Like -> notify author
CREATE OR REPLACE FUNCTION public.notify_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author uuid;
BEGIN
  SELECT user_id INTO author FROM public.stories WHERE id = NEW.story_id;
  IF author IS NOT NULL AND author <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, kind, actor_id, story_id) VALUES (author, 'like', NEW.user_id, NEW.story_id);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER likes_notify AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.notify_like();

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX messages_recipient_idx ON public.messages (recipient_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.can_message(_recipient uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _recipient <> auth.uid() AND (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.user_id = _recipient
            AND s.country = (SELECT country FROM public.profiles WHERE id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.messages m WHERE m.sender_id = _recipient AND m.recipient_id = auth.uid())
    OR public.has_role(_recipient, 'admin')
  )
$$;
REVOKE ALL ON FUNCTION public.can_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_message(uuid) TO authenticated;

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "send as self" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.can_message(recipient_id));
CREATE POLICY "recipient marks read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.messages_before_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.created_at := now(); NEW.read_at := NULL; RETURN NEW; END $$;
CREATE TRIGGER messages_before_insert BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.messages_before_insert();

CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, actor_id) VALUES (NEW.recipient_id, 'message', NEW.sender_id);
  RETURN NULL;
END $$;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_message();

-- CREDIT GIFTS
CREATE OR REPLACE FUNCTION public.gift_credits(_story_id uuid, _amount integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author uuid; bal integer;
BEGIN
  IF _amount IS NULL OR _amount < 1 OR _amount > 10000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT s.user_id INTO author FROM public.stories s
   WHERE s.id = _story_id AND s.country = (SELECT country FROM public.profiles WHERE id = auth.uid());
  IF author IS NULL THEN RAISE EXCEPTION 'Story not found'; END IF;
  IF author = auth.uid() THEN RAISE EXCEPTION 'You can''t gift your own story'; END IF;
  UPDATE public.profiles SET credits = credits - _amount WHERE id = auth.uid() AND credits >= _amount RETURNING credits INTO bal;
  IF bal IS NULL THEN RAISE EXCEPTION 'Not enough credits'; END IF;
  UPDATE public.profiles SET credits = credits + _amount WHERE id = author;
  INSERT INTO public.notifications (user_id, kind, actor_id, story_id, amount) VALUES (author, 'gift', auth.uid(), _story_id, _amount);
  RETURN bal;
END $$;
REVOKE ALL ON FUNCTION public.gift_credits(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gift_credits(uuid, integer) TO authenticated;

-- PayPal credit packs
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_kind_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_kind_check CHECK (kind IN ('upgrade','support','credits'));
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS credits integer;

CREATE OR REPLACE FUNCTION public.fulfil_payment(_order_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.payments; days int;
BEGIN
  SELECT * INTO p FROM public.payments WHERE paypal_order_id = _order_id FOR UPDATE;
  IF NOT FOUND OR p.status = 'completed' THEN RETURN false; END IF;
  UPDATE public.payments SET status = 'completed', processed_at = now() WHERE id = p.id;
  IF p.kind = 'upgrade' THEN
    days := CASE p.plan_id WHEN 'month_1' THEN 30 WHEN 'month_6' THEN 180 WHEN 'year_1' THEN 365 ELSE 0 END;
    UPDATE public.profiles
      SET subscription_expiry_date = greatest(coalesce(subscription_expiry_date, now()), now()) + make_interval(days => days),
          account_level = 'premium'
      WHERE id = p.user_id;
  ELSIF p.kind = 'support' AND p.story_id IS NOT NULL THEN
    UPDATE public.stories SET support_amount = support_amount + p.amount WHERE id = p.story_id;
  ELSIF p.kind = 'credits' AND coalesce(p.credits, 0) > 0 THEN
    UPDATE public.profiles SET credits = credits + p.credits WHERE id = p.user_id;
    INSERT INTO public.notifications (user_id, kind, amount) VALUES (p.user_id, 'credits', p.credits);
  END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.fulfil_payment(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfil_payment(text) TO service_role;

-- CRYPTO (manual verification)
CREATE TABLE public.crypto_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  network text NOT NULL CHECK (network IN ('eth_arbitrum','btc')),
  pack_id text NOT NULL CHECK (pack_id IN ('pack_100','pack_550','pack_1200')),
  tx_hash text NOT NULL UNIQUE CHECK (char_length(tx_hash) BETWEEN 20 AND 120),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  credits integer,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crypto_payments TO authenticated;
GRANT INSERT (network, pack_id, tx_hash, user_id) ON public.crypto_payments TO authenticated;
GRANT ALL ON public.crypto_payments TO service_role;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crypto read" ON public.crypto_payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own crypto submit" ON public.crypto_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.review_crypto_payment(_id uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.crypto_payments; n int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO c FROM public.crypto_payments WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR c.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed'; END IF;
  n := CASE c.pack_id WHEN 'pack_100' THEN 100 WHEN 'pack_550' THEN 550 WHEN 'pack_1200' THEN 1200 END;
  IF _approve THEN
    UPDATE public.crypto_payments SET status = 'approved', credits = n, reviewed_at = now() WHERE id = _id;
    UPDATE public.profiles SET credits = credits + n WHERE id = c.user_id;
    INSERT INTO public.notifications (user_id, kind, amount) VALUES (c.user_id, 'credits', n);
  ELSE
    UPDATE public.crypto_payments SET status = 'rejected', reviewed_at = now() WHERE id = _id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_crypto_payment(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_crypto_payment(uuid, boolean) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.notifications;