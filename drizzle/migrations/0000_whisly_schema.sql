-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  country text,
  subscription_expiry_date timestamptz,
  account_level text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (name, country) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, country)
  VALUES (
    NEW.id,
    left(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), 100),
    NEW.email,
    nullif(left(NEW.raw_user_meta_data->>'country', 2), '')
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORIES
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  audio_url text NOT NULL,
  category text NOT NULL CHECK (category IN ('love','life','other')),
  country text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds BETWEEN 0 AND 300),
  likes_count integer NOT NULL DEFAULT 0,
  support_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stories_country_created_idx ON public.stories (country, created_at DESC);
GRANT SELECT, DELETE ON public.stories TO authenticated;
GRANT INSERT (user_id, title, audio_url, category, duration_seconds) ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read stories" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own story" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own story" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Force country from author profile and zero counters on insert
CREATE OR REPLACE FUNCTION public.stories_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  SELECT country INTO c FROM public.profiles WHERE id = NEW.user_id;
  IF c IS NULL OR c = '' THEN RAISE EXCEPTION 'Set your country before publishing'; END IF;
  NEW.country := c;
  NEW.likes_count := 0;
  NEW.support_amount := 0;
  NEW.created_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER stories_before_insert BEFORE INSERT ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.stories_before_insert();

-- LIKES
CREATE TABLE public.likes (
  user_id uuid NOT NULL,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own likes read" ON public.likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own likes insert" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own likes delete" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.likes_count_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
  ELSE
    UPDATE public.stories SET likes_count = greatest(likes_count - 1, 0) WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER likes_count_sync AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.likes_count_sync();

-- SAVES
CREATE TABLE public.saves (
  user_id uuid NOT NULL,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);
GRANT SELECT, INSERT, DELETE ON public.saves TO authenticated;
GRANT ALL ON public.saves TO service_role;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saves read" ON public.saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own saves insert" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own saves delete" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PAYMENTS (written only by the server)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('upgrade','support')),
  plan_id text,
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  paypal_order_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'created',
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Idempotent fulfilment, callable only by service role
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
  END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.fulfil_payment(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfil_payment(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.likes_count_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.stories_before_insert() FROM PUBLIC, anon, authenticated;