import { Link } from "@tanstack/react-router";
import { Bell, Home, MessageCircle, Plus, UserRound } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useI18n } from "@/lib/i18n";
import { useUnread } from "@/lib/social";
import { cn } from "@/lib/utils";

export function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-brand-pink px-1 text-center text-[10px] font-bold leading-4 text-primary-foreground">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Mobile/tablet bottom bar; hidden on desktop where the sidebar takes over. */
export function BottomNav({ active }: { active: "home" | "profile" | "messages" | "notifications" }) {
  const { t } = useI18n();
  const { data: profile } = useProfile();
  const unread = useUnread(profile?.id);
  const item = (on: boolean) =>
    cn("flex flex-col items-center gap-1 rounded-2xl px-3 py-1 transition hover:text-primary", on ? "text-primary" : "text-foreground/80");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="flex h-18 items-center justify-around">
        <Link to="/feed" aria-label={t("home")} className={item(active === "home")}>
          <Home className="size-6" strokeWidth={active === "home" ? 2.4 : 1.8} />
          <span className="text-[11px] font-medium">{t("home")}</span>
        </Link>
        <Link to="/messages" search={{}} aria-label={t("messages")} className={item(active === "messages")}>
          <span className="relative"><MessageCircle className="size-6" strokeWidth={1.8} /><Badge n={unread.messages} /></span>
          <span className="text-[11px] font-medium">{t("messages")}</span>
        </Link>
        <Link
          to="/record"
          aria-label={t("createVoice")}
          className="-mt-8 flex size-16 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95"
        >
          <Plus className="size-8" strokeWidth={2.5} />
        </Link>
        <Link to="/notifications" aria-label={t("notifications")} className={item(active === "notifications")}>
          <span className="relative"><Bell className="size-6" strokeWidth={1.8} /><Badge n={unread.notifications} /></span>
          <span className="text-[11px] font-medium">{t("notifications").slice(0, 12)}</span>
        </Link>
        <Link to="/profile" aria-label={t("profile")} className={item(active === "profile")}>
          <UserRound className="size-6" strokeWidth={active === "profile" ? 2.4 : 1.8} />
          <span className="text-[11px] font-medium">{t("profile")}</span>
        </Link>
      </div>
    </nav>
  );
}
