import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { capturePayment, getPaypalClientId } from "@/lib/paypal.functions";

/**
 * Real PayPal JS SDK buttons. `createOrder` asks our server for an order id
 * (price decided server-side); `onApprove` captures + fulfils on the server.
 */
export function PayPalCheckout({ createOrder, onDone }: { createOrder: () => Promise<{ orderId: string }>; onDone?: () => void }) {
  const getId = useServerFn(getPaypalClientId);
  const capture = useServerFn(capturePayment);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["paypal-client-id"], queryFn: () => getId(), staleTime: Infinity });

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!data?.clientId)
    return <p className="rounded-2xl bg-secondary p-4 text-center text-sm text-muted-foreground">PayPal isn't connected yet — the PayPal keys still need to be added.</p>;

  return (
    <PayPalScriptProvider options={{ clientId: data.clientId, currency: "USD", intent: "capture" }}>
      <PayPalButtons
        style={{ layout: "vertical", shape: "pill", label: "pay" }}
        createOrder={async () => (await createOrder()).orderId}
        onApprove={async (d) => {
          try {
            await capture({ data: { orderId: d.orderID } });
            toast.success("Payment complete!");
            await qc.invalidateQueries({ queryKey: ["profile"] });
            onDone?.();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Payment failed");
          }
        }}
        onError={() => toast.error("PayPal checkout failed")}
      />
    </PayPalScriptProvider>
  );
}
