import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Signed URL for a private avatar path (`<user_id>/…`). */
export function useAvatarUrl(path: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["avatar-url", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("avatars").createSignedUrl(path!, 3600);
      return data?.signedUrl ?? null;
    },
  });
  return data ?? null;
}

export async function uploadAvatar(userId: string, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

/** Real presence: which user ids are currently signed in and viewing the app in this country. */
export function useOnlineUsers(country: string | null | undefined, userId: string | undefined) {
  const [online, setOnline] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!country || !userId) return;
    const ch = supabase.channel(`online:${country}`, { config: { presence: { key: userId } } });
    ch.on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(ch.presenceState()))))
      .subscribe((s) => {
        if (s === "SUBSCRIBED") void ch.track({ at: Date.now() });
      });
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [country, userId]);
  return online;
}
