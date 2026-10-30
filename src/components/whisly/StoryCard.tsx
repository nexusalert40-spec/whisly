import { useState } from "react";
import { Bookmark, Flag, Gift, Heart, MessageCircle, MoreHorizontal, Share2, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AudioPlayer } from "./AudioPlayer";
import { SupportDialog } from "./SupportDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { recordPlay, reportStory, type StoryCategory } from "@/lib/stories";
import { cn } from "@/lib/utils";

export type FeedStory = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  duration_seconds: number;
  likes_count: number;
  plays_count: number;
  support_amount: number;
  created_at: string;
  signedUrl?: string;
  liked: boolean;
  saved: boolean;
};

function ago(iso: string, lang: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (s < 3600) return rtf.format(-Math.max(0, Math.floor(s / 60)), "minute");
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour");
  return rtf.format(-Math.floor(s / 86400), "day");
}

const REASONS = ["Hate or harassment", "Sexual content", "Violence or self-harm", "Spam or scam", "Other"];

export function StoryCard({
  story,
  isOwner,
  viewerId,
  onLike,
  onSave,
  onDelete,
}: {
  story: FeedStory;
  isOwner: boolean;
  viewerId?: string | undefined;
  onLike: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const { t, lang } = useI18n();
  const [support, setSupport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function share() {
    const url = `${window.location.origin}/feed?story=${story.id}`;
    const data = { title: `Whisly — ${story.title}`, text: story.title, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("linkCopied"));
      }
    } catch {
      /* user cancelled the share sheet */
    }
  }

  async function report(reason: string) {
    if (!viewerId) return;
    setBusy(true);
    try {
      await reportStory(story.id, viewerId, reason);
      toast.success(t("reported"));
      setReporting(false);
    } catch {
      toast.error("Couldn't send report");
    } finally {
      setBusy(false);
    }
  }

  const action = "flex items-center justify-center gap-2 rounded-2xl px-1 py-1.5 transition hover:bg-secondary active:scale-95";

  return (
    <article className="rounded-3xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5 sm:p-5">
      <header className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-secondary-foreground">
          <UserRound className="size-7" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">{isOwner ? t("you") : t("anonymous")}</p>
          <p className="truncate text-sm text-muted-foreground">
            {ago(story.created_at, lang)} • {t(story.category as StoryCategory)}
          </p>
        </div>
        {isOwner && onDelete && (
          <button onClick={onDelete} aria-label="Delete story" className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-destructive">
            <Trash2 className="size-5" />
          </button>
        )}
      </header>
      <h2 className="mt-3 text-xl font-bold leading-snug">{story.title}</h2>
      <div className="mt-3">
        <AudioPlayer src={story.signedUrl} seed={story.id} duration={story.duration_seconds} onFirstPlay={() => void recordPlay(story.id)} />
      </div>
      <footer className="mt-3 grid grid-cols-4 text-sm">
        <button onClick={onLike} className={action}>
          <Heart className={cn("size-6 transition", story.liked ? "scale-110 fill-brand-pink text-brand-pink" : "text-primary")} strokeWidth={1.75} />
          <span className="text-start leading-tight">
            {t("like")}
            <br />
            <span className="text-muted-foreground">{story.likes_count}</span>
          </span>
        </button>
        <button onClick={() => (isOwner ? toast(t("you")) : setSupport(true))} className={action}>
          <Gift className="size-6 text-primary" strokeWidth={1.75} />
          {t("support")}
        </button>
        <button onClick={onSave} className={action}>
          <Bookmark className={cn("size-6 text-primary", story.saved && "fill-primary")} strokeWidth={1.75} />
          {story.saved ? t("saved") : t("save")}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className={action}>
            <MoreHorizontal className="size-6 text-primary" strokeWidth={1.75} /> {t("more")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            {!isOwner && (
              <DropdownMenuItem onClick={() => navigate({ to: "/messages", search: { with: story.user_id } })}>
                <MessageCircle className="me-2 size-4" /> {t("messageCreator")}
              </DropdownMenuItem>
            )}
            {!isOwner && (
              <DropdownMenuItem onClick={() => setReporting(true)}>
                <Flag className="me-2 size-4" /> {t("report")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={share}>
              <Share2 className="me-2 size-4" /> {t("share")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
      <SupportDialog storyId={story.id} title={story.title} open={support} onOpenChange={setSupport} />
      <Dialog open={reporting} onOpenChange={setReporting}>
        <DialogContent className="rounded-4xl">
          <DialogHeader>
            <DialogTitle>{t("reportTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("reportReason")}</p>
          <div className="grid gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                disabled={busy}
                onClick={() => report(r)}
                className="rounded-2xl bg-secondary px-4 py-3 text-start font-medium transition hover:bg-accent disabled:opacity-50"
              >
                {r}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
