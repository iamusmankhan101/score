/**
 * What the salon buys from vendors. A bill records the goods (and adds them to
 * stock); money paid to a vendor is an ordinary paid Expense tagged with
 * `vendor`, so Cash Flow counts it once, when the money actually leaves, and
 * can edit or delete it like any other expense.
 *
 * A vendor's balance is simply bills minus payments: above zero the salon owes
 * them (credit), below zero they are holding the salon's money (advance).
 */

import { locationUserKey } from "./locations";
import { persistEntity } from "./turso-sync";
import { addExpense, applyExpenseStock, expenseItemsTotal, getExpenses, linkExpenseItemsToInventory, saveExpenses, type Expense, type ExpenseItem } from "./expenses";

export type VendorPaymentMethod = "cash" | "bank";
/** How the bill was settled when it was entered. Credit and advance both pay nothing now; the balance does the rest. */
export type BillPayment = VendorPaymentMethod | "credit" | "advance";

export interface VendorBill {
  id: string;
  vendor: string;
  billNo?: string;
  date: string; // YYYY-MM-DD
  items: ExpenseItem[];
  total: number;
  payment: BillPayment;
  notes?: string;
  section?: string;
  createdAt: string; // ISO timestamp
}

export interface VendorBalance {
  vendor: string;
  billed: number;
  paid: number;
  /** Above zero: the salon owes this vendor. Below zero: advance held by the vendor. */
  balance: number;
}

const KEY = "werzio_vendor_bills";

const vendorKey = (name: string) => name.trim().toLowerCase();
export const sameVendor = (a: string, b: string) => vendorKey(a) === vendorKey(b);

export function getVendorBills(): VendorBill[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(locationUserKey(KEY)) ?? "[]"); } catch { return []; }
}

function saveVendorBills(list: VendorBill[]): Promise<boolean> {
  return persistEntity("vendor_bills", list);
}

/** Only money that has actually been paid counts against a vendor's bills. */
export const isVendorPayment = (e: Expense) => !!e.vendor?.trim() && e.paymentStatus !== "pending";

export function vendorBalances(bills: Pick<VendorBill, "vendor" | "total">[], expenses: Expense[]): VendorBalance[] {
  const byVendor = new Map<string, VendorBalance>();
  const row = (name: string) => {
    const key = vendorKey(name);
    let found = byVendor.get(key);
    if (!found) byVendor.set(key, found = { vendor: name.trim(), billed: 0, paid: 0, balance: 0 });
    return found;
  };
  for (const bill of bills) row(bill.vendor).billed += bill.total;
  for (const expense of expenses) if (isVendorPayment(expense)) row(expense.vendor!).paid += expense.amount;
  const list = [...byVendor.values()];
  for (const r of list) r.balance = r.billed - r.paid;
  return list.sort((a, b) => b.balance - a.balance || a.vendor.localeCompare(b.vendor));
}

export async function addVendorPayment(payment: { vendor: string; date: string; amount: number; method: VendorPaymentMethod; notes?: string; section?: string; vendorBillId?: string }): Promise<boolean> {
  const vendor = payment.vendor.trim();
  const { dbSaved } = await addExpense({
    date: payment.date, category: "supplies", description: `Payment to ${vendor}`, amount: payment.amount,
    paymentMethod: payment.method, paymentStatus: "paid", vendor,
    ...(payment.notes ? { notes: payment.notes } : {}),
    ...(payment.section ? { section: payment.section } : {}),
    ...(payment.vendorBillId ? { vendorBillId: payment.vendorBillId } : {}),
  });
  return dbSaved;
}

/** Saves the bill, adds its products to stock, and books `paidNow` (when above zero) as a payment. Returns whether everything reached the database. */
export async function createVendorBill(input: Pick<VendorBill, "vendor" | "billNo" | "date" | "items" | "payment" | "notes" | "section"> & { paidNow: number }): Promise<boolean> {
  const { paidNow, ...fields } = input;
  const items = linkExpenseItemsToInventory(fields.items, fields.section);
  const bill: VendorBill = { ...fields, vendor: fields.vendor.trim(), items, total: expenseItemsTotal(items), id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const billSaved = await saveVendorBills([...getVendorBills(), bill]);
  applyExpenseStock([], items);
  if (paidNow <= 0 || (bill.payment !== "cash" && bill.payment !== "bank")) return billSaved;
  const paymentSaved = await addVendorPayment({ vendor: bill.vendor, date: bill.date, amount: paidNow, method: bill.payment, section: bill.section, vendorBillId: bill.id });
  return billSaved && paymentSaved;
}

/** Removes the bill, takes its products back out of stock, and removes the payment made with it. */
export async function deleteVendorBill(id: string): Promise<boolean> {
  const bills = getVendorBills();
  const bill = bills.find((b) => b.id === id);
  if (!bill) return true;
  applyExpenseStock(bill.items, []);
  const [billsSaved, expensesSaved] = await Promise.all([
    saveVendorBills(bills.filter((b) => b.id !== id)),
    saveExpenses(getExpenses().filter((e) => e.vendorBillId !== id)),
  ]);
  return billsSaved && expensesSaved;
}
