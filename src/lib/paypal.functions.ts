import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREDIT_PACKS, PLANS, normaliseSupportAmount, type PackId, type PlanId } from "./plans";
import { captureOrder, createOrder, fulfilIfValid } from "./paypal.server";

function originOf() {
  const req = getRequest();
  return new URL(req.url).origin;
}

async function recordPayment(row: {
  user_id: string;
  kind: "upgrade" | "support" | "credits";
  plan_id?: string;
  story_id?: string;
  credits?: number;
  amount: string;
  paypal_order_id: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("payments").insert({ ...row, amount: Number(row.amount) });
  if (error) throw new Error("Could not record payment");
}

/** Public PayPal client id for the JS SDK (it is not a secret). */
export const getPaypalClientId = createServerFn({ method: "GET" }).handler(async () => ({
  clientId: process.env["PAYPAL_CLIENT_ID"] ?? null,
}));

export const createUpgradeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ planId: z.enum(["month_1", "month_6", "year_1"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const plan = PLANS[data.planId as PlanId];
    const origin = originOf();
    const order = await createOrder({
      amount: plan.price,
      description: `Whisly — ${plan.label}`,
      customId: `upgrade:${context.userId}:${data.planId}`,
      returnUrl: `${origin}/payment-return`,
      cancelUrl: `${origin}/upgrade`,
    });
    await recordPayment({ user_id: context.userId, kind: "upgrade", plan_id: data.planId, amount: plan.price, paypal_order_id: order.id });
    return { orderId: order.id, approveUrl: order.approveUrl };
  });

export const createCreditsOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ packId: z.enum(["pack_100", "pack_550", "pack_1200"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const pack = CREDIT_PACKS[data.packId as PackId];
    const origin = originOf();
    const order = await createOrder({
      amount: pack.price,
      description: `Whisly — ${pack.credits} credits`,
      customId: `credits:${context.userId}:${data.packId}`,
      returnUrl: `${origin}/payment-return`,
      cancelUrl: `${origin}/credits`,
    });
    await recordPayment({ user_id: context.userId, kind: "credits", plan_id: data.packId, credits: pack.credits, amount: pack.price, paypal_order_id: order.id });
    return { orderId: order.id, approveUrl: order.approveUrl };
  });

export const createSupportOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ storyId: z.string().uuid(), amount: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const amount = normaliseSupportAmount(data.amount);
    if (!amount) throw new Error("Amount must be between $1 and $100");
    const { data: story } = await context.supabase.from("stories").select("id, user_id, title").eq("id", data.storyId).maybeSingle();
    if (!story) throw new Error("Story not found");
    if (story.user_id === context.userId) throw new Error("You can't support your own story");
    const origin = originOf();
    const order = await createOrder({
      amount,
      description: `Support for "${story.title}" on Whisly`,
      customId: `support:${story.id}`,
      returnUrl: `${origin}/payment-return`,
      cancelUrl: `${origin}/feed`,
    });
    await recordPayment({ user_id: context.userId, kind: "support", story_id: story.id, amount, paypal_order_id: order.id });
    return { orderId: order.id, approveUrl: order.approveUrl };
  });

/** Capture + verification happen here, server-side (also used by the SDK's onApprove). */
export const capturePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().min(5).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: p } = await context.supabase
      .from("payments")
      .select("kind, status")
      .eq("paypal_order_id", data.orderId)
      .maybeSingle(); // RLS: only the buyer's own payments are visible
    if (!p) throw new Error("Payment not found");
    if (p.status === "completed") return { ok: true, kind: p.kind };
    const cap = await captureOrder(data.orderId);
    const r = await fulfilIfValid(data.orderId, cap);
    if (!r.ok) throw new Error("Payment was not completed");
    return { ok: true, kind: p.kind };
  });
