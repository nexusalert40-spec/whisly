import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Coins, Gift, Heart, Loader2, MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/whisly/BottomNav";
import { useProfile } from "@/hooks/use-profile";
import { useI18n } from "@/lib/i18n";
import { loadNotifications, markAllNotificationsRead, useUnread } from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Whisly" },
      { name: "description", content: "Likes, messages and gifts on Whisly." },
      { property: "og:title", content: "Notifications — Whisly" },
      { property: "og:description", content: "Likes, messages and gifts on Whisly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});

const ICON = { like: Heart, message: MessageCircle, gift: Gift, credits: Coins } as const;

function Notifications() {
  const { t } = useI18n();
  const { data: profile } = useProfile();
  const me = profile?.id;
  const qc = useQueryClient();
  useUnread(me);
  const { data, isLoading } = useQuery({ queryKey: ["notifications", me], enabled: !!me, queryFn: () => loadNotifications(me!) });

  async function readAll() {
    if (!me) return;
    await markAllNotificationsRead(me);
    void qc.invalidateQueries({ queryKey: ["notifications"] });
    void qc.invalidateQueries({ queryKey: ["unread"] });
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-5">
      <header className="flex items-center gap-3">
        <Link to="/feed" aria-label="Back" className="text-primary"><ArrowLeft className="size-7" /></Link>
        <h1 className="flex-1 text-2xl font-bold">{t("notifications")}</h1>
        <button onClick={readAll} className="text-sm font-medium text-primary">{t("markAllRead")}</button>
      </header>
      <section className="mt-5 space-y-2">
        {isLoading && <Loader2 className="mx-auto size-7 animate-spin text-primary" />}
        {data?.length === 0 && <p className="rounded-3xl bg-card p-8 text-center text-muted-foreground shadow-soft">{t("noNotifications")}</p>}
        {data?.map((n) => {
          const Icon = ICON[n.kind as keyof typeof ICON] ?? Heart;
          const who = n.actorName || t("someone");
          const text =
            n.kind === "like" ? `${who} ${t("notifLike")}` :
            n.kind === "message" ? `${who} ${t("notifMessage")}` :
            n.kind === "gift" ? `${who} ${t("notifGift")} (+${n.amount})` :
            `${t("notifCredits")} (+${n.amount})`;
          const body = (
            <div className={cn("flex items-center gap-3 rounded-3xl p-4 shadow-soft", n.read ? "bg-card" : "bg-secondary")}>
              <span className="flex size-10 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground"><Icon className="size-5" /></span>
              <div className="flex-1">
                <p className="font-medium">{text}</p>
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read && <span className="size-2.5 rounded-full bg-brand-pink" />}
            </div>
          );
          return n.kind === "message" && n.actor_id ? (
            <Link key={n.id} to="/messages" search={{ with: n.actor_id }}>{body}</Link>
          ) : (
            <div key={n.id}>{body}</div>
          );
        })}
      </section>
      <BottomNav active="notifications" />
    </main>
  );
}
