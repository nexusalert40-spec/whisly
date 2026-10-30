import { createFileRoute } from "@tanstack/react-router";
import { captureOrder, fulfilIfValid, verifyWebhook } from "@/lib/paypal.server";

// PayPal webhook: the backup path that guarantees fulfilment even if the
// buyer never returns to the app. Every event is signature-verified first.
export const Route = createFileRoute("/api/public/paypal-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let event: {
          event_type?: string;
          resource?: {
            id?: string;
            status?: string;
            amount?: { value: string; currency_code: string };
            supplementary_data?: { related_ids?: { order_id?: string } };
          };
        };
        try {
          event = await request.json();
        } catch {
          return new Response("bad request", { status: 400 });
        }
        try {
          if (!(await verifyWebhook(request.headers, event))) {
            return new Response("invalid signature", { status: 401 });
          }
          const r = event.resource ?? {};
          if (event.event_type === "CHECKOUT.ORDER.APPROVED" && r.id) {
            await fulfilIfValid(r.id, await captureOrder(r.id));
          } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
            const orderId = r.supplementary_data?.related_ids?.order_id;
            if (orderId && r.amount) {
              await fulfilIfValid(orderId, {
                status: r.status ?? "",
                amount: r.amount.value,
                currency: r.amount.currency_code,
              });
            }
          }
          return new Response("ok");
        } catch (e) {
          console.error("paypal webhook error", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
