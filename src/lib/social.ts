// Messaging + notifications on Lovable Cloud (realtime via postgres changes, RLS-scoped).
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Message = { id: string; sender_id: string; recipient_id: string; body: string; read_at: string | null; created_at: string };

export async function displayNames(ids: string[]) {
  const uniq = [...new Set(ids)];
  if (!uniq.length) return new Map<string, string>();
  const { data } = await supabase.rpc("get_display_names", { _ids: uniq });
  return new Map((data ?? []).map((r) => [r.id, r.name ?? ""]));
}

/** One row per conversation partner, newest first. */
export async function loadInbox(me: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const byPeer = new Map<string, { peer: string; last: Message; unread: number }>();
  for (const m of data) {
    const peer = m.sender_id === me ? m.recipient_id : m.sender_id;
    const row = byPeer.get(peer) ?? { peer, last: m, unread: 0 };
    if (m.recipient_id === me && !m.read_at) row.unread++;
    byPeer.set(peer, row);
  }
  const rows = [...byPeer.values()];
  const names = await displayNames(rows.map((r) => r.peer));
  return rows.map((r) => ({ ...r, name: names.get(r.peer) || "Whisly user" }));
}

export async function loadThread(me: string, peer: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${me},recipient_id.eq.${peer}),and(sender_id.eq.${peer},recipient_id.eq.${me})`)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(me: string, peer: string, body: string) {
  const { error } = await supabase.from("messages").insert({ sender_id: me, recipient_id: peer, body: body.trim() });
  if (error) throw new Error(error.code === "42501" ? "You can't message this person yet" : "Message not sent");
}

export async function markThreadRead(me: string, peer: string) {
  await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("recipient_id", me).eq("sender_id", peer).is("read_at", null);
  await supabase.from("notifications").update({ read: true }).eq("user_id", me).eq("kind", "message").eq("actor_id", peer).eq("read", false);
}

export async function loadNotifications(me: string) {
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", me).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  const names = await displayNames(data.flatMap((n) => (n.actor_id ? [n.actor_id] : [])));
  return data.map((n) => ({ ...n, actorName: n.actor_id ? names.get(n.actor_id) || null : null }));
}

export async function markAllNotificationsRead(me: string) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", me).eq("read", false);
}

async function unreadCounts(me: string) {
  const [n, m] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me).eq("read", false).neq("kind", "message"),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", me).is("read_at", null),
  ]);
  return { notifications: n.count ?? 0, messages: m.count ?? 0 };
}

/**
 * Badge counts + a realtime listener: any new message / like / gift for the
 * viewer refreshes badges, inbox, threads and the notification list.
 */
export function useUnread(me: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`user-${me}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${me}` }, () => {
        void qc.invalidateQueries({ queryKey: ["unread"] });
        void qc.invalidateQueries({ queryKey: ["notifications"] });
        void qc.invalidateQueries({ queryKey: ["profile"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${me}` }, () => {
        void qc.invalidateQueries({ queryKey: ["unread"] });
        void qc.invalidateQueries({ queryKey: ["inbox"] });
        void qc.invalidateQueries({ queryKey: ["thread"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [me, qc]);
  return useQuery({ queryKey: ["unread", me], enabled: !!me, queryFn: () => unreadCounts(me!) }).data ?? { notifications: 0, messages: 0 };
}
