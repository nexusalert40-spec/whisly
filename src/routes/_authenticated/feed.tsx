import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AudioLines, Bell, CircleUserRound, Flame, Heart, Loader2, Plus, Search, Smile } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/whisly/Logo";
import { BottomNav } from "@/components/whisly/BottomNav";
import { StoryCard, type FeedStory } from "@/components/whisly/StoryCard";
import { useProfile } from "@/hooks/use-profile";
import { countryName } from "@/lib/countries";
import { deleteStory, loadStories, toggleLike, toggleSave, type Category } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Feed — Whisly" },
      { name: "description", content: "Voice stories from people in your country." },
      { property: "og:title", content: "Feed — Whisly" },
      { property: "og:description", content: "Voice stories from people in your country." },
    ],
  }),
  component: Feed,
});

const TABS: { id: Category; label: string; icon: typeof Heart }[] = [
  { id: "all", label: "All", icon: AudioLines },
  { id: "love", label: "Love", icon: Heart },
  { id: "life", label: "Life", icon: Flame },
  { id: "other", label: "Other", icon: Smile },
];

function Feed() {
  const { data: profile } = useProfile();
  const [tab, setTab] = useState<Category>("all");
  const qc = useQueryClient();
  const key = ["feed", profile?.country, tab];

  const { data: stories, isLoading, error } = useQuery({
    queryKey: key,
    enabled: !!profile?.country,
    queryFn: () => loadStories({ country: profile!.country!, category: tab, viewerId: profile!.id }),
  });

  const patch = (id: string, fn: (s: FeedStory) => FeedStory) =>
    qc.setQueryData<FeedStory[]>(key, (old) => old?.map((s) => (s.id === id ? fn(s) : s)));

  const like = useMutation({
    mutationFn: (s: FeedStory) => toggleLike(s, profile!.id),
    onMutate: (s) =>
      patch(s.id, (x) => ({ ...x, liked: !x.liked, likes_count: x.likes_count + (x.liked ? -1 : 1) })),
    onError: (_e, s) => {
      patch(s.id, () => s);
      toast.error("Couldn't update like");
    },
  });
  const save = useMutation({
    mutationFn: (s: FeedStory) => toggleSave(s, profile!.id),
    onMutate: (s) => patch(s.id, (x) => ({ ...x, saved: !x.saved })),
    onError: (_e, s) => {
      patch(s.id, () => s);
      toast.error("Couldn't save story");
    },
  });
  const del = useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      toast.success("Story deleted");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("Couldn't delete story"),
  });

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4 text-foreground">
          <button aria-label="Notifications" className="relative" onClick={() => toast("No new notifications")}>
            <Bell className="size-7" />
            <span className="absolute right-0 top-0 size-2.5 rounded-full bg-brand-pink" />
          </button>
          <button aria-label="Search" onClick={() => toast("Search coming soon")}>
            <Search className="size-7" />
          </button>
          <Link to="/profile" aria-label="Profile">
            <CircleUserRound className="size-8" />
          </Link>
        </div>
      </header>

      <Link to="/record" className="mt-6 flex flex-col items-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground shadow-glow">
          <Plus className="size-10" strokeWidth={2.5} />
        </span>
        <span className="mt-3 text-2xl font-bold text-primary">Create voice</span>
        <span className="text-muted-foreground">Share your story, your voice</span>
      </Link>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-medium transition",
              tab === t.id ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-foreground",
            )}
          >
            <t.icon className="size-5" /> {t.label}
          </button>
        ))}
      </div>

      {profile?.country && (
        <p className="mt-4 px-1 text-sm text-muted-foreground">
          Unspoken feelings & stories from <b className="text-foreground">{countryName(profile.country)}</b>
        </p>
      )}

      <section className="mt-3 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        )}
        {error && <p className="py-8 text-center text-destructive">Couldn't load stories. Pull to refresh.</p>}
        {stories?.length === 0 && (
          <div className="rounded-3xl bg-card p-8 text-center shadow-soft">
            <p className="text-lg font-semibold">No stories here yet</p>
            <p className="mt-1 text-muted-foreground">Be the first voice from your country.</p>
          </div>
        )}
        {stories?.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            isOwner={s.user_id === profile?.id}
            onLike={() => like.mutate(s)}
            onSave={() => save.mutate(s)}
            onDelete={() => confirm("Delete this story?") && del.mutate(s.id)}
          />
        ))}
      </section>
      <BottomNav active="home" />
    </main>
  );
}
