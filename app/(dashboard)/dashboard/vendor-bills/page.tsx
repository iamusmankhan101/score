"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, ImageIcon, Pencil, Plus, Printer, ReceiptText, Trash2, Wallet, X } from "lucide-react";
import BarcodeCameraScanner from "@/components/barcode-camera-scanner";
import MobilePageHeader from "@/components/mobile-page-header";
import PageTitle from "@/components/page-title";
import { fmtCurrency as fmt } from "@/lib/format";
import { uploadImage } from "@/lib/image";
import { getActiveSection } from "@/lib/sections";
import { settingsStore } from "@/lib/settings-store";
import { getStoredInventory, subscribeToStoredData } from "@/lib/storage";
import { syncFromDB } from "@/lib/turso-sync";
import { getExpenses, saveExpenses, type Expense, type ExpenseItem } from "@/lib/expenses";
import {
  addVendorPayment, billPayment, createVendorBill, deleteVendorBill, getVendorBills, isVendorPayment, printVendorBill, sameVendor, updateVendorBill, vendorBalances,
  type BillPayment, type VendorBalance, type VendorBill, type VendorPaymentMethod,
} from "@/lib/vendor-bills";
import type { InventoryItem } from "@/lib/types";

const INPUT: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e3e0eb", fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box" };
const PRIMARY: React.CSSProperties = { padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #5B21B6, #9333EA)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const SECONDARY: React.CSSProperties = { padding: "10px 16px", borderRadius: 10, border: "1px solid #ddd6fe", background: "#faf8ff", color: "#6b46c1", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const CARD: React.CSSProperties = { background: "#fff", border: "1px solid #e3e0eb", borderRadius: 14 };

const BILL_PAYMENTS: { key: BillPayment; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "bank", label: "Bank Transfer" },
  { key: "credit", label: "Credit (pay later)" },
  { key: "advance", label: "From advance" },
];
const METHOD_LABEL: Record<string, string> = { cash: "cash", bank: "bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa", card: "card" };
const BILL_PAYMENT_LABEL: Record<BillPayment, string> = { cash: "Cash", bank: "Bank transfer", credit: "On credit", advance: "From advance" };

const todayKey = () => new Date().toLocaleDateString("en-CA");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6b8a" }}>{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} className="modal-overlay" style={{ zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} className="modal-sheet" style={{ background: "#fff", borderRadius: 20, width: 560, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, border: "none", borderRadius: 10, background: "#f4f4f8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function balanceText(balance: number): { text: string; color: string; bg: string } {
  if (balance > 0) return { text: `You owe ${fmt(balance)}`, color: "#b91c1c", bg: "#fef2f2" };
  if (balance < 0) return { text: `Advance ${fmt(-balance)}`, color: "#047857", bg: "#ecfdf5" };
  return { text: "Settled", color: "#6b6b8a", bg: "#f4f4f8" };
}

/** What happens to the unpaid part of a bill, in words, so the choice is clear before saving. */
function settlementNote(payment: BillPayment, total: number, paidNow: number, advance: number): string {
  if (payment === "credit") return advance > 0
    ? `This vendor holds ${fmt(advance)} advance, which will be used first. Balance is updated automatically.`
    : `Nothing paid now. ${fmt(total)} is added to what you owe this vendor.`;
  if (payment === "advance") {
    if (advance <= 0) return `This vendor has no advance, so ${fmt(total)} goes on credit.`;
    return advance >= total ? `${fmt(total)} comes out of the advance. ${fmt(advance - total)} advance remains.` : `Advance covers ${fmt(advance)}. You will owe ${fmt(total - advance)}.`;
  }
  return paidNow < total ? `The remaining ${fmt(total - paidNow)} goes on credit.` : "";
}

type Row = { name: string; qty: string; unitPrice: string; inventoryItemId?: string };

const ICON_BUTTON: React.CSSProperties = { width: 36, height: 36, flexShrink: 0, borderRadius: 8, border: "1px solid #e3e0eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

function BillModal({ bill, paidWithBill = 0, inventory, balances, section, onClose, onSaved }: {
  /** The bill being edited; left out for a new one. */
  bill?: VendorBill; paidWithBill?: number;
  inventory: InventoryItem[]; balances: VendorBalance[]; section?: string;
  onClose: () => void; onSaved: (dbSaved: boolean) => void;
}) {
  const [vendor, setVendor] = useState(bill?.vendor ?? "");
  const [date, setDate] = useState(bill?.date ?? todayKey);
  const [billNo, setBillNo] = useState(bill?.billNo ?? "");
  const [notes, setNotes] = useState(bill?.notes ?? "");
  const [payment, setPayment] = useState<BillPayment>(bill?.payment ?? "cash");
  const [paid, setPaid] = useState(bill && (bill.payment === "cash" || bill.payment === "bank") ? String(paidWithBill) : "");
  const [rows, setRows] = useState<Row[]>(bill
    ? bill.items.map((i) => ({ name: i.name, qty: String(i.qty), unitPrice: String(i.unitPrice), inventoryItemId: i.inventoryItemId }))
    : [{ name: "", qty: "1", unitPrice: "" }]);
  const [updateCosts, setUpdateCosts] = useState(true);
  const [imageUrl, setImageUrl] = useState(bill?.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addScanned(raw: string) {
    const code = raw.trim().toLowerCase();
    if (!code) return;
    const product = inventory.find((inv) => inv.barcode?.trim().toLowerCase() === code);
    if (!product) {
      setScanStatus({ ok: false, message: `No product has barcode ${raw.trim()}. Add it in Inventory, or type its name below.` });
      return;
    }
    setRows((rs) => {
      const existing = rs.findIndex((r) => r.inventoryItemId === product.id);
      if (existing >= 0) return rs.map((r, i) => (i === existing ? { ...r, qty: String((parseFloat(r.qty) || 0) + 1) } : r));
      const row: Row = { name: product.name, qty: "1", unitPrice: product.costPrice ? String(product.costPrice) : "", inventoryItemId: product.id };
      const blank = rs.findIndex((r) => !r.name.trim() && !r.unitPrice);
      return blank >= 0 ? rs.map((r, i) => (i === blank ? row : r)) : [...rs, row];
    });
    setScanStatus({ ok: true, message: `${product.name} added to the bill.` });
    setScanCode("");
  }

  async function attachPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      // Larger than a profile photo so the figures on the bill stay readable.
      setImageUrl(await uploadImage(file, "bills", 1600));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The photo couldn't be uploaded. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setRowName = (i: number, name: string) => {
    const match = inventory.find((inv) => inv.name.trim().toLowerCase() === name.trim().toLowerCase());
    const row = rows[i];
    setRow(i, { name, inventoryItemId: match?.id, unitPrice: match && !row.unitPrice ? String(match.costPrice) : row.unitPrice });
  };

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0) * (parseFloat(r.unitPrice) || 0), 0);
  const paysNow = payment === "cash" || payment === "bank";
  const paidNow = paysNow ? (paid.trim() === "" ? total : parseFloat(paid) || 0) : 0;
  const currentBalance = balances.find((b) => sameVendor(b.vendor, vendor))?.balance ?? 0;
  // When editing, what stood before this bill: its own total and payment don't count.
  const balance = bill && sameVendor(bill.vendor, vendor) ? currentBalance - bill.total + paidWithBill : currentBalance;
  const advance = Math.max(0, -balance);
  const costChanges = rows.some((r) => {
    const cost = inventory.find((inv) => inv.id === r.inventoryItemId)?.costPrice;
    const price = parseFloat(r.unitPrice);
    return cost !== undefined && price > 0 && price !== cost;
  });

  async function save() {
    const items: ExpenseItem[] = [];
    for (const r of rows) {
      if (!r.name.trim() && !r.unitPrice) continue;
      const qty = parseFloat(r.qty);
      const unitPrice = parseFloat(r.unitPrice);
      if (!r.name.trim() || !(qty > 0) || !(unitPrice >= 0)) { setError("Each product needs a name, a quantity above 0 and a price."); return; }
      items.push({ name: r.name.trim(), qty, unitPrice, ...(r.inventoryItemId ? { inventoryItemId: r.inventoryItemId } : {}) });
    }
    if (!vendor.trim()) { setError("Enter the vendor's name."); return; }
    if (!items.length || !(total > 0)) { setError("Add at least one product with a price."); return; }
    if (!date) { setError("Choose the bill date."); return; }
    if (paysNow && (paidNow < 0 || paidNow > total)) { setError(`Amount paid must be between 0 and ${fmt(total)}. To pay extra as advance, use Pay Vendor.`); return; }
    setSaving(true);
    const input = {
      vendor, date, items, payment, paidNow, imageUrl,
      updateCosts: costChanges && updateCosts,
      billNo: billNo.trim() || undefined,
      notes: notes.trim() || undefined,
      ...(section ? { section } : {}),
    };
    onSaved(await (bill ? updateVendorBill(bill.id, input) : createVendorBill(input)));
  }

  return (
    <Modal title={bill ? "Edit Vendor Bill" : "New Vendor Bill"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Vendor *">
          <input list="vendor-names" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Wella Pakistan" style={INPUT} />
        </Field>
        {vendor.trim() && balance !== 0 && <div style={{ fontSize: 12, fontWeight: 600, color: balanceText(balance).color }}>{balanceText(balance).text} before this bill</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Bill date *"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT} /></Field>
          <Field label="Bill number"><input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Optional" style={INPUT} /></Field>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6b8a" }}>Products received *</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input aria-label="Scan or type a product barcode" value={scanCode} onChange={(e) => setScanCode(e.target.value)} autoComplete="off" placeholder="Scan or enter barcode, then press Enter"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addScanned(scanCode); } }} style={{ ...INPUT, flex: 1, minWidth: 0 }} />
          <button type="button" onClick={() => setCameraOpen(true)} aria-label="Scan barcode with camera" title="Scan with camera" style={{ ...ICON_BUTTON, width: 40, height: "auto", border: "1px solid #ddd6fe", background: "#faf8ff" }}><Camera size={15} color="#7C3AED" /></button>
        </div>
        {scanStatus && <div role="status" style={{ fontSize: 12, fontWeight: 600, color: scanStatus.ok ? "#047857" : "#b91c1c" }}>{scanStatus.message}</div>}
        {cameraOpen && <BarcodeCameraScanner continuous status={scanStatus} idleMessage="Each product you scan is added to this bill." onDetected={addScanned} onClose={() => setCameraOpen(false)} />}
        <datalist id="vendor-bill-products">{inventory.map((inv) => <option key={inv.id} value={inv.name} />)}</datalist>
        {rows.map((r, i) => {
          const linked = inventory.find((inv) => inv.id === r.inventoryItemId);
          return (
            <div key={i}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input list="vendor-bill-products" aria-label="Product name" value={r.name} onChange={(e) => setRowName(i, e.target.value)} placeholder="Product name" style={{ ...INPUT, flex: "1 1 180px", width: "auto" }} />
                <input type="number" min="0" step="any" aria-label="Quantity" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} placeholder="Qty" style={{ ...INPUT, flex: "0 0 72px", width: 72 }} />
                <input type="number" min="0" step="any" aria-label="Price per unit" value={r.unitPrice} onChange={(e) => setRow(i, { unitPrice: e.target.value })} placeholder="Price" style={{ ...INPUT, flex: "1 1 90px", width: "auto" }} />
                <button type="button" aria-label={`Remove ${r.name || "product"}`} disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  style={{ width: 36, height: 36, flexShrink: 0, border: "none", borderRadius: 8, background: "#fef2f2", color: "#dc2626", opacity: rows.length === 1 ? 0.4 : 1, cursor: rows.length === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
              </div>
              {r.name.trim() && (
                <div style={{ fontSize: 11, marginTop: 4, color: linked ? "#047857" : "#7C3AED" }}>
                  {!linked ? `New: will be added to Inventory with ${parseFloat(r.qty) || 0} in stock`
                    : bill ? `In Inventory: ${linked.currentStock} ${linked.unit} in stock now`
                    : `In Inventory: stock ${linked.currentStock} → ${linked.currentStock + (parseFloat(r.qty) || 0)} ${linked.unit}`}
                  {linked && parseFloat(r.unitPrice) > 0 && parseFloat(r.unitPrice) !== linked.costPrice && <span style={{ color: "#b45309" }}> · Cost was {fmt(linked.costPrice)}</span>}
                </div>
              )}
            </div>
          );
        })}
        <button type="button" onClick={() => setRows((rs) => [...rs, { name: "", qty: "1", unitPrice: "" }])} style={{ ...SECONDARY, alignSelf: "flex-start", padding: "8px 12px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add product</button>
        <div style={{ textAlign: "right", fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>Total: {fmt(total)}</div>

        {costChanges && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b6b8a", cursor: "pointer" }}>
            <input type="checkbox" checked={updateCosts} onChange={(e) => setUpdateCosts(e.target.checked)} style={{ accentColor: "#7C3AED" }} />
            Update cost prices in Inventory to these new prices
          </label>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6b8a" }}>How is this bill being paid?</div>
        <div role="radiogroup" aria-label="Payment type" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
          {BILL_PAYMENTS.map((p) => (
            <button key={p.key} type="button" role="radio" aria-checked={payment === p.key} onClick={() => setPayment(p.key)}
              style={{ padding: "10px 8px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", border: payment === p.key ? "1.5px solid #7C3AED" : "1px solid #e3e0eb", background: payment === p.key ? "#f5f3ff" : "#fff", color: payment === p.key ? "#5B21B6" : "#6b6b8a" }}>
              {p.label}
            </button>
          ))}
        </div>
        {paysNow && (
          <Field label="Amount paid now (leave blank for the full bill)">
            <input type="number" min="0" step="any" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder={String(total)} style={INPUT} />
          </Field>
        )}
        {total > 0 && <div style={{ fontSize: 12, color: "#6b6b8a" }}>{settlementNote(payment, total, paidNow, advance)}</div>}
        <Field label="Notes"><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" style={INPUT} /></Field>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ ...SECONDARY, padding: "8px 12px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, opacity: uploading ? 0.6 : 1 }}>
            <ImageIcon size={14} /> {uploading ? "Uploading…" : imageUrl ? "Change bill photo" : "Attach bill photo"}
            <input type="file" accept="image/*" onChange={attachPhoto} disabled={uploading} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
          </label>
          {imageUrl && (
            <>
              <a href={imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>View photo</a>
              <button type="button" onClick={() => setImageUrl(undefined)} style={{ background: "none", border: "none", padding: 0, color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove</button>
            </>
          )}
        </div>
        {error && <div role="alert" style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>}
        <button type="button" onClick={save} disabled={saving || uploading} style={{ ...PRIMARY, opacity: saving || uploading ? 0.6 : 1 }}>{saving ? "Saving…" : bill ? "Save Changes" : "Save Bill & Add to Stock"}</button>
      </div>
    </Modal>
  );
}

function PaymentModal({ initialVendor, balances, section, onClose, onSaved }: {
  initialVendor: string; balances: VendorBalance[]; section?: string;
  onClose: () => void; onSaved: (dbSaved: boolean) => void;
}) {
  const [vendor, setVendor] = useState(initialVendor);
  const [date, setDate] = useState(todayKey);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<VendorPaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const balance = balances.find((b) => sameVendor(b.vendor, vendor))?.balance ?? 0;
  const value = parseFloat(amount) || 0;
  const hint = value <= 0 ? ""
    : balance <= 0 ? `${fmt(value)} will be held as advance with this vendor.`
    : value > balance ? `Clears what you owe. The extra ${fmt(value - balance)} stays as advance.`
    : `You will still owe ${fmt(balance - value)}.`;

  async function save() {
    if (!vendor.trim()) { setError("Enter the vendor's name."); return; }
    if (!(value > 0)) { setError("Enter an amount above 0."); return; }
    if (!date) { setError("Choose the payment date."); return; }
    setSaving(true);
    onSaved(await addVendorPayment({ vendor, date, amount: value, method, ...(notes.trim() ? { notes: notes.trim() } : {}), ...(section ? { section } : {}) }));
  }

  return (
    <Modal title="Pay Vendor or Give Advance" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Vendor *"><input list="vendor-names" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Wella Pakistan" style={INPUT} /></Field>
        {vendor.trim() && <div style={{ fontSize: 12, fontWeight: 600, color: balanceText(balance).color }}>{balanceText(balance).text}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Amount *"><input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} style={INPUT} /></Field>
          <Field label="Date *"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT} /></Field>
        </div>
        <Field label="Paid by">
          <select value={method} onChange={(e) => setMethod(e.target.value as VendorPaymentMethod)} style={INPUT}>
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </Field>
        {hint && <div style={{ fontSize: 12, color: "#6b6b8a" }}>{hint}</div>}
        <Field label="Notes"><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional, e.g. transfer reference" style={INPUT} /></Field>
        {error && <div role="alert" style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>}
        <button type="button" onClick={save} disabled={saving} style={{ ...PRIMARY, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save Payment"}</button>
      </div>
    </Modal>
  );
}

type HistoryEntry = { kind: "bill"; date: string; createdAt: string; bill: VendorBill } | { kind: "payment"; date: string; createdAt: string; expense: Expense };

export default function VendorBillsPage() {
  const activeSection = getActiveSection();
  const section = activeSection === "all" ? undefined : activeSection;
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [payments, setPayments] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [editBill, setEditBill] = useState<VendorBill | null>(null);
  const [printBlocked, setPrintBlocked] = useState(false);
  const [payVendor, setPayVendor] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<HistoryEntry | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);

  const reload = useCallback(() => {
    setBills(getVendorBills().filter((b) => !section || b.section === section));
    setPayments(getExpenses().filter((e) => isVendorPayment(e) && (!section || e.section === section)));
    setInventory(getStoredInventory());
  }, [section]);

  useEffect(() => {
    let cancelled = false;
    const load = () => { if (!cancelled) reload(); };
    syncFromDB().finally(load);
    const unsubscribe = subscribeToStoredData(load);
    return () => { cancelled = true; unsubscribe(); };
  }, [reload]);

  const balances = useMemo(() => vendorBalances(bills, payments), [bills, payments]);
  const vendorNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const name of [...balances.map((b) => b.vendor), ...inventory.map((i) => i.supplier ?? "")]) {
      if (name.trim() && !names.has(name.trim().toLowerCase())) names.set(name.trim().toLowerCase(), name.trim());
    }
    return [...names.values()].sort();
  }, [balances, inventory]);
  const totalOwed = balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0);
  const totalAdvance = balances.reduce((sum, b) => sum + Math.max(0, -b.balance), 0);

  const history = useMemo<HistoryEntry[]>(() => {
    const entries: HistoryEntry[] = [
      ...bills.map((bill) => ({ kind: "bill" as const, date: bill.date, createdAt: bill.createdAt, bill })),
      ...payments.map((expense) => ({ kind: "payment" as const, date: expense.date, createdAt: expense.createdAt, expense })),
    ];
    return entries
      .filter((e) => !filter || sameVendor(e.kind === "bill" ? e.bill.vendor : e.expense.vendor!, filter))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [bills, payments, filter]);

  const finished = (dbSaved: boolean) => {
    setSyncFailed(!dbSaved);
    setShowBill(false);
    setEditBill(null);
    setPayVendor(null);
    reload();
  };

  const printBill = (bill: VendorBill) => setPrintBlocked(!printVendorBill(bill, {
    salonName: settingsStore.salon.name,
    paid: billPayment(bill.id)?.amount ?? 0,
    paymentLabel: BILL_PAYMENT_LABEL[bill.payment],
    money: fmt,
  }));

  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.kind === "bill" ? toDelete.bill.id : toDelete.expense.id;
    setToDelete(null);
    setSyncFailed(!(await (toDelete.kind === "bill" ? deleteVendorBill(id) : saveExpenses(getExpenses().filter((e) => e.id !== id)))));
    reload();
  }

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>
      <MobilePageHeader title="Vendor Bills" subtitle="Stock you buy from vendors" action={{ label: "New Bill", onClick: () => setShowBill(true) }} />
      <datalist id="vendor-names">{vendorNames.map((name) => <option key={name} value={name} />)}</datalist>

      <div className="dash-page dashboard-polish" style={{ background: "#ffffff", display: "flex", flexDirection: "column", gap: 20, paddingTop: 20, minHeight: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="desktop-only">
            <PageTitle icon={<ReceiptText size={24} />} title="Vendor Bills" subtitle={section ? `Restricted to ${section} only` : "Stock you buy from vendors, on cash, bank transfer, credit or advance"} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setPayVendor(filter)} style={{ ...SECONDARY, display: "inline-flex", alignItems: "center", gap: 6 }}><Wallet size={15} /> Pay Vendor / Advance</button>
            <button type="button" onClick={() => setShowBill(true)} style={{ ...PRIMARY, display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={15} /> New Bill</button>
          </div>
        </div>

        {syncFailed && <div role="alert" style={{ padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12, fontWeight: 600 }}>Saved on this device, but it hasn&apos;t reached the database yet. It will show on other devices once it syncs. Check your internet connection.</div>}

        {printBlocked && <div role="alert" style={{ padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 12, fontWeight: 600 }}>Your browser blocked the print window. Allow pop-ups for this site and try again.</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <div style={{ ...CARD, padding: 16 }}><div style={{ fontSize: 12, color: "#6b6b8a", fontWeight: 600 }}>You owe vendors</div><div style={{ fontSize: 22, fontWeight: 700, color: totalOwed > 0 ? "#b91c1c" : "#1a1a2e", marginTop: 4 }}>{fmt(totalOwed)}</div></div>
          <div style={{ ...CARD, padding: 16 }}><div style={{ fontSize: 12, color: "#6b6b8a", fontWeight: 600 }}>Advance with vendors</div><div style={{ fontSize: 22, fontWeight: 700, color: totalAdvance > 0 ? "#047857" : "#1a1a2e", marginTop: 4 }}>{fmt(totalAdvance)}</div></div>
        </div>

        <section aria-label="Vendor balances" style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "#1a1a2e", borderBottom: "1px solid #f4f4f8" }}>Vendors</div>
          {balances.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "#9898b0" }}>No vendor bills yet. Add a bill when stock arrives, or record an advance you&apos;ve paid.</div>
          ) : balances.map((b) => {
            const status = balanceText(b.balance);
            const active = !!filter && sameVendor(filter, b.vendor);
            return (
              <div key={b.vendor} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "12px 16px", borderBottom: "1px solid #f4f4f8", background: active ? "#faf8ff" : "#fff" }}>
                <button type="button" aria-pressed={active} onClick={() => setFilter(active ? "" : b.vendor)} style={{ flex: "1 1 180px", minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{b.vendor}</div>
                  <div style={{ fontSize: 11, color: "#9898b0", marginTop: 2 }}>Bills {fmt(b.billed)} · Paid {fmt(b.paid)}</div>
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, color: status.color, background: status.bg, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{status.text}</span>
                <button type="button" onClick={() => setPayVendor(b.vendor)} style={{ ...SECONDARY, padding: "6px 12px", fontSize: 12 }}>Pay</button>
              </div>
            );
          })}
        </section>

        <section aria-label="Bills and payments" style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid #f4f4f8" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{filter ? `History: ${filter}` : "History"}</span>
            {filter && <button type="button" onClick={() => setFilter("")} style={{ background: "none", border: "none", color: "#7C3AED", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Show all</button>}
          </div>
          {history.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "#9898b0" }}>Nothing recorded yet.</div>
          ) : history.map((entry) => (
            <div key={entry.kind === "bill" ? entry.bill.id : entry.expense.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "12px 16px", borderBottom: "1px solid #f4f4f8" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                {entry.kind === "bill" ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{entry.bill.vendor}{entry.bill.billNo ? ` · Bill ${entry.bill.billNo}` : ""}</div>
                    <div style={{ fontSize: 11, color: "#9898b0", marginTop: 2 }}>{entry.date} · {BILL_PAYMENT_LABEL[entry.bill.payment]} · {entry.bill.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{entry.expense.vendor}</div>
                    <div style={{ fontSize: 11, color: "#9898b0", marginTop: 2 }}>{entry.date} · Paid by {METHOD_LABEL[entry.expense.paymentMethod] ?? entry.expense.paymentMethod}{entry.expense.notes ? ` · ${entry.expense.notes}` : ""}</div>
                  </>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", color: entry.kind === "bill" ? "#1a1a2e" : "#047857" }}>
                {entry.kind === "bill" ? fmt(entry.bill.total) : `− ${fmt(entry.expense.amount)}`}
              </div>
              {entry.kind === "bill" && (
                <>
                  {entry.bill.imageUrl && <a href={entry.bill.imageUrl} target="_blank" rel="noreferrer" aria-label={`View photo of bill from ${entry.bill.vendor}`} title="View bill photo" style={ICON_BUTTON}><ImageIcon size={13} color="#7C3AED" /></a>}
                  <button type="button" onClick={() => printBill(entry.bill)} aria-label={`Print bill from ${entry.bill.vendor}`} title="Print" style={ICON_BUTTON}><Printer size={13} color="#7C3AED" /></button>
                  <button type="button" onClick={() => setEditBill(entry.bill)} aria-label={`Edit bill from ${entry.bill.vendor}`} title="Edit" style={ICON_BUTTON}><Pencil size={13} color="#7C3AED" /></button>
                </>
              )}
              <button type="button" onClick={() => setToDelete(entry)} aria-label={entry.kind === "bill" ? `Delete bill from ${entry.bill.vendor}` : `Delete payment to ${entry.expense.vendor}`}
                style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Trash2 size={13} color="#dc2626" />
              </button>
            </div>
          ))}
        </section>
      </div>

      {showBill && <BillModal inventory={inventory} balances={balances} section={section} onClose={() => setShowBill(false)} onSaved={finished} />}
      {editBill && <BillModal bill={editBill} paidWithBill={billPayment(editBill.id)?.amount ?? 0} inventory={inventory} balances={balances} section={section} onClose={() => setEditBill(null)} onSaved={finished} />}
      {payVendor !== null && <PaymentModal initialVendor={payVendor} balances={balances} section={section} onClose={() => setPayVendor(null)} onSaved={finished} />}
      {toDelete && (
        <Modal title={toDelete.kind === "bill" ? "Delete this bill?" : "Delete this payment?"} onClose={() => setToDelete(null)}>
          <p style={{ fontSize: 13, color: "#6b6b8a", margin: "0 0 16px", lineHeight: 1.5 }}>
            {toDelete.kind === "bill"
              ? "Its products are taken back out of stock, and any payment saved with the bill is removed from Cash Flow."
              : "This also removes it from Cash Flow, and the vendor's balance goes back up."}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={() => setToDelete(null)} style={{ ...SECONDARY, flex: 1 }}>Keep</button>
            <button type="button" onClick={confirmDelete} style={{ ...PRIMARY, flex: 1, background: "#dc2626" }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
