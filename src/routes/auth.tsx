import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/whisly/Logo";
import { GoogleIcon } from "@/components/whisly/fields";
import { signInWithGoogle } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { DownloadApp } from "@/components/whisly/DownloadApp";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Whisly" },
      { name: "description", content: "Sign in or create your Whisly account with Google or email." },
      { property: "og:title", content: "Sign in to Whisly" },
      { property: "og:description", content: "Sign in or create your Whisly account with Google or email." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // Already signed in (or just back from Google) → go to the feed.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/feed", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/feed", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function google() {
    setBusy(true);
    const res = await signInWithGoogle();
    if (res.error) {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/feed", replace: true });
  }


  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      <div className="flex flex-col items-center text-center">
        <LogoMark className="h-24" />
        <h1 className="mt-4 text-6xl font-extrabold tracking-tight text-foreground">Whisly</h1>
        <p dir="ltr" className="mt-3 text-xl text-foreground/80">Your voice. Your story.</p>
        <p className="mt-4 text-base leading-relaxed text-foreground/80">{t("homeLead")}</p>
      </div>

      <div className="mt-10 space-y-4">
        <button
          onClick={google}
          disabled={busy}
          className="flex h-15 w-full items-center justify-center gap-4 rounded-full bg-card text-lg font-medium text-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>
        <Link
          to="/login"
          className="flex h-15 w-full items-center justify-center gap-4 rounded-full bg-primary text-lg font-medium text-primary-foreground shadow-glow transition active:scale-[0.98]"
        >
          <Mail className="size-6" />
          Continue with email
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-4 px-6 text-sm font-semibold text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>
      <p className="mt-6 text-center text-foreground/80">
        New to Whisly?{" "}
        <Link to="/signup" className="font-semibold text-primary">
          Create account
        </Link>
      </p>


      <DownloadApp />

      <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        {t("legalFooterPrefix")}{" "}
        <Link to="/legal" className="font-semibold text-primary underline-offset-4 hover:underline">{t("legalTitle")}</Link>
      </p>
    </main>
  );
}
