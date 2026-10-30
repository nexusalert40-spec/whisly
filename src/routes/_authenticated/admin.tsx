import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CREDIT_PACKS, type PackId } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Whisly" },
      { name: "description", content: "Verify crypto payments." },
      { property: "og:title", content: "Admin — Whisly" },
      { property: "og:description", content: "Verify crypto payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

/** Crypto verification queue. Only admins see rows (RLS) and can review (RPC checks the role). */
function Admin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-crypto"],
    queryFn: async () => (await supabase.from("crypto_payments").select("*").eq("status", "pending").order("created_at")).data ?? [],
  });
  const review = useMutation({
    mutationFn: async (v: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("review_crypto_payment", { _id: v.id, _approve: v.approve });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-crypto"] }),
    onError: (e) => toast.error(e.message),
  });
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-5">
      <header className="flex items-center gap-3">
        <Link to="/profile" className="text-primary"><ArrowLeft className="size-7" /></Link>
        <h1 className="text-2xl font-bold">Crypto payments to verify</h1>
      </header>
      <p className="mt-2 text-sm text-muted-foreground">Check each hash on Arbiscan / a BTC explorer before approving.</p>
      <ul className="mt-4 space-y-2">
        {data?.length === 0 && <li className="text-muted-foreground">Nothing pending (or you aren't an admin).</li>}
        {data?.map((c) => (
          <li key={c.id} className="rounded-3xl bg-card p-4 shadow-soft">
            <p className="font-semibold">{c.network === "btc" ? "BTC" : "ETH · Arbitrum"} — {CREDIT_PACKS[c.pack_id as PackId]?.credits} credits (${CREDIT_PACKS[c.pack_id as PackId]?.price})</p>
            <a
              className="block break-all font-mono text-xs text-primary underline"
              target="_blank"
              rel="noreferrer"
              href={c.network === "btc" ? `https://mempool.space/tx/${c.tx_hash}` : `https://arbiscan.io/tx/${c.tx_hash}`}
            >
              {c.tx_hash}
            </a>
            <div className="mt-3 flex gap-2">
              <button onClick={() => review.mutate({ id: c.id, approve: true })} className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Check className="size-4" /> Approve</button>
              <button onClick={() => review.mutate({ id: c.id, approve: false })} className="flex items-center gap-1 rounded-full bg-secondary px-4 py-2 text-sm font-semibold"><X className="size-4" /> Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
