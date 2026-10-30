// Split out from lib/billing-db.ts (which pulls in the server-only @libsql/client)
// so client components — the salon-facing billing page, the printable invoice —
// can use this default without bundling a DB client into the browser.

/** Shown on an invoice for any salon that doesn't have a payment-detail override set. */
export const DEFAULT_BANK_DETAILS = {
  bankName: "Bank Alfalah",
  title: "TAREEZ TECH",
  accountNumber: "02291011176553",
  iban: "PK90ALFH0229001011176553",
};

/** The "Billed From" block on every salon's invoice — admin-editable, this is the fallback. */
export interface BilledFrom {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
}

export const DEFAULT_BILLED_FROM: BilledFrom = {
  name: "Salon Central",
  tagline: "Salon Management Software",
  phone: "+92 302 9646928",
  email: "",
  address: "Lahore, Pakistan",
};

/** billing_term_months value that means "Lifetime": one invoice, never renews (a 100-year term). */
export const LIFETIME_TERM_MONTHS = 1200;

export function isLifetimeTerm(months: number): boolean {
  return months >= LIFETIME_TERM_MONTHS;
}

export function termLabel(months: number): string {
  return isLifetimeTerm(months) ? "Lifetime" : `${months} month${months === 1 ? "" : "s"}`;
}
