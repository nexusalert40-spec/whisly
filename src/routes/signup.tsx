import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, CircleHelp, Lock, Mail, MailCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Logo, WaveFooter } from "@/components/whisly/Logo";
import { Field, GradientButton } from "@/components/whisly/fields";
import { CountrySelect } from "@/components/whisly/CountrySelect";
import { signupSchema } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Whisly" },
      { name: "description", content: "Join the Whisly community and share your voice." },
      { property: "og:title", content: "Sign up — Whisly" },
      { property: "og:description", content: "Join the Whisly community and share your voice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", country: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.name, country: parsed.data.country },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        /pwned|leaked|weak/i.test(error.message)
          ? "This password is too common. Choose another one."
          : error.message,
      );
      return;
    }
    setSent(true);
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md overflow-hidden px-5 pb-36 pt-6">
      <div className="flex items-center justify-between text-foreground">
        <Link to="/" aria-label="Back">
          <ChevronLeft className="size-7" />
        </Link>
        <CircleHelp className="size-7" />
      </div>
      <div className="mt-4 flex flex-col items-center">
        <Logo />
        <p className="ml-16 text-sm text-foreground/80">Your voice. Your story.</p>
      </div>

      {sent ? (
        <div className="relative z-10 mt-8 rounded-4xl bg-card px-6 py-10 text-center shadow-soft">
          <MailCheck className="mx-auto size-14 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We sent a confirmation link to <b>{form.email}</b>. Tap it to activate your account.
          </p>
          <Link to="/login" className="mt-6 inline-block font-semibold text-primary">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="relative z-10 mt-6 rounded-4xl bg-card px-5 py-7 shadow-soft">
          <h1 className="text-center text-2xl font-bold">Sign up for Whisly</h1>
          <p className="mt-1 text-center text-foreground/80">Join the Whisly community</p>
          <div className="mt-5 space-y-3">
            <Field label="Full name" icon={<User />} placeholder="eg. John Doe" autoComplete="name" value={form.name} onChange={set("name")} error={errors["name"]} />
            <Field label="Email" icon={<Mail />} type="email" placeholder="example@mail.com" autoComplete="email" value={form.email} onChange={set("email")} error={errors["email"]} />
            <CountrySelect value={form.country} onChange={(country) => setForm({ ...form, country })} error={errors["country"]} />
            <Field label="Password" icon={<Lock />} password placeholder="Enter your password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors["password"]} />
            <Field label="Confirm password" icon={<Lock />} password placeholder="Confirm your password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors["confirm"]} />
          </div>
          <GradientButton type="submit" loading={loading} className="mt-6">
            Register
          </GradientButton>
          <div className="mt-5 flex items-center gap-4 px-6 text-sm font-semibold text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </form>
      )}
      <p className="relative z-10 mt-6 text-center text-sm text-foreground/80">
        {t("legalFooterPrefix")}{" "}
        <Link to="/legal" className="font-semibold text-primary underline-offset-4 hover:underline">{t("legalTitle")}</Link>
      </p>
      <WaveFooter />
    </main>
  );
}
