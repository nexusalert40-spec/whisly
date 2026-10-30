import type { Lang } from "./i18n";

/** Primary supported language per country (ISO alpha-2). Unlisted countries fall back to English. */
const MAP: Record<Lang, string[]> = {
  en: ["US", "GB", "CA", "AU", "NZ", "IE", "IN", "NG", "GH", "KE", "ZA", "JM", "SG", "PH", "UG", "ZW", "ZM", "BS", "BB", "TT"],
  fr: ["FR", "BE", "LU", "MC", "SN", "CI", "CM", "ML", "BF", "NE", "TG", "BJ", "GA", "CG", "CD", "MG", "HT", "GN", "TD", "CF", "BI", "RW", "DJ", "KM", "SC"],
  it: ["IT", "SM", "VA"],
  ru: ["RU", "BY", "KZ", "KG", "TJ"],
  ms: ["MY", "BN"],
  ja: ["JP"],
  ar: ["DZ", "SA", "EG", "MA", "TN", "LY", "AE", "QA", "KW", "BH", "OM", "YE", "JO", "LB", "SY", "IQ", "PS", "SD", "MR"],
  es: ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "BO", "PY", "UY", "CR", "PA", "GT", "HN", "SV", "NI", "CU", "DO", "PR", "GQ"],
  pt: ["PT", "BR", "AO", "MZ", "CV", "GW", "ST", "TL"],
};

const LOOKUP: Record<string, Lang> = Object.fromEntries(
  (Object.entries(MAP) as [Lang, string[]][]).flatMap(([lang, codes]) => codes.map((c) => [c, lang])),
);

export function languageForCountry(code: string | null | undefined): Lang {
  return (code && LOOKUP[code.toUpperCase()]) || "en";
}
