import { Link } from "@tanstack/react-router";
import { Home, Megaphone, MessageSquare, Plus, User } from "lucide-react";
import { toast } from "sonner";

export function BottomNav({ active }: { active: "home" | "profile" }) {
  const soon = () => toast("Coming soon");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="flex h-18 items-center justify-around">
        <Link to="/feed" aria-label="Home" className={active === "home" ? "text-primary" : "text-foreground"}>
          <Home className="size-7" fill={active === "home" ? "currentColor" : "none"} />
          {active === "home" && <span className="mt-1 block h-1 rounded-full bg-primary" />}
        </Link>
        <button onClick={soon} aria-label="Messages" className="text-foreground">
          <MessageSquare className="size-7" />
        </button>
        <Link
          to="/record"
          aria-label="Create voice"
          className="-mt-8 flex size-16 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground shadow-glow"
        >
          <Plus className="size-8" strokeWidth={2.5} />
        </Link>
        <button onClick={soon} aria-label="Announcements" className="text-foreground">
          <Megaphone className="size-7" />
        </button>
        <Link to="/profile" aria-label="Profile" className={active === "profile" ? "text-primary" : "text-foreground"}>
          <User className="size-7" />
          {active === "profile" && <span className="mt-1 block h-1 rounded-full bg-primary" />}
        </Link>
      </div>
    </nav>
  );
}
