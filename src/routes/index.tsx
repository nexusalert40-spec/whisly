import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Mic, Headphones, Heart, Gift, Sparkles, MessageCircle, Shield } from "lucide-react";
import { Logo, LogoMark } from "@/components/whisly/Logo";
import { useI18n } from "@/lib/i18n";
import { DownloadApp } from "@/components/whisly/DownloadApp";

const TITLE = "Whisly — Social audio app for real voice stories";
const DESC =
  "Whisly is a social audio platform: record a true story in your own voice (up to 5 minutes), share it with your country's feed, and listen to real stories from people near you.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://whisly.lovable.app/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://whisly.lovable.app/" }],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Mic, title: "Record in your voice", body: "Tap the mic and tell a real moment from your life in up to 5 minutes." },
  { icon: Globe, title: "Your country's feed", body: "Stories are shared with listeners in your own country, so they feel close to home." },
  { icon: Headphones, title: "Listen by category", body: "Love, life, friendship, family, freedom and more — pick what you want to hear." },
  { icon: Sparkles, title: "Mood match", body: "Describe how you feel and Whisly suggests stories that fit your mood." },
  { icon: Heart, title: "Like and save", body: "Keep the stories that move you and show creators you listened." },
  { icon: Gift, title: "Support creators", body: "Gift credits to storytellers whose voices you love." },
  { icon: MessageCircle, title: "Messages", body: "Chat privately with other members and get live notifications." },
  { icon: Shield, title: "Private by design", body: "Recordings are stored privately and only signed-in members can listen." },
];

function Landing() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between py-4">
        <Link to="/" aria-label="Whisly home"><Logo size="sm" /></Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth" className="rounded-full px-4 py-2 text-sm font-semibold text-primary">Login</Link>
          <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">Sign Up</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center py-10 text-center">
          <LogoMark className="h-20" />
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            The social audio app for <span className="text-gradient-brand">real voice stories</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg">{t("homeLead")}</p>
          <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="flex h-13 flex-1 items-center justify-center rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-glow">Sign Up free</Link>
            <Link to="/auth" className="flex h-13 flex-1 items-center justify-center rounded-full bg-card py-3 font-semibold text-foreground shadow-soft">Login</Link>
          </div>
        </section>

        <section className="py-8">
          <h2 className="text-center text-2xl font-bold text-foreground">Features</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-3xl bg-card p-5 shadow-soft">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground"><Icon className="size-5" /></span>
                <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-md py-4"><DownloadApp /></section>
      </main>

      <footer className="mt-10 border-t border-border py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-sm text-muted-foreground">
        <nav className="flex flex-wrap justify-center gap-4">
          <Link to="/legal" className="hover:text-primary">{t("legalTitle")}</Link>
          <a href="mailto:nexusalert40@gmail.com" className="hover:text-primary">Contact</a>
          <Link to="/auth" className="hover:text-primary">Login</Link>
          <Link to="/signup" className="hover:text-primary">Sign Up</Link>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} Whisly. Your voice. Your story.</p>
      </footer>
    </div>
  );
}
