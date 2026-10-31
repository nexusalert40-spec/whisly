import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Act = { kind: string; actor: string; amount: number | null };

function text(a: Act) {
  if (a.kind === "joined") return `${a.actor} just joined! 👋`;
  if (a.kind === "story") return `${a.actor} shared a new voice story 🎙️`;
  return `${a.actor} sent ${a.amount ?? ""} credits as a gift 🎁`;
}

/** Floating ticker of real recent activity in the viewer's country, shown once per session (up to 3 alerts). */
export function LiveActivity() {
  const { data } = useQuery({
    queryKey: ["recent-activity"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recent_activity");
      if (error) throw error;
      return (data ?? []) as Act[];
    },
  });
  const [i, setI] = useState(-1);
  const [items, setItems] = useState<Act[]>([]);
  useEffect(() => {
    if (!data?.length || i !== -1) return;
    if (sessionStorage.getItem("whisly-live-shown")) return;
    sessionStorage.setItem("whisly-live-shown", "1");
    setItems(data.slice(0, 3));
    setI(0);
  }, [data, i]);
  useEffect(() => {
    if (i < 0 || i >= items.length) return;
    const id = setTimeout(() => setI((n) => n + 1), 4000);
    return () => clearTimeout(id);
  }, [i, items.length]);
  const a = items[i];
  if (!a) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-40 flex justify-center px-4">
      <div
        key={i}
        className="animate-live-toast flex items-center gap-2 rounded-full border border-border/50 bg-card/55 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur-xl backdrop-saturate-150"
      >
        <span className="size-2 rounded-full bg-online shadow-[0_0_8px_var(--color-online)]" />
        {text(a)}
      </div>
    </div>
  );
}
