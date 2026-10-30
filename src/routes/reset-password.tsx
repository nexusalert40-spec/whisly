import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Logo, WaveFooter } from "@/components/whisly/Logo";
import { Field, GradientButton } from "@/components/whisly/fields";
import { passwordSchema } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Whisly" },
      { name: "description", content: "Choose a new password for your Whisly account." },
      { property: "og:title", content: "Reset password — Whisly" },
      { property: "og:description", content: "Choose a new password for your Whisly account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = passwordSchema.safeParse(pw);
    if (!r.success) return setError(r.error.issues[0].message);
    if (pw !== confirm) return setError("Passwords don't match");
    setError(undefined);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error("This reset link is invalid or expired. Request a new one.");
    toast.success("Password updated");
    navigate({ to: "/feed", replace: true });
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md overflow-hidden px-6 pb-40 pt-8">
      <Logo />
      <form onSubmit={submit} className="relative z-10 mt-10 space-y-4 rounded-4xl bg-card px-6 py-8 shadow-soft">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <Field label="New password" icon={<Lock />} password value={pw} onChange={(e) => setPw(e.target.value)} error={error} autoComplete="new-password" />
        <Field label="Confirm password" icon={<Lock />} password value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <GradientButton type="submit" loading={loading}>Update password</GradientButton>
      </form>
      <WaveFooter />
    </main>
  );
}
