import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { PayPalCheckout } from "@/components/whisly/PayPalCheckout";
import { Logo } from "@/components/whisly/Logo";
import { createUpgradeOrder } from "@/lib/paypal.functions";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade — Whisly" },
      { name: "description", content: "Extend your Whisly membership and unlock Premium." },
      { property: "og:title", content: "Upgrade — Whisly" },
      { property: "og:description", content: "Extend your Whisly membership and unlock Premium." },
    ],
  }),
  component: Upgrade,
});

function Upgrade() {
  const [plan, setPlan] = useState<PlanId>("month_6");
  const create = useServerFn(createUpgradeOrder);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-5">
      <header className="flex items-center gap-4">
        <Link to="/profile" aria-label="Back" className="text-primary">
          <ArrowLeft className="size-7" />
        </Link>
        <Logo />
      </header>
      <div className="mt-8 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-orb text-primary-foreground shadow-glow">
          <Crown className="size-8" />
        </span>
        <h1 className="mt-4 text-3xl font-bold">Go Premium</h1>
        <p className="mt-1 text-muted-foreground">Extend your registration and upgrade your account.</p>
      </div>
      <div className="mt-6 space-y-3">
        {(Object.keys(PLANS) as PlanId[]).map((id) => (
          <button
            key={id}
            onClick={() => setPlan(id)}
            className={cn(
              "flex w-full items-center justify-between rounded-3xl border-2 bg-card p-5 text-left shadow-soft",
              plan === id ? "border-primary" : "border-transparent",
            )}
          >
            <div>
              <p className="text-lg font-semibold">{PLANS[id].label}</p>
              <p className="text-sm text-muted-foreground">+{PLANS[id].days} days</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">${PLANS[id].price}</span>
              <span className={cn("flex size-6 items-center justify-center rounded-full", plan === id ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                {plan === id && <Check className="size-4" />}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6">
        <PayPalCheckout key={plan} createOrder={() => create({ data: { planId: plan } })} />
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        One-time payment. Time is added to your current membership.
      </p>
    </main>
  );
}
