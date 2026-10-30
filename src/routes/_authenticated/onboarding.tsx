import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { toast } from "sonner";
import { Logo, WaveFooter } from "@/components/whisly/Logo";
import { Field, GradientButton } from "@/components/whisly/fields";
import { CountrySelect } from "@/components/whisly/CountrySelect";
import { isCountryCode } from "@/lib/countries";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Complete your profile — Whisly" },
      { name: "description", content: "Tell us where you're from to see stories near you." },
      { property: "og:title", content: "Complete your profile — Whisly" },
      { property: "og:description", content: "Tell us where you're from to see stories near you." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      if (profile.country) setCountry(profile.country);
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isCountryCode(country)) { setError("Choose your country"); return; }
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ country, name: name.trim().slice(0, 100) })
      .eq("id", profile.id);
    setLoading(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["profile"] });
    navigate({ to: "/feed", replace: true });
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md overflow-hidden px-6 pb-40 pt-8">
      <Logo />
      <form onSubmit={save} className="relative z-10 mt-10 space-y-4 rounded-4xl bg-card px-6 py-8 shadow-soft">
        <h1 className="text-2xl font-bold">One last step</h1>
        <p className="text-muted-foreground">Your feed shows stories from your country.</p>
        <Field label="Full name" icon={<User />} value={name} onChange={(e) => setName(e.target.value)} />
        <CountrySelect value={country} onChange={setCountry} error={error} />
        <GradientButton type="submit" loading={loading}>Continue</GradientButton>
      </form>
      <WaveFooter />
    </main>
  );
}
