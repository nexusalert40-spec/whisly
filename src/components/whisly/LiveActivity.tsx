import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Act = { kind: string; actor: string; amount: number | null };

function text(a: Act) {
  if (a.kind === "joined") return `${a.actor} just joined! 👋`;
  if (a.kind === "story") return `${a.actor} shared a new voice story 🎙️`;
  return `${a.actor} sent ${a.amount ?? ""} credits as a gift 🎁`;
}

/** Floating ticker of real recent activity in the viewer's country, rotating every 5 seconds. */
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
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!data?.length) return;
    const id = setInterval(() => setI((n) => (n + 1) % data.length), 5000);
    return () => clearInterval(id);
  }, [data?.length]);
  if (!data?.length) return null;
  const a = data[i % data.length];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-40 flex justify-center px-4">
      <div
        key={i}
        className="animate-live-toast flex items-center gap-2 rounded-full border border-border/50 bg-card/70 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur-md"
      >
        <span className="size-2 rounded-full bg-online shadow-[0_0_8px_var(--color-online)]" />
        {text(a)}
      </div>
    </div>
  );
}
