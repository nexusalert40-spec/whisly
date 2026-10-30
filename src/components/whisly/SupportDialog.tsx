import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GradientButton } from "./fields";
import { createSupportOrder } from "@/lib/paypal.functions";
import { SUPPORT_PRESETS, normaliseSupportAmount } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function SupportDialog({
  storyId,
  title,
  open,
  onOpenChange,
}: {
  storyId: string;
  title: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [amount, setAmount] = useState("3");
  const [loading, setLoading] = useState(false);
  const create = useServerFn(createSupportOrder);

  async function pay() {
    const v = normaliseSupportAmount(Number(amount));
    if (!v) { toast.error("Choose an amount between $1 and $100"); return; }
    setLoading(true);
    try {
      const { approveUrl } = await create({ data: { storyId, amount: Number(v) } });
      window.location.href = approveUrl;
    } catch (e) {
      setLoading(false);
      toast.error(e instanceof Error ? e.message : "Couldn't start PayPal checkout");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-4xl">
        <DialogHeader>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground">
            <Gift className="size-7" />
          </div>
          <DialogTitle className="text-center">Support this creator</DialogTitle>
          <DialogDescription className="text-center">“{title}”</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {SUPPORT_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(String(p))}
              className={cn(
                "rounded-full py-2.5 font-semibold",
                Number(amount) === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              ${p}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border bg-muted/60 px-4">
          <span className="font-semibold text-muted-foreground">$</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="h-12 flex-1 bg-transparent outline-none"
            aria-label="Custom amount"
          />
        </label>
        <GradientButton onClick={pay} loading={loading}>Pay with PayPal</GradientButton>
        <p className="text-center text-xs text-muted-foreground">Secure payment via PayPal. $1 – $100.</p>
      </DialogContent>
    </Dialog>
  );
}
