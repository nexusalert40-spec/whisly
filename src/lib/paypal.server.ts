// Server-only PayPal REST helpers. Secrets are read inside each call.

function base() {
  return process.env["PAYPAL_ENV"] === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function accessToken(): Promise<string> {
  const id = process.env["PAYPAL_CLIENT_ID"];
  const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!id || !secret) throw new Error("PayPal is not configured yet");
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("PayPal error", path, res.status, JSON.stringify(body));
    throw new Error(`PayPal request failed (${res.status})`);
  }
  return body as T;
}

type Link = { href: string; rel: string };

export async function createOrder(opts: {
  amount: string;
  description: string;
  customId: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const order = await call<{ id: string; links: Link[] }>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: opts.amount },
          description: opts.description.slice(0, 127),
          custom_id: opts.customId.slice(0, 127),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Whisly",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: opts.returnUrl,
            cancel_url: opts.cancelUrl,
          },
        },
      },
    }),
  });
  const approve = order.links.find((l) => l.rel === "payer-action" || l.rel === "approve");
  if (!approve) throw new Error("PayPal did not return an approval link");
  return { id: order.id, approveUrl: approve.href };
}

export type CaptureResult = {
  status: string;
  amount: string | null;
  currency: string | null;
};

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  type Cap = {
    status: string;
    purchase_units?: { payments?: { captures?: { status: string; amount: { value: string; currency_code: string } }[] } }[];
  };
  let res: Cap;
  try {
    res = await call<Cap>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: { "PayPal-Request-Id": `cap-${orderId}` },
    });
  } catch {
    // Already captured (e.g. by the webhook) — read the order instead.
    res = await call<Cap>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  }
  const cap = res.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: cap?.status ?? res.status,
    amount: cap?.amount.value ?? null,
    currency: cap?.amount.currency_code ?? null,
  };
}

/** Verify a webhook delivery with PayPal's signature-verification API. */
export async function verifyWebhook(headers: Headers, event: unknown): Promise<boolean> {
  const webhookId = process.env["PAYPAL_WEBHOOK_ID"];
  if (!webhookId) return false;
  const h = (n: string) => headers.get(n) ?? "";
  const res = await call<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: h("paypal-auth-algo"),
        cert_url: h("paypal-cert-url"),
        transmission_id: h("paypal-transmission-id"),
        transmission_sig: h("paypal-transmission-sig"),
        transmission_time: h("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: event,
      }),
    },
  );
  return res.verification_status === "SUCCESS";
}

/** Shared fulfilment: checks amount against the stored payment, then applies it once. */
export async function fulfilIfValid(orderId: string, cap: CaptureResult) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: p } = await supabaseAdmin
    .from("payments")
    .select("amount, currency, status")
    .eq("paypal_order_id", orderId)
    .maybeSingle();
  if (!p) return { ok: false as const, reason: "unknown order" };
  if (p.status === "completed") return { ok: true as const };
  if (cap.status !== "COMPLETED") return { ok: false as const, reason: `status ${cap.status}` };
  if (cap.currency !== p.currency || Number(cap.amount) !== Number(p.amount)) {
    await supabaseAdmin.from("payments").update({ status: "amount_mismatch" }).eq("paypal_order_id", orderId);
    return { ok: false as const, reason: "amount mismatch" };
  }
  const { error } = await supabaseAdmin.rpc("fulfil_payment", { _order_id: orderId });
  if (error) throw error;
  return { ok: true as const };
}
