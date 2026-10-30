import { describe, expect, it } from "vitest";
import { languageForCountry } from "./country-language";

describe("languageForCountry", () => {
  it("maps US/UK to English", () => {
    expect(languageForCountry("US")).toBe("en");
    expect(languageForCountry("GB")).toBe("en");
  });
  it("maps France to French", () => expect(languageForCountry("FR")).toBe("fr"));
  it("maps Algeria/Saudi Arabia/Egypt to Arabic", () => {
    expect(["DZ", "SA", "EG"].map(languageForCountry)).toEqual(["ar", "ar", "ar"]);
  });
  it("maps Spain/Mexico to Spanish", () => {
    expect(["ES", "MX"].map(languageForCountry)).toEqual(["es", "es"]);
  });
  it("falls back to English", () => expect(languageForCountry("ZZ")).toBe("en"));
});
