import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { z } from "zod";
import { capturePayment } from "@/lib/paypal.functions";

export const Route = createFileRoute("/_authenticated/payment-return")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Payment — Whisly" },
      { name: "description", content: "Confirming your PayPal payment." },
      { property: "og:title", content: "Payment — Whisly" },
      { property: "og:description", content: "Confirming your PayPal payment." },
    ],
  }),
  component: PaymentReturn,
});

function PaymentReturn() {
  const { token } = Route.useSearch(); // PayPal passes the order id as ?token=
  const capture = useServerFn(capturePayment);
  const qc = useQueryClient();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [kind, setKind] = useState<string>();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) return setState("error");
    capture({ data: { orderId: token } })
      .then((r) => {
        setKind(r.kind);
        setState("done");
        qc.invalidateQueries();
      })
      .catch(() => setState("error"));
  }, [token, capture, qc]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {state === "working" && (
        <>
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Confirming your payment…</p>
        </>
      )}
      {state === "done" && (
        <>
          <CheckCircle2 className="size-16 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Thank you!</h1>
          <p className="mt-1 text-muted-foreground">
            {kind === "upgrade" ? "Your membership has been extended." : "Your support was sent to the creator."}
          </p>
          <Link to={kind === "upgrade" ? "/profile" : "/feed"} className="mt-6 rounded-full bg-gradient-cta px-8 py-3 font-semibold text-primary-foreground">
            Continue
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <XCircle className="size-16 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Payment not completed</h1>
          <p className="mt-1 text-muted-foreground">No money was taken. If it was, it will be applied automatically shortly.</p>
          <Link to="/feed" className="mt-6 rounded-full bg-secondary px-8 py-3 font-semibold text-secondary-foreground">
            Back to feed
          </Link>
        </>
      )}
    </main>
  );
}
