import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Logo, LogoMark, WaveFooter } from "@/components/whisly/Logo";
import { Field, GradientButton } from "@/components/whisly/fields";
import { loginSchema } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Whisly" },
      { name: "description", content: "Log in to your Whisly account." },
      { property: "og:title", content: "Log in — Whisly" },
      { property: "og:description", content: "Log in to your Whisly account." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("confirm") ? "Please confirm your email first." : "Wrong email or password.");
      return;
    }
    navigate({ to: "/feed", replace: true });
  }

  async function forgot() {
    const email = form.email.trim();
    if (!loginSchema.shape.email.safeParse(email).success) {
      setErrors({ email: "Enter your email above first" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error("Couldn't send the reset email. Try again later.");
    else toast.success("Check your inbox for a reset link.");
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md overflow-hidden px-6 pb-40 pt-6">
      <div className="flex items-center gap-4">
        <Link to="/" aria-label="Back" className="text-primary">
          <ArrowLeft className="size-7" />
        </Link>
        <Logo />
      </div>

      <form onSubmit={submit} className="relative z-10 mt-12 rounded-4xl bg-card px-6 py-8 shadow-soft">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-14" />
          <h1 className="mt-4 text-3xl font-bold">Welcome back!</h1>
          <p className="mt-1 text-muted-foreground">Log in to your Whisly account</p>
        </div>
        <div className="mt-6 space-y-4">
          <Field
            label="Email"
            icon={<Mail />}
            type="email"
            autoComplete="email"
            placeholder="example@mail.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors["email"]}
          />
          <Field
            label="Password"
            icon={<Lock />}
            password
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors["password"]}
          />
        </div>
        <GradientButton type="submit" loading={loading} className="mt-6">
          Log in
        </GradientButton>
        <button type="button" onClick={forgot} className="mx-auto mt-5 block font-semibold text-primary">
          Forgot password?
        </button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary">
            Create account
          </Link>
        </p>
      </form>
      <WaveFooter />
    </main>
  );
}
