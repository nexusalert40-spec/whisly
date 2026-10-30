import { describe, expect, it } from "vitest";
import { MAX_RECORDING_SECONDS, normaliseSupportAmount, PLANS } from "./plans";

describe("plans & limits", () => {
  it("recordings max out at 5 minutes", () => {
    expect(MAX_RECORDING_SECONDS).toBe(300);
  });
  it("plan durations", () => {
    expect(PLANS.month_1.days).toBe(30);
    expect(PLANS.month_6.days).toBe(180);
    expect(PLANS.year_1.days).toBe(365);
  });
  it("support amount bounds", () => {
    expect(normaliseSupportAmount(0.5)).toBeNull();
    expect(normaliseSupportAmount(101)).toBeNull();
    expect(normaliseSupportAmount(5)).toBe("5.00");
  });
});

import { CREDIT_PACKS, CRYPTO_WALLETS, isValidTxHash } from "./plans";
describe("credits & crypto", () => {
  it("credit packs", () => {
    expect(CREDIT_PACKS.pack_100).toEqual({ credits: 100, price: "0.99" });
    expect(CREDIT_PACKS.pack_550).toEqual({ credits: 550, price: "4.99" });
    expect(CREDIT_PACKS.pack_1200).toEqual({ credits: 1200, price: "9.99" });
  });
  it("wallet addresses", () => {
    expect(CRYPTO_WALLETS.eth_arbitrum.address).toBe("0x753Db4F99846DAfc585bcA3cA124821d0D7dF63F");
    expect(CRYPTO_WALLETS.btc.address).toBe("bc1q368d2erhav6qzh7pwv7evtju66jea7d3r7qtae");
  });
  it("tx hash shape", () => {
    expect(isValidTxHash("eth_arbitrum", "0x" + "a".repeat(64))).toBe(true);
    expect(isValidTxHash("eth_arbitrum", "a".repeat(64))).toBe(false);
    expect(isValidTxHash("btc", "b".repeat(64))).toBe(true);
    expect(isValidTxHash("btc", "xyz")).toBe(false);
  });
});
