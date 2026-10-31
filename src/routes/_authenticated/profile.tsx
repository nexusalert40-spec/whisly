import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Coins, Crown, Headphones, Heart, Loader2, LogOut, Mic } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/whisly/Logo";
import { BottomNav } from "@/components/whisly/BottomNav";
import { LanguageSwitcher } from "@/components/whisly/LanguageSwitcher";
import { StoryCard } from "@/components/whisly/StoryCard";
import { AvatarImage, EditProfile } from "@/components/whisly/EditProfile";
import { useAvatarUrl } from "@/lib/avatar";
import { useProfile } from "@/hooks/use-profile";
import { countryLabel } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";
import { deleteStory, loadStories } from "@/lib/stories";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Whisly" },
      { name: "description", content: "Your account, credits, statistics and published stories." },
      { property: "og:title", content: "Your profile — Whisly" },
      { property: "og:description", content: "Your account, credits, statistics and published stories." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { data: profile } = useProfile();
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const avatarSrc = useAvatarUrl(profile?.avatar_url);
  // Only this user's own published stories.
  const { data: stories, isLoading } = useQuery({
    queryKey: ["my-stories", profile?.id],
    enabled: !!profile,
    queryFn: () => loadStories({ userId: profile!.id, category: "all", viewerId: profile!.id }),
  });
  const del = useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-stories"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("Couldn't delete story"),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const expiry = profile?.subscription_expiry_date ? new Date(profile.subscription_expiry_date) : null;
  const active = expiry && expiry > new Date();
  const likes = stories?.reduce((n, s) => n + s.likes_count, 0) ?? 0;
  const plays = stories?.reduce((n, s) => n + s.plays_count, 0) ?? 0;
  const stats = [
    { label: t("likesReceived"), value: likes, icon: Heart },
    { label: t("plays"), value: plays, icon: Headphones },
    { label: t("stories"), value: stories?.length ?? 0, icon: Mic },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/feed" aria-label="Back" className="hidden rounded-full p-2 transition hover:bg-secondary lg:block">
            <ArrowLeft className="size-5 rtl:rotate-180" />
          </Link>
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={signOut} className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary">
            <LogOut className="size-4 rtl:rotate-180" /> <span className="hidden sm:inline">{t("signOut")}</span>
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <AvatarImage path={profile?.avatar_url} className="size-16 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{profile?.name || "Whisly user"}</p>
              <p className="text-sm text-muted-foreground">{countryLabel(profile?.country)}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-soft p-3 text-center">
                <s.icon className="mx-auto size-5 text-primary" />
                <p className="mt-1 text-xl font-bold">{s.value}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("credits")}</p>
              <p className="flex items-center gap-2 text-3xl font-bold">
                <Coins className="size-7 text-brand-pink" /> {profile?.credits ?? 0}
              </p>
            </div>
            <div className="text-end text-sm">
              <p className="flex items-center justify-end gap-1 font-semibold">
                <Crown className="size-4 text-primary" />
                {profile?.account_level === "premium" && active ? t("premium") : t("free")}
              </p>
              <p className="text-muted-foreground">{active ? `${t("activeUntil")} ${expiry!.toLocaleDateString()}` : t("noMembership")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/upgrade" className="flex h-12 items-center justify-center rounded-full bg-secondary font-semibold text-primary transition hover:bg-accent">
              {t("premium")}
            </Link>
            <Link to="/credits" className="flex h-12 items-center justify-center rounded-full bg-gradient-cta font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
              {t("buyCreditsTitle")}
            </Link>
          </div>
        </section>
      </div>

      {profile && <EditProfile profile={profile} />}

      <h2 className="mt-8 px-1 text-lg font-bold">{t("myStories")}</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {isLoading && <Loader2 className="mx-auto size-6 animate-spin text-primary" />}
        {stories?.length === 0 && <p className="px-1 text-muted-foreground">{t("noMine")}</p>}
        {stories?.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            isOwner
            avatarSrc={avatarSrc}
            viewerId={profile?.id}
            onLike={() => {}}
            onSave={() => {}}
            onDelete={() => confirm(t("deleteConfirm")) && del.mutate(s.id)}
          />
        ))}
      </div>
      <BottomNav active="profile" />
    </main>
  );
}
