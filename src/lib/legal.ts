export const LEGAL_CONTACT_EMAIL = "nexusalert40@gmail.com";
export const LEGAL_UPDATED = "2026-10-30";

/** Keep consent navigation explicit and testable without modifying accounts. */
export function acceptLegalTerms(navigate: (options: { to: "/signup" }) => unknown) {
  return navigate({ to: "/signup" });
}

/** Browsers usually block closing user-opened tabs; leave Whisly in that case. */
export function declineLegalTerms(browser: {
  close: () => void;
  location: { replace: (url: string) => void };
}) {
  try { browser.close(); } finally { browser.location.replace("about:blank"); }
}