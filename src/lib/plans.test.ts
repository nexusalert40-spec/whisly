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
