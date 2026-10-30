ALTER POLICY "audio read own or visible story" ON storage.objects
  TO authenticated
  USING (
    bucket_id = 'audio'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1
        FROM public.stories AS s
        WHERE s.audio_url = storage.objects.name
          AND (storage.foldername(storage.objects.name))[1] = s.user_id::text
          AND (
            s.user_id = (SELECT auth.uid())
            OR EXISTS (
              SELECT 1
              FROM public.profiles AS viewer
              WHERE viewer.id = (SELECT auth.uid())
                AND viewer.country IS NOT NULL
                AND viewer.country <> ''
                AND viewer.country = s.country
            )
          )
      )
    )
  );