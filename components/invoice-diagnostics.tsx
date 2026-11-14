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

interface Server { ok: boolean; status: number; kb: number; count: number | null; note?: string }

export default function InvoiceDiagnostics({ month, section }: { month: string; section: string }) {
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
      setServer({ ok: res.ok && count !== null, status: res.status, kb: Math.round(text.length / 1024), count });
    } catch {
      setServer({ ok: false, status: 0, kb: 0, count: null, note: "Couldn't reach the server." });
    }
  }

  const line: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" };
  return (
    <div style={{ margin: "20px auto 0", maxWidth: 460, textAlign: "left", background: "#f8f7fc", border: "1px solid #ececf4", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, color: "#4b4b6b" }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Why is this empty?</div>
      <div style={line}><span>Invoices stored on this device</span><b>{all.length}</b></div>
      <div style={line}><span>Hidden: not from the POS</span><b>{all.length - pos.length}</b></div>
      <div style={line}><span>Hidden: other section than “{section === "all" ? "All" : section}”</span><b>{pos.length - inSection.length}</b></div>
      <div style={line}><span>Hidden: outside the selected month{month ? ` (${month})` : ""}</span><b>{inSection.length - inMonth.length}</b></div>
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={check} disabled={server === "checking"} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #ddd6fe", background: "#fff", color: "#7C3AED", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
          {server === "checking" ? "Checking…" : "Check the server"}
        </button>
      </div>
      {server && server !== "checking" && (
        <div style={{ marginTop: 8, fontWeight: 700, color: server.ok ? "#16a34a" : "#dc2626" }}>
          {server.ok
            ? `Server has ${server.count} invoice${server.count === 1 ? "" : "s"} (${server.kb} KB). ${server.count && all.length === 0 ? "They are not reaching this device." : ""}`
            : `Server problem: status ${server.status}${server.kb ? `, ${server.kb} KB received` : ""}. ${server.note ?? "The invoice list could not be loaded."}`}
        </div>
      )}
    </div>
  );
}
