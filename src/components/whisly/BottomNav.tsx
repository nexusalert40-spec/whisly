import { Link } from "@tanstack/react-router";
import { Bell, Home, MessageCircle, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Mobile/tablet bottom bar; hidden on desktop where the sidebar takes over. */
export function BottomNav({ active }: { active: "home" | "profile" }) {
  const { t } = useI18n();
  const soon = () => toast(t("soon"));
  const item = (on: boolean) =>
    cn("flex flex-col items-center gap-1 rounded-2xl px-3 py-1 transition hover:text-primary", on ? "text-primary" : "text-foreground/80");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="flex h-18 items-center justify-around">
        <Link to="/feed" aria-label={t("home")} className={item(active === "home")}>
          <Home className="size-6" strokeWidth={active === "home" ? 2.4 : 1.8} />
          <span className="text-[11px] font-medium">{t("home")}</span>
        </Link>
        <button onClick={soon} aria-label={t("messages")} className={item(false)}>
          <MessageCircle className="size-6" strokeWidth={1.8} />
          <span className="text-[11px] font-medium">{t("messages")}</span>
        </button>
        <Link
          to="/record"
          aria-label={t("createVoice")}
          className="-mt-8 flex size-16 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
        >
          <Plus className="size-8" strokeWidth={2.5} />
        </Link>
        <button onClick={soon} aria-label={t("notifications")} className={item(false)}>
          <Bell className="size-6" strokeWidth={1.8} />
          <span className="text-[11px] font-medium">{t("notifications").slice(0, 12)}</span>
        </button>
        <Link to="/profile" aria-label={t("profile")} className={item(active === "profile")}>
          <UserRound className="size-6" strokeWidth={active === "profile" ? 2.4 : 1.8} />
          <span className="text-[11px] font-medium">{t("profile")}</span>
        </Link>
      </div>
    </nav>
  );
}
