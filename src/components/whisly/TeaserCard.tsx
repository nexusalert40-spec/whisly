import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KEY = "whisly-teaser-dismissed";

/** Dismissible launch teaser; dismissal is remembered on this device. */
export function TeaserCard() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => setShow(!localStorage.getItem(KEY)), []);
  if (!show) return null;
  const close = () => {
    localStorage.setItem(KEY, "1");
    setLeaving(true);
    setTimeout(() => setShow(false), 300);
  };
  return (
    <div
      className={cn(
        "animate-teaser-glow relative mt-6 flex items-center gap-3 overflow-hidden rounded-3xl bg-gradient-cta p-4 pe-11 text-primary-foreground transition-all duration-300",
        leaving && "scale-95 opacity-0",
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background/20 backdrop-blur-md">
        <Gift className="size-6" />
      </span>
      <p className="text-sm font-semibold leading-snug">{t("teaser")}</p>
      <button onClick={close} aria-label={t("dismiss")} className="absolute end-2 top-2 rounded-full p-1.5 transition hover:bg-background/20 active:scale-90">
        <X className="size-4" />
      </button>
    </div>
  );
}
