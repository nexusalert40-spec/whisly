import { describe, expect, it, vi } from "vitest";
import { acceptLegalTerms, declineLegalTerms } from "./legal";

describe("Legal decisions", () => {
  it("sends acceptance to registration", () => {
    const navigate = vi.fn();
    acceptLegalTerms(navigate);
    expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: "/signup" });
  });
  it("closes the application or leaves the site when tab closure is blocked", () => {
    const close = vi.fn();
    const replace = vi.fn();
    declineLegalTerms({ close, location: { replace } });
    expect(close).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledExactlyOnceWith("about:blank");
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(replace.mock.invocationCallOrder[0] ?? 0);
  });
});