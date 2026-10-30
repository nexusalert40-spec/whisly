import { supabase } from "@/integrations/supabase/client";
import type { FeedStory } from "@/components/whisly/StoryCard";

export type Category = "all" | "love" | "life" | "other";

/** Load stories (by country or by author) with signed audio URLs and the viewer's likes/saves. */
export async function loadStories(opts: { country?: string; userId?: string; category: Category; viewerId: string }) {
  let q = supabase
    .from("stories")
    .select("id, user_id, title, audio_url, category, duration_seconds, likes_count, support_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (opts.country) q = q.eq("country", opts.country);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  if (opts.category !== "all") q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  if (!data.length) return [] as FeedStory[];

  const ids = data.map((s) => s.id);
  const [signed, likes, saves] = await Promise.all([
    supabase.storage.from("audio").createSignedUrls(data.map((s) => s.audio_url), 3600),
    supabase.from("likes").select("story_id").eq("user_id", opts.viewerId).in("story_id", ids),
    supabase.from("saves").select("story_id").eq("user_id", opts.viewerId).in("story_id", ids),
  ]);
  const urlByPath = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  const liked = new Set((likes.data ?? []).map((l) => l.story_id));
  const saved = new Set((saves.data ?? []).map((l) => l.story_id));
  return data.map((s) => ({
    ...s,
    support_amount: Number(s.support_amount),
    signedUrl: urlByPath.get(s.audio_url) ?? undefined,
    liked: liked.has(s.id),
    saved: saved.has(s.id),
  })) as FeedStory[];
}

export async function toggleLike(s: FeedStory, viewerId: string) {
  const r = s.liked
    ? await supabase.from("likes").delete().eq("user_id", viewerId).eq("story_id", s.id)
    : await supabase.from("likes").insert({ user_id: viewerId, story_id: s.id });
  if (r.error) throw r.error;
}

export async function toggleSave(s: FeedStory, viewerId: string) {
  const r = s.saved
    ? await supabase.from("saves").delete().eq("user_id", viewerId).eq("story_id", s.id)
    : await supabase.from("saves").insert({ user_id: viewerId, story_id: s.id });
  if (r.error) throw r.error;
}

export async function deleteStory(id: string) {
  const { data, error } = await supabase.from("stories").delete().eq("id", id).select("audio_url");
  if (error) throw error;
  const path = data?.[0]?.audio_url;
  if (path) await supabase.storage.from("audio").remove([path]);
}
