"use client";

/**
 * Branch-to-branch stock transfers (owner only). Moves stock from the branch you
 * are viewing to another branch: the receiving branch's inventory goes up first
 * (matching an item by barcode or name + brand, or creating it), then the sending
 * branch's goes down. If the second step fails you end up with stock counted in
 * both places, never lost; the stock history on both sides shows what moved.
 */

import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import PageTitle from "@/components/page-title";
import { INP, PAGE, ROW, SaveButton, Small } from "@/components/clinic/ui";
import { getCurrentUser } from "@/lib/auth";
import { getActiveLocationFilter, getSalonLocations, locationName } from "@/lib/locations";
import { getStoredInventory, saveInventory, subscribeToStoredData } from "@/lib/storage";
import { saveToDB } from "@/lib/turso-sync";
import type { StockLogEntry } from "@/lib/inventory-log";
import { getStockTransfers, newId, saveStockTransfers, todayKey, upsertRecord, type StockTransfer } from "@/lib/clinic";
import type { InventoryItem } from "@/lib/types";

const sameItem = (a: InventoryItem, b: InventoryItem) =>
  a.barcode && b.barcode ? a.barcode === b.barcode : a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && (a.brand || "").trim().toLowerCase() === (b.brand || "").trim().toLowerCase();

export default function StockTransfersPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<StockTransfer[]>([]);
  const [to, setTo] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [owner, setOwner] = useState<boolean | null>(null);

  useEffect(() => {
    const load = () => { setItems(getStoredInventory()); setHistory(getStockTransfers()); };
    load();
    const role = getCurrentUser()?.role;
    setOwner(role === "owner" || role === "admin");
    return subscribeToStoredData(load);
  }, []);

  const from = getActiveLocationFilter();
  const others = getSalonLocations().filter((l) => l.id !== from);
  const lines = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const tooMuch = lines.some((i) => (qty[i.id] ?? 0) > i.currentStock);

  async function transfer() {
    if (!to || !lines.length || tooMuch) return;
    setBusy(true); setMsg("");
    try {
      // 1. Read the receiving branch's current stock.
      const res = await fetch(`/api/db?entity=inventory&locationId=${encodeURIComponent(to)}`);
      if (!res.ok) throw new Error("Couldn't read the other branch's inventory.");
      const dest = await res.json() as InventoryItem[];
      if (!Array.isArray(dest)) throw new Error("Couldn't read the other branch's inventory.");

      // 2. Add to the receiving branch (only the changed items are sent; the server merges by id).
      const now = new Date().toISOString();
      const changed: InventoryItem[] = [];
      const log: StockLogEntry[] = [];
      for (const src of lines) {
        const n = qty[src.id];
        const match = dest.find((d) => sameItem(d, src));
        const next: InventoryItem = match
          ? { ...match, currentStock: Math.round((match.currentStock + n) * 10_000) / 10_000, lastRestocked: todayKey() }
          : { ...src, id: newId("inv"), currentStock: n, lastRestocked: todayKey(), stockCountedAt: now, batches: undefined };
        changed.push(next);
        log.push({ id: newId("sl"), itemId: next.id, change: n, stockAfter: next.currentStock, reason: "transfer", note: `From ${locationName(from)}`, at: now });
      }
      if (!(await saveToDB("inventory", changed, to))) throw new Error("Couldn't update the other branch. Nothing was moved.");
      await saveToDB("inventory_log", log, to);

      // 3. Take it off this branch (with its own stock-history entries).
      saveInventory(items.map((i) => (qty[i.id] ?? 0) > 0 ? { ...i, currentStock: Math.round((i.currentStock - qty[i.id]) * 10_000) / 10_000 } : i), { reason: "transfer", note: `To ${locationName(to)}` });

      setHistory(upsertRecord(getStockTransfers, saveStockTransfers, {
        id: newId("trf"), number: `TR-${String(getStockTransfers().length + 1).padStart(4, "0")}`, fromLocationId: from, toLocationId: to,
        lines: lines.map((i) => ({ itemId: i.id, name: i.name, qty: qty[i.id] })), note: note.trim() || undefined, createdAt: now,
      }));
      setItems(getStoredInventory());
      setQty({}); setNote("");
      setMsg(`Moved ${lines.length} item${lines.length > 1 ? "s" : ""} to ${locationName(to)}.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Transfer failed.");
    }
    setBusy(false);
  }

  if (owner === false) return <div className="dash-page" style={PAGE}><PageTitle icon={<ArrowLeftRight size={24} />} title="Stock Transfers" subtitle="Only the account owner can move stock between branches." /></div>;
  if (others.length === 0) return <div className="dash-page" style={PAGE}><PageTitle icon={<ArrowLeftRight size={24} />} title="Stock Transfers" subtitle="Add a second branch in Account settings to move stock between branches." /></div>;

  return (
    <div className="dash-page dashboard-polish" style={PAGE}>
      <PageTitle icon={<ArrowLeftRight size={24} />} title="Stock Transfers" subtitle={`Moving stock out of ${locationName(from)}`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, maxWidth: 720 }}>
        <label><Small>Send to branch</Small>
          <select value={to} style={INP} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select a branch…</option>
            {others.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select></label>
        <label><Small>Note (optional)</Small><input value={note} style={INP} onChange={(e) => setNote(e.target.value)} /></label>
      </div>

      <div>
        <Small>Quantity to send</Small>
        {items.filter((i) => i.currentStock > 0 && i.isActive !== false).sort((a, b) => a.name.localeCompare(b.name)).map((i) => (
          <div key={i.id} style={{ ...ROW, marginBottom: 8, padding: "8px 12px" }}>
            <div style={{ flex: "1 1 220px", fontSize: 13.5, fontWeight: 700, color: "#1a1a2e" }}>{i.name} <span style={{ fontWeight: 500, color: "#9898b0", fontSize: 12 }}>{i.brand}</span></div>
            <span style={{ fontSize: 12, color: "#6b6b8a" }}>in stock: {i.currentStock}</span>
            <input type="number" min={0} max={i.currentStock} value={qty[i.id] || ""} placeholder="0" style={{ ...INP, width: 90, borderColor: (qty[i.id] ?? 0) > i.currentStock ? "#dc2626" : "#e4e4ee" }}
              onChange={(e) => setQty({ ...qty, [i.id]: Number(e.target.value) || 0 })} />
          </div>
        ))}
      </div>

      {msg && <div style={{ fontSize: 13, color: msg.startsWith("Moved") ? "#15803d" : "#dc2626" }}>{msg}</div>}
      <div style={{ maxWidth: 360 }}>
        <SaveButton enabled={!!to && lines.length > 0 && !tooMuch && !busy} onClick={transfer}>{busy ? "Moving…" : `Transfer ${lines.length || ""} item${lines.length === 1 ? "" : "s"}`}</SaveButton>
        {tooMuch && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>One of the quantities is more than is in stock.</div>}
      </div>

      {history.length > 0 && (
        <div>
          <Small>Recent transfers from this branch</Small>
          {[...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 15).map((t) => (
            <div key={t.id} style={{ ...ROW, marginBottom: 8, padding: "8px 12px" }}>
              <div style={{ flex: "1 1 260px", fontSize: 13, color: "#1a1a2e" }}><b>{t.number}</b> to {locationName(t.toLocationId)} · {t.lines.map((l) => `${l.name} x${l.qty}`).join(", ")}</div>
              <span style={{ fontSize: 12, color: "#9898b0" }}>{t.createdAt.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
