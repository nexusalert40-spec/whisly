import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Bitcoin, Coins, Copy, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/whisly/Logo";
import { PayPalCheckout } from "@/components/whisly/PayPalCheckout";
import { GooglePayButton } from "@/components/whisly/GooglePayButton";
import { GradientButton } from "@/components/whisly/fields";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { createCreditsOrder } from "@/lib/paypal.functions";
import { CREDIT_PACKS, CRYPTO_WALLETS, isValidTxHash, type CryptoNetwork, type PackId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/credits")({
  head: () => ({
    meta: [
      { title: "Buy credits — Whisly" },
      { name: "description", content: "Buy Whisly credits with PayPal, Google Pay or crypto." },
      { property: "og:title", content: "Buy credits — Whisly" },
      { property: "og:description", content: "Buy Whisly credits with PayPal, Google Pay or crypto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Credits,
});

type Method = "paypal" | "gpay" | "crypto";

function Credits() {
  const { t } = useI18n();
  const { data: profile } = useProfile();
  const [pack, setPack] = useState<PackId>("pack_550");
  const [method, setMethod] = useState<Method>("paypal");
  const createOrder = useServerFn(createCreditsOrder);
  const p = CREDIT_PACKS[pack];

  const methods: { id: Method; label: string; icon: typeof Wallet }[] = [
    { id: "paypal", label: t("payPaypal"), icon: Wallet },
    { id: "gpay", label: t("payGooglePay"), icon: CreditCard },
    { id: "crypto", label: t("payCrypto"), icon: Bitcoin },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-12 pt-5">
      <header className="flex items-center gap-4">
        <Link to="/profile" aria-label="Back" className="text-primary"><ArrowLeft className="size-7" /></Link>
        <Logo />
      </header>
      <h1 className="mt-6 text-3xl font-bold">{t("buyCreditsTitle")}</h1>
      <p className="mt-1 flex items-center gap-2 text-muted-foreground">
        <Coins className="size-4 text-primary" /> {t("credits")}: <b className="text-foreground">{profile?.credits ?? 0}</b>
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {(Object.keys(CREDIT_PACKS) as PackId[]).map((id) => (
          <button key={id} onClick={() => setPack(id)} className={cn("rounded-3xl border-2 bg-card p-3 text-center shadow-soft", pack === id ? "border-primary" : "border-transparent")}>
            <p className="text-xl font-bold">{CREDIT_PACKS[id].credits}</p>
            <p className="text-sm text-muted-foreground">${CREDIT_PACKS[id].price}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-full bg-secondary p-1">
        {methods.map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)} className={cn("flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold", method === m.id ? "bg-card text-primary shadow-soft" : "text-muted-foreground")}>
            <m.icon className="size-4" /> {m.label}
          </button>
        ))}
      </div>

      <section className="mt-5">
        {method === "paypal" && <PayPalCheckout key={pack} createOrder={() => createOrder({ data: { packId: pack } })} />}
        {method === "gpay" && <GooglePayButton amount={p.price} label={`Whisly ${p.credits} credits`} />}
        {method === "crypto" && <CryptoFlow pack={pack} />}
      </section>
    </main>
  );
}

function CryptoFlow({ pack }: { pack: PackId }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [network, setNetwork] = useState<CryptoNetwork>("eth_arbitrum");
  const [hash, setHash] = useState("");

  const { data: history } = useQuery({
    queryKey: ["crypto-payments", profile?.id],
    enabled: !!profile,
    queryFn: async () => (await supabase.from("crypto_payments").select("*").eq("user_id", profile!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!isValidTxHash(network, hash)) throw new Error("That doesn't look like a valid transaction hash");
      const { error } = await supabase.from("crypto_payments").insert({ user_id: profile!.id, network, pack_id: pack, tx_hash: hash.trim() });
      if (error) throw new Error(error.code === "23505" ? "This transaction was already submitted" : "Couldn't submit");
    },
    onSuccess: () => {
      setHash("");
      toast.success("Submitted — credits are released after we verify the payment.");
      void qc.invalidateQueries({ queryKey: ["crypto-payments"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Send exactly <b className="text-foreground">${CREDIT_PACKS[pack].price}</b> worth to one wallet below, then paste the transaction hash.
      </p>
      {(Object.keys(CRYPTO_WALLETS) as CryptoNetwork[]).map((n) => (
        <button key={n} onClick={() => setNetwork(n)} className={cn("w-full rounded-3xl border-2 bg-card p-4 text-start shadow-soft", network === n ? "border-primary" : "border-transparent")}>
          <p className="font-semibold">{CRYPTO_WALLETS[n].label}</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 break-all text-xs text-muted-foreground">{CRYPTO_WALLETS[n].address}</code>
            <span
              role="button"
              tabIndex={0}
              aria-label="Copy address"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard.writeText(CRYPTO_WALLETS[n].address).then(() => toast.success(t("copied")));
              }}
              className="rounded-full p-2 text-primary hover:bg-secondary"
            >
              <Copy className="size-4" />
            </span>
          </div>
        </button>
      ))}
      <label className="block text-sm font-medium">{t("txHash")}</label>
      <input value={hash} onChange={(e) => setHash(e.target.value)} placeholder={network === "btc" ? "64-character hex" : "0x…"} className="h-12 w-full rounded-full border bg-muted/60 px-4 font-mono text-sm outline-none focus:border-primary" />
      <GradientButton onClick={() => submit.mutate()} loading={submit.isPending}>{t("submitTx")}</GradientButton>
      {!!history?.length && (
        <ul className="space-y-2 pt-2">
          {history.map((h) => (
            <li key={h.id} className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-2 text-sm">
              <span className="truncate font-mono">{h.tx_hash.slice(0, 14)}…</span>
              <span className={cn("font-semibold capitalize", h.status === "approved" ? "text-primary" : h.status === "rejected" ? "text-destructive" : "text-muted-foreground")}>{h.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
