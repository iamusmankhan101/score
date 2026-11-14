"use client";

/**
 * Shown under an empty Invoices list: says what is hiding the invoices (this
 * device's copy, the section filter, the month) and tests whether the server
 * can send the full list back. Nothing here changes any data.
 */

import { useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getActiveLocationFilter } from "@/lib/locations";
import { getSalonInvoices } from "@/lib/salon-invoices";

interface Server { ok: boolean; status: number; kb: number; count: number | null; newest?: string; note?: string }

const newestOf = (l: { date?: string }[]) => l.reduce((m, i) => (i.date ?? "") > m ? (i.date ?? "") : m, "");

/** How much of the browser's storage is used, the biggest items, and whether it can still be written to. */
function storageInfo() {
  try {
    const items = Object.keys(localStorage).map((k) => [k, (localStorage.getItem(k) ?? "").length] as const).sort((a, b) => b[1] - a[1]);
    const kb = Math.round(items.reduce((n, [, l]) => n + l, 0) / 1024);
    let writable = true;
    try { localStorage.setItem("__probe", "x".repeat(30_000)); localStorage.removeItem("__probe"); } catch { writable = false; }
    return { kb, writable, top: items.slice(0, 3).map(([k, l]) => `${k.replace(/^.*?(werzio_)/, "$1")} ${Math.round(l / 1024)} KB`) };
  } catch { return null; }
}

export default function InvoiceDiagnostics({ month, section, defaultOpen = true }: { month: string; section: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [server, setServer] = useState<Server | "checking" | null>(null);
  const all = getSalonInvoices();
  const pos = all.filter((i) => !i.source || i.source === "pos");
  const inSection = pos.filter((i) => section === "all" || i.section === section);
  const inMonth = inSection.filter((i) => (i.date ?? "").startsWith(month));

  async function check() {
    setServer("checking");
    const user = getCurrentUser();
    if (!user) { setServer({ ok: false, status: 0, kb: 0, count: null, note: "Not signed in." }); return; }
    try {
      const res = await fetch(`/api/db?entity=salon_invoices&userId=${encodeURIComponent(user.salonOwnerId || user.id)}&locationId=${encodeURIComponent(getActiveLocationFilter())}`);
      const text = await res.text();
      let count: number | null = null;
      try { const j = JSON.parse(text); count = Array.isArray(j) ? j.length : null; } catch { /* not JSON, e.g. a size-limit error page */ }
      let newest = "";
      try { const j = JSON.parse(text); if (Array.isArray(j)) newest = newestOf(j); } catch { /* ignore */ }
      setServer({ ok: res.ok && count !== null, status: res.status, kb: Math.round(text.length / 1024), count, newest });
    } catch {
      setServer({ ok: false, status: 0, kb: 0, count: null, note: "Couldn't reach the server." });
    }
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} style={{ margin: "12px auto 0", display: "block", border: "none", background: "none", color: "#7C3AED", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Missing invoices? Check data</button>;
  const st = storageInfo();
  const line: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" };
  return (
    <div style={{ margin: "20px auto 0", maxWidth: 460, textAlign: "left", background: "#f8f7fc", border: "1px solid #ececf4", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: "#4b4b6b" }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Invoice data check</div>
      <div style={line}><span>Invoices stored on this device</span><b>{all.length}{all.length ? ` (newest ${newestOf(all)})` : ""}</b></div>
      <div style={line}><span>Hidden: not from the POS</span><b>{all.length - pos.length}</b></div>
      <div style={line}><span>Hidden: other section than “{section === "all" ? "All" : section}”</span><b>{pos.length - inSection.length}</b></div>
      <div style={line}><span>Hidden: outside the selected month{month ? ` (${month})` : ""}</span><b>{inSection.length - inMonth.length}</b></div>
      {st && <div style={line}><span>Browser storage used</span><b style={{ color: st.writable ? undefined : "#dc2626" }}>{st.kb} KB{st.writable ? "" : " (full)"}</b></div>}
      {st && !st.writable && <div style={{ color: "#dc2626", fontWeight: 700 }}>Biggest items: {st.top.join(", ")}</div>}
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={check} disabled={server === "checking"} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #ddd6fe", background: "#fff", color: "#7C3AED", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
          {server === "checking" ? "Checking…" : "Check the server"}
        </button>
      </div>
      {server && server !== "checking" && (
        <div style={{ marginTop: 8, fontWeight: 700, color: server.ok ? "#16a34a" : "#dc2626" }}>
          {server.ok
            ? `Server has ${server.count} invoice${server.count === 1 ? "" : "s"}${server.newest ? `, newest ${server.newest}` : ""} (${server.kb} KB). ${server.count && server.count > all.length ? "Some are not showing on this device." : "This device is up to date."}`
            : `Server problem: status ${server.status}${server.kb ? `, ${server.kb} KB received` : ""}. ${server.note ?? "The invoice list could not be loaded."}`}
        </div>
      )}
    </div>
  );
}
