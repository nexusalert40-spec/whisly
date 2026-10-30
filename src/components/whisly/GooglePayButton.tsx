import { useState } from "react";
import { toast } from "sonner";

// Google Pay via the browser PaymentRequest API. Runs in TEST mode until a
// card processor (gateway) and Google merchant id are configured below.
const GOOGLE_PAY = {
  environment: "TEST" as "TEST" | "PRODUCTION",
  merchantName: "Whisly",
  merchantId: "", // Google Pay & Wallet Console merchant id (account: nexusalert40@gmail.com)
  gateway: "example", // e.g. "stripe" once a processor is connected
  gatewayMerchantId: "exampleGatewayMerchantId",
};

export function GooglePayButton({ amount, label }: { amount: string; label: string }) {
  const [busy, setBusy] = useState(false);

  async function pay() {
    if (typeof window === "undefined" || !("PaymentRequest" in window)) {
      toast.error("Google Pay isn't supported in this browser. Try Chrome.");
      return;
    }
    const method: PaymentMethodData = {
      supportedMethods: "https://google.com/pay",
      data: {
        environment: GOOGLE_PAY.environment,
        apiVersion: 2,
        apiVersionMinor: 0,
        merchantInfo: { merchantName: GOOGLE_PAY.merchantName, ...(GOOGLE_PAY.merchantId && { merchantId: GOOGLE_PAY.merchantId }) },
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: { allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"], allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"] },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: { gateway: GOOGLE_PAY.gateway, gatewayMerchantId: GOOGLE_PAY.gatewayMerchantId },
            },
          },
        ],
      },
    };
    const req = new PaymentRequest([method], { total: { label, amount: { currency: "USD", value: amount } } });
    setBusy(true);
    try {
      if (!(await req.canMakePayment())) {
        toast.error("Google Pay isn't available on this device.");
        return;
      }
      const res = await req.show();
      // The card token must be charged by a processor server-side; none is connected yet.
      await res.complete("fail");
      toast("Google Pay sheet works — card charging needs a payment processor before credits can be added. No charge was made.");
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) toast.error("Google Pay couldn't start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={pay}
      disabled={busy}
      className="flex h-12 w-full items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
    >
      Pay with G Pay
    </button>
  );
}
