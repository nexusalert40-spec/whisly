import { useState } from "react";
import { Bookmark, Gift, Heart, MoreHorizontal, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AudioPlayer } from "./AudioPlayer";
import { SupportDialog } from "./SupportDialog";
import { cn } from "@/lib/utils";

export type FeedStory = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  duration_seconds: number;
  likes_count: number;
  support_amount: number;
  created_at: string;
  signedUrl?: string;
  liked: boolean;
  saved: boolean;
};

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

export function StoryCard({
  story,
  isOwner,
  onLike,
  onSave,
  onDelete,
}: {
  story: FeedStory;
  isOwner: boolean;
  onLike: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const [support, setSupport] = useState(false);
  const cat = story.category[0].toUpperCase() + story.category.slice(1);

  return (
    <article className="rounded-3xl bg-card p-4 shadow-soft">
      <header className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-secondary-foreground">
          <UserRound className="size-7" fill="currentColor" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-primary">{isOwner ? "You" : "Anonymous"}</p>
          <p className="text-sm text-muted-foreground">
            {ago(story.created_at)} • {cat}
          </p>
        </div>
        {isOwner && onDelete ? (
          <button onClick={onDelete} aria-label="Delete story" className="text-muted-foreground">
            <Trash2 className="size-5" />
          </button>
        ) : (
          <MoreHorizontal className="size-6 text-foreground" />
        )}
      </header>
      <h2 className="mt-3 text-xl font-bold leading-snug">{story.title}</h2>
      <div className="mt-3">
        <AudioPlayer src={story.signedUrl} seed={story.id} duration={story.duration_seconds} />
      </div>
      <footer className="mt-3 grid grid-cols-4 divide-x text-sm">
        <button onClick={onLike} className="flex items-center gap-2 px-1">
          <Heart className={cn("size-6", story.liked ? "fill-brand-pink text-brand-pink" : "text-primary")} />
          <span className="text-left leading-tight">
            Like
            <br />
            <span className="text-muted-foreground">{story.likes_count}</span>
          </span>
        </button>
        <button
          onClick={() => (isOwner ? toast("This is your story") : setSupport(true))}
          className="flex items-center justify-center gap-2 px-1"
        >
          <Gift className="size-6 text-primary" />
          <span className="text-left leading-tight">
            Support
            <br />
            <span className="text-muted-foreground">${Number(story.support_amount).toFixed(0)}</span>
          </span>
        </button>
        <button onClick={onSave} className="flex items-center justify-center gap-2 px-1">
          <Bookmark className={cn("size-6 text-primary", story.saved && "fill-primary")} />
          {story.saved ? "Saved" : "Save"}
        </button>
        <button onClick={() => toast("More options coming soon")} className="flex items-center justify-center gap-1 px-1">
          <MoreHorizontal className="size-6 text-primary" /> More
        </button>
      </footer>
      <SupportDialog storyId={story.id} title={story.title} open={support} onOpenChange={setSupport} />
    </article>
  );
}
