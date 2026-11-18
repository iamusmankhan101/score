"use client";

/**
 * Purchase orders: stock ordered from a supplier. "Add low-stock items" fills the
 * order from what is at or below its minimum level; receiving the order adds the
 * quantities to inventory (and the stock history) in one step.
 */

import { useEffect, useState } from "react";
import { Check, Download, Pencil, Plus, Trash2, Truck } from "lucide-react";
import PageTitle from "@/components/page-title";
import { BTN_PRIMARY, BTN_SMALL, Chip, INP, Modal, PAGE, ROW, SaveButton, Small } from "@/components/clinic/ui";
import { getStoredInventory, saveInventory, subscribeToStoredData } from "@/lib/storage";
import { getPurchaseOrders, newId, removeRecord, savePurchaseOrders, todayKey, upsertRecord, type POStatus, type PurchaseOrder } from "@/lib/clinic";
import { clinicHeader, downloadClinicPdf } from "@/lib/clinic-wa";
import type { InventoryItem } from "@/lib/types";

const money = (n: number) => n.toLocaleString("en-US");
const poTotal = (po: PurchaseOrder) => po.lines.reduce((s, l) => s + l.qty * l.cost, 0);
const STATUS_COLOR: Record<POStatus, { color: string; bg: string }> = {
  draft: { color: "#6b6b8a", bg: "#f4f4f8" }, ordered: { color: "#1d4ed8", bg: "#eff6ff" },
  received: { color: "#15803d", bg: "#f0fdf4" }, cancelled: { color: "#dc2626", bg: "#fef2f2" },
};

export default function PurchaseOrdersPage() {
  const [list, setList] = useState<PurchaseOrder[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    const load = () => { setList(getPurchaseOrders()); setItems(getStoredInventory()); };
    load();
    return subscribeToStoredData(load);
  }, []);

  const save = (po: PurchaseOrder) => setList(upsertRecord(getPurchaseOrders, savePurchaseOrders, po));
  const blank = (): PurchaseOrder => ({ id: newId("po"), number: `PO-${String(getPurchaseOrders().length + 1).padStart(4, "0")}`, supplier: "", lines: [], status: "draft", createdAt: new Date().toISOString() });
  const suppliers = [...new Set(items.map((i) => i.supplier).filter(Boolean) as string[])].sort();
  const lowStock = (supplier: string) => items.filter((i) => i.isActive !== false && i.currentStock <= i.minStock && (!supplier || i.supplier === supplier));

  function receive(po: PurchaseOrder) {
    const fresh = getStoredInventory();
    const qty = new Map(po.lines.map((l) => [l.itemId, l]));
    const next = fresh.map((i) => {
      const l = qty.get(i.id);
      return l ? { ...i, currentStock: Math.round((i.currentStock + l.qty) * 10_000) / 10_000, lastRestocked: todayKey(), costPrice: l.cost || i.costPrice } : i;
    });
    saveInventory(next, { reason: "purchase", note: `Purchase order ${po.number}` });
    save({ ...po, status: "received", receivedAt: new Date().toISOString() });
    setItems(next);
  }

  const pdf = (po: PurchaseOrder) => downloadClinicPdf({
    kind: "document",
    doc: {
      title: `Purchase order ${po.number}`, meta: [["Supplier", po.supplier], ["Date", po.createdAt.slice(0, 10)]],
      table: { head: ["Item", "Qty", "Unit cost", "Amount"], rows: po.lines.map((l) => [l.name, String(l.qty), money(l.cost), money(l.qty * l.cost)]), foot: [["Total", money(poTotal(po))]] },
      body: po.notes, footer: clinicHeader().name,
    },
  }, `Purchase order ${po.number}`).catch(() => {});

  return (
    <div className="dash-page dashboard-polish" style={PAGE}>
      <PageTitle icon={<Truck size={24} />} title="Purchase Orders"
        subtitle={`${list.filter((p) => p.status === "ordered").length} on order · ${lowStock("").length} items at or below minimum stock`}
        right={<button type="button" onClick={() => setEditing(blank())} style={BTN_PRIMARY}><Plus size={14} /> New purchase order</button>} />

      {list.length === 0 ? <div style={{ fontSize: 13, color: "#9898b0", padding: 20, textAlign: "center" }}>No purchase orders yet. Create one from your low-stock items, send it to the supplier, and receive it here when the goods arrive.</div>
        : [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((po) => {
          const st = STATUS_COLOR[po.status];
          const open = po.status === "draft" || po.status === "ordered";
          return (
            <div key={po.id} style={ROW}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{po.number} · {po.supplier || "No supplier"}</div>
                <div style={{ fontSize: 12.5, color: "#6b6b8a" }}>{po.lines.length} items · {money(poTotal(po))}{po.receivedAt ? ` · received ${po.receivedAt.slice(0, 10)}` : ""}</div>
              </div>
              <Chip color={st.color} bg={st.bg}>{po.status}</Chip>
              <button type="button" style={BTN_SMALL} onClick={() => pdf(po)}><Download size={13} /> PDF</button>
              {po.status === "draft" && <button type="button" style={BTN_SMALL} onClick={() => save({ ...po, status: "ordered" })}>Mark ordered</button>}
              {open && po.lines.length > 0 && <button type="button" style={{ ...BTN_SMALL, color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}
                onClick={() => { if (window.confirm(`Add these quantities to stock?`)) receive(po); }}><Check size={13} /> Receive into stock</button>}
              {open && <button type="button" style={BTN_SMALL} onClick={() => save({ ...po, status: "cancelled" })}>Cancel</button>}
              {open && <button type="button" aria-label="Edit" style={BTN_SMALL} onClick={() => setEditing(po)}><Pencil size={13} /></button>}
              <button type="button" aria-label="Remove" style={{ ...BTN_SMALL, borderColor: "#fecaca" }} onClick={() => setList(removeRecord(getPurchaseOrders, savePurchaseOrders, po.id))}><Trash2 size={13} color="#dc2626" /></button>
            </div>
          );
        })}

      {editing && (
        <Modal title={list.some((p) => p.id === editing.id) ? `Edit ${editing.number}` : "New purchase order"} onClose={() => setEditing(null)} maxWidth={620}>
          <label><Small>Supplier</Small>
            <input value={editing.supplier} list="po-suppliers" style={INP} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} />
            <datalist id="po-suppliers">{suppliers.map((s) => <option key={s} value={s} />)}</datalist></label>

          <div style={{ marginTop: 14 }}>
            <Small>Items</Small>
            {editing.lines.map((l, i) => (
              <div key={l.itemId} style={{ display: "grid", gridTemplateColumns: "2fr 80px 90px 30px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#1a1a2e" }}>{l.name}</span>
                <input type="number" min={0} value={l.qty || ""} placeholder="Qty" style={INP} onChange={(e) => setEditing({ ...editing, lines: editing.lines.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) || 0 } : x) })} />
                <input type="number" min={0} value={l.cost || ""} placeholder="Unit cost" style={INP} onChange={(e) => setEditing({ ...editing, lines: editing.lines.map((x, j) => j === i ? { ...x, cost: Number(e.target.value) || 0 } : x) })} />
                <button type="button" aria-label="Remove line" onClick={() => setEditing({ ...editing, lines: editing.lines.filter((_, j) => j !== i) })} style={{ border: "none", background: "none", cursor: "pointer", color: "#dc2626" }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value="" style={{ ...INP, width: "auto" }} onChange={(e) => {
                const it = items.find((x) => x.id === e.target.value);
                if (it && !editing.lines.some((l) => l.itemId === it.id)) setEditing({ ...editing, supplier: editing.supplier || it.supplier || "", lines: [...editing.lines, { itemId: it.id, name: it.name, qty: Math.max(1, it.minStock * 2 - it.currentStock), cost: it.costPrice }] });
              }}>
                <option value="">+ Add an item…</option>
                {[...items].sort((a, b) => a.name.localeCompare(b.name)).map((i) => <option key={i.id} value={i.id}>{i.name} (stock {i.currentStock})</option>)}
              </select>
              <button type="button" style={BTN_SMALL} onClick={() => {
                const add = lowStock(editing.supplier).filter((i) => !editing.lines.some((l) => l.itemId === i.id))
                  .map((i) => ({ itemId: i.id, name: i.name, qty: Math.max(1, i.minStock * 2 - i.currentStock), cost: i.costPrice }));
                setEditing({ ...editing, lines: [...editing.lines, ...add] });
              }}>Add low-stock items{editing.supplier ? ` from ${editing.supplier}` : ""} ({lowStock(editing.supplier).length})</button>
            </div>
          </div>

          <label style={{ display: "block", marginTop: 14 }}><Small>Notes</Small><input value={editing.notes ?? ""} style={INP} onChange={(e) => setEditing({ ...editing, notes: e.target.value || undefined })} /></label>
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 900, color: "#1a1a2e" }}>Total: {money(poTotal(editing))}</div>
          <SaveButton enabled={editing.lines.length > 0 && editing.lines.every((l) => l.qty > 0)} onClick={() => { save(editing); setEditing(null); }}>Save purchase order</SaveButton>
        </Modal>
      )}
    </div>
  );
}
