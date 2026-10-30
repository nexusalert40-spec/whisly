// Upgrade / registration-extension plans. Prices are decided here on the
// server side only — the browser just sends a plan id.
export type PlanId = "month_1" | "month_6" | "year_1";

export const PLANS: Record<PlanId, { label: string; days: number; price: string }> = {
  month_1: { label: "1 month Premium", days: 30, price: "4.99" },
  month_6: { label: "6 months Premium", days: 180, price: "19.99" },
  year_1: { label: "12 months Premium", days: 365, price: "34.99" },
};

export const SUPPORT_MIN = 1;
export const SUPPORT_MAX = 100;
export const SUPPORT_PRESETS = [1, 3, 5, 10];

export const MAX_RECORDING_SECONDS = 300;

/** Normalise a support amount to 2 decimals, or null if out of range. */
export function normaliseSupportAmount(n: number): string | null {
  if (!Number.isFinite(n)) return null;
  const v = Math.round(n * 100) / 100;
  if (v < SUPPORT_MIN || v > SUPPORT_MAX) return null;
  return v.toFixed(2);
}
