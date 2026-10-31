import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import {
  AudioLines, Bell, Check, MessageCircle, CircleUserRound, Feather, Flame, HandHeart, Heart, Home, Loader2, Plus, Search, ShieldAlert, Smile, Users,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/whisly/Logo";
import { Badge, BottomNav } from "@/components/whisly/BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUnread } from "@/lib/social";
import { MoodMatch } from "@/components/whisly/MoodMatch";
import { AdSlot } from "@/components/whisly/AdSlot";
import { LanguageSwitcher } from "@/components/whisly/LanguageSwitcher";
import { StoryCard, type FeedStory } from "@/components/whisly/StoryCard";
import { useProfile } from "@/hooks/use-profile";
import { countryLabel } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";
import { useAvatarUrl, useOnlineUsers } from "@/lib/avatar";
import { LiveActivity } from "@/components/whisly/LiveActivity";
import { TeaserCard } from "@/components/whisly/TeaserCard";
import { deleteStory, loadStories, toggleLike, toggleSave, type Category } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Feed — Whisly" },
      { name: "description", content: "Voice stories from people in your country." },
      { property: "og:title", content: "Feed — Whisly" },
      { property: "og:description", content: "Voice stories from people in your country." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Feed,
});

const TABS: { id: Category; icon: typeof Heart }[] = [
  { id: "all", icon: AudioLines },
  { id: "love", icon: Heart },
  { id: "life", icon: Flame },
  { id: "friendship", icon: Users },
  { id: "negative", icon: ShieldAlert },
  { id: "freedom", icon: Feather },
  { id: "family", icon: HandHeart },
  { id: "other", icon: Smile },
];

function Feed() {
  const { data: profile } = useProfile();
  const { t } = useI18n();
  const [tab, setTab] = useState<Category>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const unread = useUnread(profile?.id);
  const online = useOnlineUsers(profile?.country, profile?.id);
  const myAvatar = useAvatarUrl(profile?.avatar_url);
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
    onMutate: (s) => patch(s.id, (x) => ({ ...x, liked: !x.liked, likes_count: x.likes_count + (x.liked ? -1 : 1) })),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
    onError: () => toast.error("Couldn't delete story"),
  });

  const iconBtn = "rounded-full p-1.5 transition hover:bg-secondary hover:text-primary";

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 pb-28 pt-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:pb-10">
      {/* Desktop side navigation */}
      <aside className="sticky top-5 hidden h-fit space-y-2 lg:block">
        <Logo />
        <nav className="mt-6 space-y-1 font-medium">
          <Link to="/feed" className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-primary">
            <Home className="size-5" /> {t("home")}
          </Link>
          <Link to="/profile" className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-secondary">
            <CircleUserRound className="size-5" /> {t("profile")}
          </Link>
          <Link to="/record" className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gradient-cta py-3 font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
            <Plus className="size-5" /> {t("createVoice")}
          </Link>
        </nav>
      </aside>

      <main className="min-w-0">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="lg:invisible"><Logo /></div>
          <div className="flex items-center gap-1 text-foreground sm:gap-2">
            <LanguageSwitcher />
            <Link to="/messages" search={{}} aria-label={t("messages")} className={cn(iconBtn, "relative hidden lg:block")}>
              <MessageCircle className="size-6" strokeWidth={1.8} />
              <Badge n={unread.messages} />
            </Link>
            <Link to="/notifications" aria-label={t("notifications")} className={cn(iconBtn, "relative")}>
              <Bell className="size-6" strokeWidth={1.8} />
              <Badge n={unread.notifications} />
            </Link>
            <button aria-label={t("filterByCategory")} className={iconBtn} onClick={() => setSearchOpen(true)}>
              <Search className="size-6" strokeWidth={1.8} />
            </button>
            <Link to="/profile" aria-label={t("profile")} className={iconBtn}>
              <CircleUserRound className="size-7" strokeWidth={1.8} />
            </Link>
          </div>
        </header>

        <Link to="/record" className="group mt-6 flex flex-col items-center lg:hidden">
          <span className="flex size-20 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground shadow-glow transition group-hover:scale-105">
            <Plus className="size-10" strokeWidth={2.5} />
          </span>
          <span className="mt-3 text-2xl font-bold text-primary">{t("createVoice")}</span>
          <span className="text-muted-foreground">{t("shareStory")}</span>
        </Link>

        <TeaserCard />

        {profile?.country && <MoodMatch country={profile.country} viewerId={profile.id} />}

        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                tab === tb.id ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-foreground hover:bg-accent",
              )}
            >
              <tb.icon className="size-4" strokeWidth={2} /> {t(tb.id)}
            </button>
          ))}
        </div>

        {profile?.country && (
          <p className="mt-4 px-1 text-sm text-muted-foreground">
            {t("storiesFrom")} <b className="text-foreground">{countryLabel(profile.country)}</b>
          </p>
        )}

        <section className="mt-3 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          )}
          {error && <p className="py-8 text-center text-destructive">{t("loadError")}</p>}
          {stories?.length === 0 && (
            <div className="rounded-3xl bg-card p-8 text-center shadow-soft">
              <p className="text-lg font-semibold">{t("noStories")}</p>
              <p className="mt-1 text-muted-foreground">{t("beFirst")}</p>
            </div>
          )}
          {stories?.map((s, i) => (
            <Fragment key={s.id}>
              <StoryCard
                story={s}
                isOwner={s.user_id === profile?.id}
                online={online.has(s.user_id)}
                avatarSrc={s.user_id === profile?.id ? myAvatar : null}
                viewerId={profile?.id}
                onLike={() => like.mutate(s)}
                onSave={() => save.mutate(s)}
                onDelete={() => confirm(t("deleteConfirm")) && del.mutate(s.id)}
              />
              {i % 4 === 2 && <AdSlot />}
            </Fragment>
          ))}
        </section>
      </main>

      <aside className="sticky top-5 hidden h-fit lg:block">
        <AdSlot variant="sidebar" />
      </aside>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="rounded-4xl">
          <DialogHeader>
            <DialogTitle>{t("filterByCategory")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                onClick={() => {
                  setTab(tb.id);
                  setSearchOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-4 py-3 text-start font-medium transition",
                  tab === tb.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
                )}
              >
                <tb.icon className="size-5" /> <span className="flex-1">{t(tb.id)}</span>
                {tab === tb.id && <Check className="size-4" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <LiveActivity />
      <BottomNav active="home" />
    </div>
  );
}
