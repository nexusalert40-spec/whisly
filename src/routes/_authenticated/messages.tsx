import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { BottomNav } from "@/components/whisly/BottomNav";
import { useProfile } from "@/hooks/use-profile";
import { useI18n } from "@/lib/i18n";
import { displayNames, loadInbox, loadThread, markThreadRead, sendMessage, useUnread } from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: z.object({ with: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Messages — Whisly" },
      { name: "description", content: "Your private Whisly conversations." },
      { property: "og:title", content: "Messages — Whisly" },
      { property: "og:description", content: "Your private Whisly conversations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Messages,
});

function Messages() {
  const { with: peer } = Route.useSearch();
  const { data: profile } = useProfile();
  const me = profile?.id;
  useUnread(me);
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-5">
      {me && (peer ? <Thread me={me} peer={peer} /> : <Inbox me={me} />)}
      <BottomNav active="messages" />
    </main>
  );
}

function Inbox({ me }: { me: string }) {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["inbox", me], queryFn: () => loadInbox(me) });
  return (
    <>
      <header className="flex items-center gap-3">
        <Link to="/feed" aria-label="Back" className="text-primary"><ArrowLeft className="size-7" /></Link>
        <h1 className="text-2xl font-bold">{t("inbox")}</h1>
      </header>
      <section className="mt-5 space-y-2">
        {isLoading && <Loader2 className="mx-auto size-7 animate-spin text-primary" />}
        {data?.length === 0 && <p className="rounded-3xl bg-card p-8 text-center text-muted-foreground shadow-soft">{t("noConversations")}</p>}
        {data?.map((c) => (
          <Link key={c.peer} to="/messages" search={{ with: c.peer }} className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft transition hover:bg-secondary">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent"><UserRound className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.name}</p>
              <p className="truncate text-sm text-muted-foreground">{c.last.sender_id === me ? `${t("you")}: ` : ""}{c.last.body}</p>
            </div>
            {c.unread > 0 && <span className="rounded-full bg-brand-pink px-2 py-0.5 text-xs font-bold text-primary-foreground">{c.unread}</span>}
          </Link>
        ))}
      </section>
    </>
  );
}

function Thread({ me, peer }: { me: string; peer: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const { data: name } = useQuery({ queryKey: ["name", peer], queryFn: async () => (await displayNames([peer])).get(peer) || "Whisly user" });
  const { data: msgs, isLoading } = useQuery({ queryKey: ["thread", me, peer], queryFn: () => loadThread(me, peer) });

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
    if (msgs?.some((m) => m.recipient_id === me && !m.read_at)) {
      void markThreadRead(me, peer).then(() => qc.invalidateQueries({ queryKey: ["unread"] }));
    }
  }, [msgs, me, peer, qc]);

  const send = useMutation({
    mutationFn: () => sendMessage(me, peer, text),
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["thread", me, peer] });
      void qc.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <header className="flex items-center gap-3 border-b pb-3">
        <button onClick={() => nav({ to: "/messages", search: {} })} aria-label="Back" className="text-primary"><ArrowLeft className="size-7" /></button>
        <span className="flex size-10 items-center justify-center rounded-full bg-accent"><UserRound className="size-5" /></span>
        <h1 className="text-lg font-bold">{name}</h1>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {isLoading && <Loader2 className="mx-auto size-6 animate-spin text-primary" />}
        {msgs?.map((m) => (
          <div key={m.id} className={cn("max-w-[80%] rounded-3xl px-4 py-2.5", m.sender_id === me ? "ms-auto bg-gradient-cta text-primary-foreground" : "bg-card shadow-soft")}>
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p className="mt-0.5 text-[10px] opacity-70">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) send.mutate();
        }}
        className="flex items-center gap-2 rounded-full border bg-card p-1.5 ps-4"
      >
        <input value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder={t("typeMessage")} className="h-10 flex-1 bg-transparent outline-none" />
        <button disabled={!text.trim() || send.isPending} aria-label={t("send")} className="flex size-10 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground disabled:opacity-50">
          <Send className="size-5" />
        </button>
      </form>
    </div>
  );
}
