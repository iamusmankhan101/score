"use client";

/**
 * Daily cash closing: what the till should hold from the day's sales (cash in,
 * minus cash refunds) against what was actually counted. One closing per day;
 * closing again replaces it. Takings are read straight from invoices.
 */

import { useEffect, useMemo, useState } from "react";
import { Banknote, Check } from "lucide-react";
import PageTitle from "@/components/page-title";
import { subscribeToStoredData } from "@/lib/storage";
import { getSalonInvoices, type SalonInvoice } from "@/lib/salon-invoices";
import { getCashClosings, saveCashClosings, newId, todayKey, type CashClosing } from "@/lib/clinic";
import { getCurrentUser } from "@/lib/auth";

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;
const INP: React.CSSProperties = { padding: "9px 11px", borderRadius: 9, border: "1px solid #e4e4ee", fontSize: 14, outline: "none", background: "#fff" };

/** Money actually received on this invoice: the advance on a partial, the full total otherwise. */
const received = (i: SalonInvoice) => i.status === "partial" ? (i.advanceAmount ?? 0) : i.status === "paid" ? i.total : 0;

export default function CashClosingPage() {
  const [date, setDate] = useState(todayKey());
  const [invoices, setInvoices] = useState<SalonInvoice[]>([]);
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const existing = closings.find((c) => c.date === date);
  // Changing day loads that day's saved closing (or blanks the form).
  function pick(d: string) {
    const c = getCashClosings().find((x) => x.date === d);
    setDate(d); setCounted(c ? String(c.countedCash) : ""); setNotes(c?.notes ?? ""); setSaved(false);
  }

  useEffect(() => {
    const load = () => { setInvoices(getSalonInvoices()); setClosings(getCashClosings()); };
    load();
    const t = setTimeout(() => pick(todayKey()), 0); // today's closing, once stored data has loaded
    const off = subscribeToStoredData(load);
    return () => { clearTimeout(t); off(); };
  }, []);

  const { byMethod, expectedCash } = useMemo(() => {
    const by: Record<string, number> = {};
    for (const i of invoices) {
      const m = i.paymentMethod || "other";
      if (i.date === date) by[m] = (by[m] ?? 0) + received(i);
      for (const r of i.refunds ?? []) if (r.at.slice(0, 10) === date) by[r.method || m] = (by[r.method || m] ?? 0) - r.amount;
    }
    return { byMethod: by, expectedCash: by.cash ?? 0 };
  }, [invoices, date]);

  const countedNum = counted === "" ? null : Number(counted);
  const diff = countedNum === null ? null : countedNum - expectedCash;

  function close() {
    if (countedNum === null || Number.isNaN(countedNum)) return;
    const record: CashClosing = { id: existing?.id ?? newId("close"), date, expectedCash, countedCash: countedNum, difference: countedNum - expectedCash,
      byMethod, notes: notes.trim() || undefined, closedBy: getCurrentUser()?.ownerName, closedAt: new Date().toISOString() };
    saveCashClosings([record, ...getCashClosings().filter((c) => c.date !== date)]);
    setSaved(true);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <PageTitle icon={<Banknote size={24} />} title="Cash Closing" />
      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "12px 0" }}>
        <input type="date" value={date} max={todayKey()} onChange={(e) => e.target.value && pick(e.target.value)} style={INP} />
        {existing && <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>Closed {new Date(existing.closedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{existing.closedBy ? ` by ${existing.closedBy}` : ""}</span>}
      </div>

      <div style={{ border: "1px solid #ececf4", borderRadius: 12, background: "#fff", padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#9898b0", textTransform: "uppercase", marginBottom: 8 }}>Takings (net of refunds)</div>
        {Object.keys(byMethod).length === 0 ? <div style={{ color: "#8a8aa3", fontSize: 13 }}>No sales on this day.</div> :
          Object.entries(byMethod).map(([m, v]) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, textTransform: "capitalize" }}><span>{m}</span><b>{rs(v)}</b></div>
          ))}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f0f0f8", marginTop: 6, paddingTop: 8, fontSize: 14 }}>
          <span>Total</span><b>{rs(Object.values(byMethod).reduce((a, b) => a + b, 0))}</b>
        </div>
      </div>

      <div style={{ border: "1px solid #ececf4", borderRadius: 12, background: "#fff", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 10 }}><span>Cash expected in till</span><b>{rs(expectedCash)}</b></div>
        <label style={{ fontSize: 12, fontWeight: 800, color: "#9898b0" }}>Cash counted</label>
        <input type="number" min={0} value={counted} onChange={(e) => { setCounted(e.target.value); setSaved(false); }} style={{ ...INP, width: "100%", boxSizing: "border-box", margin: "4px 0 10px" }} />
        {diff !== null && <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: diff === 0 ? "#059669" : diff < 0 ? "#dc2626" : "#d97706" }}>
          {diff === 0 ? "Balanced" : diff < 0 ? `Short by ${rs(-diff)}` : `Over by ${rs(diff)}`}</div>}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes (e.g. why it's short)" style={{ ...INP, width: "100%", boxSizing: "border-box", resize: "none", marginBottom: 10 }} />
        <button type="button" onClick={close} disabled={countedNum === null}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 9, border: "none", background: "#7C3AED", color: "#fff", fontWeight: 800, cursor: countedNum === null ? "not-allowed" : "pointer", opacity: countedNum === null ? 0.5 : 1 }}>
          {saved ? <Check size={15} /> : <Banknote size={15} />} {saved ? "Saved" : existing ? "Update closing" : "Close the day"}
        </button>
      </div>

      {closings.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#9898b0", textTransform: "uppercase", marginBottom: 6 }}>Past closings</div>
          {[...closings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map((c) => (
            <button key={c.id} type="button" onClick={() => pick(c.date)} style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: "8px 10px", border: "1px solid #ececf4", borderRadius: 8, background: "#fff", marginBottom: 6, fontSize: 13, cursor: "pointer" }}>
              <span>{c.date}</span><span style={{ color: c.difference === 0 ? "#059669" : c.difference < 0 ? "#dc2626" : "#d97706", fontWeight: 700 }}>{c.difference === 0 ? "Balanced" : `${c.difference > 0 ? "+" : "-"}${rs(Math.abs(c.difference))}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
