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

// Credit packs (placeholder prices). Must match pack ids in the crypto_payments check
// and review_crypto_payment() in the database.
export type PackId = "pack_100" | "pack_550" | "pack_1200";
export const CREDIT_PACKS: Record<PackId, { credits: number; price: string }> = {
  pack_100: { credits: 100, price: "0.99" },
  pack_550: { credits: 550, price: "4.99" },
  pack_1200: { credits: 1200, price: "9.99" },
};

export const CRYPTO_WALLETS = {
  eth_arbitrum: { label: "Binance · ETH (Arbitrum One)", address: "0x753Db4F99846DAfc585bcA3cA124821d0D7dF63F" },
  btc: { label: "Trust Wallet · BTC", address: "bc1q368d2erhav6qzh7pwv7evtju66jea7d3r7qtae" },
} as const;
export type CryptoNetwork = keyof typeof CRYPTO_WALLETS;

/** Loose shape check for a submitted transaction hash. */
export function isValidTxHash(network: CryptoNetwork, hash: string): boolean {
  const h = hash.trim();
  return network === "eth_arbitrum" ? /^0x[0-9a-fA-F]{64}$/.test(h) : /^[0-9a-fA-F]{64}$/.test(h);
}
