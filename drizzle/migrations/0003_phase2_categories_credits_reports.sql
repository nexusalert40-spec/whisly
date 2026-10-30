ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_category_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_category_check CHECK (category IN ('love','life','friendship','negative','freedom','family','other'));
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS plays_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.record_play(_story_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.stories SET plays_count = plays_count + 1
  WHERE id = _story_id AND (user_id = auth.uid() OR country = (SELECT country FROM public.profiles WHERE id = auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.record_play(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_play(uuid) TO authenticated;

CREATE TABLE public.story_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, reporter_id)
);
GRANT INSERT ON public.story_reports TO authenticated;
GRANT ALL ON public.story_reports TO service_role;
ALTER TABLE public.story_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "file own report" ON public.story_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);