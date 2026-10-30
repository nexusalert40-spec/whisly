import { createFileRoute, Navigate, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

// Signed-in area. Session lives in browser storage, so this gate runs client-side only.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/" });
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { data: profile, isLoading } = useProfile();
  const { pathname } = useLocation();
  const { applyCountry } = useI18n();
  // App language follows the registered country (manual switcher in Profile overrides).
  useEffect(() => {
    applyCountry(profile?.country);
  }, [profile?.country, applyCountry]);
  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  // Google sign-ups don't carry a country — ask for it before anything else.
  if (profile && !profile.country && pathname !== "/onboarding") return <Navigate to="/onboarding" />;
  return <Outlet />;
}
