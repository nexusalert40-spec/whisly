import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Gift } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GradientButton } from "./fields";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PRESETS = [10, 50, 100, 500];

/** Gift credits to a story's creator. The transfer is atomic in the database (gift_credits). */
export function SupportDialog({ storyId, title, open, onOpenChange }: { storyId: string; title: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const balance = profile?.credits ?? 0;

  async function gift() {
    if (amount > balance) { toast.error(t("notEnoughCredits")); return; }
    setLoading(true);
    const { error } = await supabase.rpc("gift_credits", { _story_id: storyId, _amount: amount });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Sent ${amount} credits 🎁`);
    void qc.invalidateQueries({ queryKey: ["profile"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-4xl">
        <DialogHeader>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-plus text-primary-foreground"><Gift className="size-7" /></div>
          <DialogTitle className="text-center">{t("giftCredits")}</DialogTitle>
          <DialogDescription className="text-center">“{title}”</DialogDescription>
        </DialogHeader>
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Coins className="size-4 text-primary" /> {t("credits")}: <b className="text-foreground">{balance}</b></p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setAmount(p)} className={cn("rounded-full py-2.5 font-semibold", amount === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>{p}</button>
          ))}
        </div>
        {balance < amount ? (
          <Link to="/credits" className="flex h-12 items-center justify-center rounded-full bg-gradient-cta font-semibold text-primary-foreground">{t("buyCreditsTitle")}</Link>
        ) : (
          <GradientButton onClick={gift} loading={loading}>{t("giftCredits")} ({amount})</GradientButton>
        )}
      </DialogContent>
    </Dialog>
  );
}
