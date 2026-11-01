import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Floating email/support link; sits above the mobile bottom bar. */
export function ContactButton() {
  const { t } = useI18n();
  const label = t("contactEditor");
  return (
    <a
      href="mailto:nexusalert40@gmail.com?subject=Report%20or%20Collaboration"
      aria-label={label}
      className="group fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] end-4 z-40 flex size-11 items-center justify-center rounded-full border bg-card/80 text-primary shadow-soft backdrop-blur-lg transition hover:scale-105 hover:shadow-glow active:scale-95 lg:bottom-6"
    >
      <Mail className="size-5" strokeWidth={1.8} />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full end-0 mb-2 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </a>
  );
}
