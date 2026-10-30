import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Reserved space for automated ads (e.g. Google AdSense). Replace the inner
 * placeholder with the provider's <ins> tag once the ad account is approved.
 */
export function AdSlot({ variant = "banner", className }: { variant?: "banner" | "sidebar"; className?: string }) {
  const { t } = useI18n();
  return (
    <aside
      aria-label={t("ad")}
      data-ad-slot={variant}
      className={cn(
        "flex items-center justify-center rounded-3xl border border-dashed bg-card/60 text-xs uppercase tracking-widest text-muted-foreground",
        variant === "banner" ? "h-24" : "h-[600px]",
        className,
      )}
    >
      {t("ad")}
    </aside>
  );
}
