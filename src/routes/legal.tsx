import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/whisly/Logo";
import { useI18n } from "@/lib/i18n";
import { acceptLegalTerms, declineLegalTerms, LEGAL_CONTACT_EMAIL } from "@/lib/legal";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Privacy Policy & Terms of Use — Whisly" },
      { name: "description", content: "Read Whisly's terms, privacy practices, community rules, payment conditions, and contact information." },
      { property: "og:title", content: "Privacy Policy & Terms of Use — Whisly" },
      { property: "og:description", content: "Whisly's legal terms, privacy policy, and acceptance options." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LegalPage,
});

const TERMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const PRIVACY = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function LegalPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-12 pt-6 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
        <Logo size="sm" />
        <Button asChild variant="ghost" size="icon">
          <Link to="/" aria-label={t("legalBack")} title={t("legalBack")}><ArrowLeft className="rtl:rotate-180" /></Link>
        </Button>
      </header>
      <div className="pb-8 pt-9">
        <ShieldCheck className="mb-4 size-8 text-primary" />
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{t("legalTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("legalUpdated")}</p>
        <p className="mt-5 leading-7 text-foreground/80">{t("legalIntro")}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("legalReview")}</p>
      </div>
      <article className="border-t border-border pt-8">
        <h2 className="mb-7 text-2xl font-bold">{t("legalTerms")}</h2>
        <div className="space-y-7">
          {TERMS.map((n) => <section key={n}>
            <h3 className="text-lg font-semibold">{t(`terms${n}Title`)}</h3>
            <p className="mt-2 leading-7 text-foreground/80">{t(`terms${n}Body`)}</p>
          </section>)}
        </div>
      </article>
      <article className="mt-10 border-t border-border pt-8">
        <h2 className="mb-7 text-2xl font-bold">{t("legalPrivacy")}</h2>
        <div className="space-y-7">
          {PRIVACY.map((n) => <section key={n}>
            <h3 className="text-lg font-semibold">{t(`privacy${n}Title`)}</h3>
            <p className="mt-2 leading-7 text-foreground/80">{t(`privacy${n}Body`)}</p>
          </section>)}
        </div>
      </article>
      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-2xl font-bold">{t("legalContact")}</h2>
        <p className="mt-3 leading-7 text-foreground/80">{t("legalContactBody")}</p>
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="mt-4 inline-flex max-w-full items-center gap-2 font-medium text-primary underline underline-offset-4">
          <Mail className="size-4 shrink-0" /><span className="break-all">{LEGAL_CONTACT_EMAIL}</span>
        </a>
      </section>
      <footer className="mt-9 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        <Button size="lg" className="h-12 bg-gradient-brand text-base" onClick={() => acceptLegalTerms(navigate)}><Check />{t("legalAgree")}</Button>
        <Button size="lg" variant="outline" className="h-12 text-base" onClick={() => declineLegalTerms(window)}><LogOut />{t("legalDecline")}</Button>
      </footer>
    </main>
  );
}