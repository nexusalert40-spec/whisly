CREATE OR REPLACE FUNCTION public.current_user_country()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT country FROM public.profiles WHERE id = auth.uid() $$;
REVOKE EXECUTE ON FUNCTION public.current_user_country() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_country() TO authenticated;

DROP POLICY IF EXISTS "auth read stories" ON public.stories;
CREATE POLICY "read own or same-country stories" ON public.stories
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR country = public.current_user_country());

DROP POLICY IF EXISTS "audio read authenticated" ON storage.objects;
CREATE POLICY "audio read own or visible story" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'audio' AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR EXISTS (SELECT 1 FROM public.stories s WHERE s.audio_url = storage.objects.name)
    )
  );