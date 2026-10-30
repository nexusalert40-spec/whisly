import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Loader2, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/whisly/Logo";
import { BottomNav } from "@/components/whisly/BottomNav";
import { StoryCard } from "@/components/whisly/StoryCard";
import { useProfile } from "@/hooks/use-profile";
import { countryName } from "@/lib/countries";
import { deleteStory, loadStories } from "@/lib/stories";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Whisly" },
      { name: "description", content: "Your account, membership and stories." },
      { property: "og:title", content: "Your profile — Whisly" },
      { property: "og:description", content: "Your account, membership and stories." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: stories, isLoading } = useQuery({
    queryKey: ["my-stories", profile?.id],
    enabled: !!profile,
    queryFn: () => loadStories({ userId: profile!.id, category: "all", viewerId: profile!.id }),
  });
  const del = useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      toast.success("Story deleted");
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

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <button onClick={signOut} aria-label="Sign out" className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <LogOut className="size-5" /> Sign out
        </button>
      </header>

      <section className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent text-secondary-foreground">
            <UserRound className="size-9" fill="currentColor" />
          </div>
          <div>
            <p className="text-xl font-bold">{profile?.name || "Whisly user"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="text-sm text-muted-foreground">{countryName(profile?.country)}</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-soft p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Crown className="size-5 text-primary" />
            {profile?.account_level === "premium" && active ? "Premium" : "Free"} account
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {active ? `Active until ${expiry!.toLocaleDateString()}` : "No active membership"}
          </p>
          <Link
            to="/upgrade"
            className="mt-3 flex h-12 items-center justify-center rounded-full bg-gradient-cta font-semibold text-primary-foreground shadow-glow"
          >
            {active ? "Extend membership" : "Upgrade account"}
          </Link>
        </div>
      </section>

      <h2 className="mt-6 px-1 text-lg font-bold">My stories</h2>
      <div className="mt-3 space-y-4">
        {isLoading && <Loader2 className="mx-auto size-6 animate-spin text-primary" />}
        {stories?.length === 0 && <p className="px-1 text-muted-foreground">You haven't published anything yet.</p>}
        {stories?.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            isOwner
            onLike={() => {}}
            onSave={() => {}}
            onDelete={() => confirm("Delete this story?") && del.mutate(s.id)}
          />
        ))}
      </div>
      <BottomNav active="profile" />
    </main>
  );
}
