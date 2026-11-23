/**
 * How advance and balance invoices count in revenue. Pure (no browser or database
 * access) so reports on the server can use exactly the same rules as the app.
 *
 * An advance invoice and the receipt that later collects its balance are two
 * separate invoices: the advance counts what was taken up front, on the day it
 * was taken; the receipt counts the balance, on the day it was paid.
 */

import type { SalonInvoice } from "./salon-invoices";

type RevenueFields = Pick<SalonInvoice, "status" | "total" | "advanceAmount" | "balanceInvoiceOf" | "balanceInvoiceId">;

/**
 * Marks each advance invoice whose balance was collected on its own receipt
 * (`balanceInvoiceId`). Derived from the receipts, so older invoices are covered
 * without any migration. Call this on the full list before summing revenue.
 */
export function linkBalanceReceipts<T extends Pick<SalonInvoice, "id" | "balanceInvoiceOf" | "balanceInvoiceId">>(invoices: T[]): T[] {
  const receipt = new Map(invoices.filter((i) => i.balanceInvoiceOf).map((i) => [i.balanceInvoiceOf!, i.id]));
  return receipt.size ? invoices.map((i) => (receipt.has(i.id) ? { ...i, balanceInvoiceId: receipt.get(i.id) } : i)) : invoices;
}

/** What this invoice contributes to revenue totals. */
export function revenueAmount(inv: RevenueFields): number {
  if (inv.balanceInvoiceOf) return inv.total; // the balance, paid on its own receipt
  if (inv.balanceInvoiceId && inv.status === "paid") return inv.advanceAmount ?? 0; // its balance is on that receipt
  return inv.status === "partial" ? (inv.advanceAmount ?? 0) : inv.total;
}

/** The day revenueAmount() belongs to: an advance counts on the day it was issued, not when the balance was paid. */
export function revenueDate(inv: Pick<SalonInvoice, "date" | "paidDate" | "balanceInvoiceId">): string {
  return inv.balanceInvoiceId ? inv.date : inv.paidDate || inv.date;
}
