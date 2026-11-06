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
import { printInNewWindow } from "./print-window";
import { getStoredInventory, saveInventory } from "./storage";

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
  /** Hosted photo of the vendor's paper bill. */
  imageUrl?: string;
  section?: string;
  createdAt: string; // ISO timestamp
}

export type VendorBillInput = Pick<VendorBill, "vendor" | "billNo" | "date" | "items" | "payment" | "notes" | "imageUrl" | "section"> & {
  /** Paid with this bill. Only used for cash and bank bills. */
  paidNow: number;
  /** Also set each product's Inventory cost price to what this bill charged. */
  updateCosts: boolean;
};

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

/** A free item (price 0) leaves the cost alone, since it says nothing about what the product costs. */
function applyCostPrices(items: ExpenseItem[]): void {
  const prices = new Map(items.filter((i) => i.inventoryItemId && i.unitPrice > 0).map((i) => [i.inventoryItemId!, i.unitPrice]));
  const inventory = getStoredInventory();
  if (!inventory.some((inv) => prices.has(inv.id) && prices.get(inv.id) !== inv.costPrice)) return;
  saveInventory(inventory.map((inv) => (prices.has(inv.id) ? { ...inv, costPrice: prices.get(inv.id)! } : inv)));
}

/** Saves the bill, adds its products to stock, and books `paidNow` (when above zero) as a payment. Returns whether everything reached the database. */
export async function createVendorBill(input: VendorBillInput): Promise<boolean> {
  const { paidNow, updateCosts, ...fields } = input;
  const items = linkExpenseItemsToInventory(fields.items, fields.section);
  const bill: VendorBill = { ...fields, vendor: fields.vendor.trim(), items, total: expenseItemsTotal(items), id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const billSaved = await saveVendorBills([...getVendorBills(), bill]);
  applyExpenseStock([], items);
  if (updateCosts) applyCostPrices(items);
  if (paidNow <= 0 || (bill.payment !== "cash" && bill.payment !== "bank")) return billSaved;
  const paymentSaved = await addVendorPayment({ vendor: bill.vendor, date: bill.date, amount: paidNow, method: bill.payment, section: bill.section, vendorBillId: bill.id });
  return billSaved && paymentSaved;
}

/** The payment saved with a bill, if there is one. Later payments to the vendor aren't tied to a bill. */
export function billPayment(billId: string, expenses: Expense[] = getExpenses()): Expense | undefined {
  return expenses.find((e) => e.vendorBillId === billId);
}

/** Applies an edit: stock moves by the difference only, and the payment saved with the bill follows the new figures. */
export async function updateVendorBill(id: string, input: VendorBillInput): Promise<boolean> {
  const bills = getVendorBills();
  const previous = bills.find((b) => b.id === id);
  if (!previous) return false;
  const { paidNow, updateCosts, ...fields } = input;
  const items = linkExpenseItemsToInventory(fields.items, fields.section ?? previous.section);
  const bill: VendorBill = { ...previous, ...fields, vendor: fields.vendor.trim(), items, total: expenseItemsTotal(items) };
  const billSaved = await saveVendorBills(bills.map((b) => (b.id === id ? bill : b)));
  applyExpenseStock(previous.items, items);
  if (updateCosts) applyCostPrices(items);

  const expenses = getExpenses();
  const linked = billPayment(id, expenses);
  const method = bill.payment === "cash" || bill.payment === "bank" ? bill.payment : undefined;
  const pays = !!method && paidNow > 0;
  if (!linked && !pays) return billSaved;
  if (!linked) return (await addVendorPayment({ vendor: bill.vendor, date: bill.date, amount: paidNow, method: method!, section: bill.section, vendorBillId: id })) && billSaved;
  const paymentSaved = await saveExpenses(pays
    ? expenses.map((e) => (e.id === linked.id ? { ...e, vendor: bill.vendor, description: `Payment to ${bill.vendor}`, date: bill.date, amount: paidNow, paymentMethod: method! } : e))
    : expenses.filter((e) => e.id !== linked.id));
  return billSaved && paymentSaved;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function vendorBillHtml(bill: VendorBill, details: { salonName: string; paid: number; paymentLabel: string; money: (n: number) => string }): string {
  const { salonName, paid, paymentLabel, money } = details;
  const rows = bill.items.map((i) => `<tr><td>${escapeHtml(i.name)}</td><td class="n">${i.qty}</td><td class="n">${money(i.unitPrice)}</td><td class="n">${money(i.qty * i.unitPrice)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8" /><title>Vendor bill${bill.billNo ? ` ${escapeHtml(bill.billNo)}` : ""}</title>
    <style>
      @page { size: A4; margin: 14mm; }
      body { font: 13px -apple-system, "Segoe UI", Roboto, sans-serif; color: #1a1a2e; margin: 0; }
      h1 { font-size: 20px; margin: 0; }
      .sub { color: #6b6b8a; margin: 2px 0 20px; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 20px; }
      .meta b { display: block; font-size: 11px; color: #6b6b8a; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px 6px; border-bottom: 1px solid #e3e0eb; text-align: left; }
      th { font-size: 11px; color: #6b6b8a; }
      .n { text-align: right; white-space: nowrap; }
      tfoot td { border-bottom: none; font-weight: 700; }
      .notes { margin-top: 20px; color: #6b6b8a; }
    </style></head><body>
    <h1>${escapeHtml(salonName)}</h1>
    <div class="sub">Purchase bill</div>
    <div class="meta">
      <div><b>Vendor</b>${escapeHtml(bill.vendor)}</div>
      <div><b>Date</b>${escapeHtml(bill.date)}</div>
      <div><b>Bill number</b>${escapeHtml(bill.billNo || "-")}</div>
      <div><b>Payment</b>${escapeHtml(paymentLabel)}</div>
    </div>
    <table>
      <thead><tr><th>Product</th><th class="n">Qty</th><th class="n">Price</th><th class="n">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="3" class="n">Total</td><td class="n">${money(bill.total)}</td></tr>
        ${paid > 0 ? `<tr><td colspan="3" class="n">Paid with this bill</td><td class="n">${money(paid)}</td></tr>` : ""}
      </tfoot>
    </table>
    ${bill.notes ? `<div class="notes">${escapeHtml(bill.notes)}</div>` : ""}
    </body></html>`;
}

export function printVendorBill(...args: Parameters<typeof vendorBillHtml>): boolean {
  return printInNewWindow(vendorBillHtml(...args));
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
