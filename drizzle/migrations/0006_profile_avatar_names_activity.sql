ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text;
GRANT UPDATE (first_name, last_name, avatar_url, name) ON public.profiles TO authenticated;

CREATE POLICY "avatar upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatar update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatar delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Real recent activity in the viewer's country (first names only).
CREATE OR REPLACE FUNCTION public.recent_activity()
RETURNS TABLE(kind text, actor text, amount integer, at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH me AS (SELECT country FROM public.profiles WHERE id = auth.uid())
  SELECT * FROM (
    SELECT 'joined'::text, coalesce(nullif(p.first_name,''), split_part(p.name,' ',1)), NULL::int, p.created_at
      FROM public.profiles p, me WHERE p.country = me.country AND p.id <> auth.uid()
    UNION ALL
    SELECT 'story', coalesce(nullif(p.first_name,''), split_part(p.name,' ',1)), NULL, s.created_at
      FROM public.stories s JOIN public.profiles p ON p.id = s.user_id, me WHERE s.country = me.country
    UNION ALL
    SELECT 'gift', coalesce(nullif(p.first_name,''), split_part(p.name,' ',1)), n.amount, n.created_at
      FROM public.notifications n JOIN public.profiles p ON p.id = n.actor_id, me
      WHERE n.kind = 'gift' AND p.country = me.country
  ) x WHERE x.coalesce <> '' ORDER BY 4 DESC LIMIT 20
$$;
GRANT EXECUTE ON FUNCTION public.recent_activity() TO authenticated;