"use client";

/**
 * Quotations: a priced offer for a treatment or course, sent to the patient by
 * WhatsApp or PDF. Track whether it was accepted and how much of the deposit
 * (the amount that confirms the booking) has been received.
 */

import { useEffect, useState } from "react";
import { Download, MessageCircle, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import PageTitle from "@/components/page-title";
import { BTN_PRIMARY, BTN_SMALL, Chip, INP, Modal, PAGE, ROW, SaveButton, Small } from "@/components/clinic/ui";
import { getStoredClients, getStoredServices, subscribeToStoredData } from "@/lib/storage";
import { QUOTE_STATUSES, getQuotations, newId, quoteTotal, removeRecord, saveQuotations, upsertRecord, type Quotation, type QuoteStatus } from "@/lib/clinic";
import { clinicHeader, downloadClinicPdf, whatsAppLink } from "@/lib/clinic-wa";
import type { Client, Service } from "@/lib/types";

const STATUS_STYLE: Record<QuoteStatus, { color: string; bg: string }> = {
  draft: { color: "#6b6b8a", bg: "#f4f4f8" }, sent: { color: "#1d4ed8", bg: "#eff6ff" },
  accepted: { color: "#15803d", bg: "#f0fdf4" }, declined: { color: "#dc2626", bg: "#fef2f2" },
};
const money = (n: number) => n.toLocaleString("en-US");

export default function QuotationsPage() {
  const [list, setList] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Quotation | null>(null);

  useEffect(() => {
    const load = () => { setList(getQuotations()); setClients(getStoredClients()); setServices(getStoredServices()); };
    load();
    return subscribeToStoredData(load);
  }, []);

  const save = (q: Quotation) => setList(upsertRecord(getQuotations, saveQuotations, q));
  const blank = (): Quotation => ({
    id: newId("quo"), number: `Q-${String(getQuotations().length + 1).padStart(4, "0")}`, clientName: "", lines: [{ name: "", qty: 1, price: 0 }],
    discount: 0, status: "draft", depositAsked: 0, depositPaid: 0, createdAt: new Date().toISOString(),
  });

  const message = (q: Quotation) => {
    const lines = q.lines.map((l) => `• ${l.name}${l.qty > 1 ? ` x${l.qty}` : ""}: ${money(l.qty * l.price)}`).join("\n");
    return `Hello ${q.clientName}, here is your quotation ${q.number}:\n${lines}${q.discount ? `\nDiscount: -${money(q.discount)}` : ""}\nTotal: ${money(quoteTotal(q))}${q.depositAsked ? `\nDeposit to confirm: ${money(q.depositAsked)}` : ""}${q.validUntil ? `\nValid until ${q.validUntil}.` : ""}`;
  };

  const pdf = (q: Quotation) => downloadClinicPdf({
    kind: "document", patientName: q.clientName,
    doc: {
      title: `Quotation ${q.number}`,
      meta: [["For", q.clientName], ["Date", q.createdAt.slice(0, 10)], ["Valid until", q.validUntil ?? ""]],
      table: { head: ["Item", "Qty", "Price", "Amount"], rows: q.lines.map((l) => [l.name, String(l.qty), money(l.price), money(l.qty * l.price)]),
        foot: [...(q.discount ? [["Discount", `-${money(q.discount)}`] as [string, string]] : []), ["Total", money(quoteTotal(q))], ...(q.depositAsked ? [["Deposit to confirm", money(q.depositAsked)] as [string, string]] : [])] },
      body: q.notes, footer: `${clinicHeader().name} · prices may change after the validity date.`,
    },
  }, `Quotation ${q.number} - ${q.clientName}`).catch(() => {});

  const valid = (q: Quotation) => !!q.clientName.trim() && q.lines.some((l) => l.name.trim() && l.price > 0);

  return (
    <div className="dash-page dashboard-polish" style={PAGE}>
      <PageTitle icon={<ReceiptText size={24} />} title="Quotations"
        subtitle={`${list.filter((q) => q.status === "sent").length} awaiting reply · ${list.filter((q) => q.status === "accepted").length} accepted`}
        right={<button type="button" onClick={() => setEditing(blank())} style={BTN_PRIMARY}><Plus size={14} /> New quotation</button>} />

      {list.length === 0 ? <div style={{ fontSize: 13, color: "#9898b0", padding: 20, textAlign: "center" }}>No quotations yet. Price a treatment or course, send it on WhatsApp, and track the deposit.</div>
        : [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((q) => {
          const st = STATUS_STYLE[q.status];
          return (
            <div key={q.id} style={ROW}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{q.number} · {q.clientName}</div>
                <div style={{ fontSize: 12.5, color: "#6b6b8a" }}>{q.lines.map((l) => l.name).filter(Boolean).join(", ")} · total {money(quoteTotal(q))}</div>
                {q.depositAsked > 0 && <div style={{ fontSize: 11.5, color: q.depositPaid >= q.depositAsked ? "#15803d" : "#c2410c" }}>Deposit {money(q.depositPaid)} / {money(q.depositAsked)}</div>}
              </div>
              <Chip color={st.color} bg={st.bg}>{q.status}</Chip>
              {q.phone && <a href={whatsAppLink(q.phone, message(q))} target="_blank" rel="noopener noreferrer" onClick={() => q.status === "draft" && save({ ...q, status: "sent" })} style={{ ...BTN_SMALL, color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}><MessageCircle size={13} /> Send</a>}
              <button type="button" style={BTN_SMALL} onClick={() => pdf(q)}><Download size={13} /> PDF</button>
              {q.status !== "accepted" && <button type="button" style={BTN_SMALL} onClick={() => save({ ...q, status: "accepted" })}>Accepted</button>}
              {q.status !== "declined" && q.status !== "accepted" && <button type="button" style={BTN_SMALL} onClick={() => save({ ...q, status: "declined" })}>Declined</button>}
              <button type="button" aria-label="Edit" style={BTN_SMALL} onClick={() => setEditing(q)}><Pencil size={13} /></button>
              <button type="button" aria-label="Remove" style={{ ...BTN_SMALL, borderColor: "#fecaca" }} onClick={() => setList(removeRecord(getQuotations, saveQuotations, q.id))}><Trash2 size={13} color="#dc2626" /></button>
            </div>
          );
        })}

      {editing && (
        <Modal title={list.some((q) => q.id === editing.id) ? `Edit ${editing.number}` : "New quotation"} onClose={() => setEditing(null)} maxWidth={620}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ gridColumn: "1 / -1" }}><Small>Existing patient (optional)</Small>
              <select value={editing.clientId ?? ""} style={INP} onChange={(e) => { const c = clients.find((x) => x.id === e.target.value); setEditing({ ...editing, clientId: c?.id, clientName: c?.name ?? editing.clientName, phone: c?.phone ?? editing.phone }); }}>
                <option value="">None, type a name below</option>
                {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
              </select></label>
            <label><Small>Name</Small><input value={editing.clientName} style={INP} onChange={(e) => setEditing({ ...editing, clientName: e.target.value })} /></label>
            <label><Small>Phone</Small><input value={editing.phone ?? ""} inputMode="tel" style={INP} onChange={(e) => setEditing({ ...editing, phone: e.target.value || undefined })} /></label>

            <div style={{ gridColumn: "1 / -1" }}>
              <Small>Items</Small>
              {editing.lines.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 60px 90px 30px", gap: 8, marginBottom: 8 }}>
                  <input value={l.name} list="quote-services" placeholder="Treatment / item" style={INP}
                    onChange={(e) => { const svc = services.find((s) => s.name === e.target.value); setEditing({ ...editing, lines: editing.lines.map((x, j) => j === i ? { ...x, name: e.target.value, price: svc && !x.price ? svc.price : x.price } : x) }); }} />
                  <input type="number" min={1} value={l.qty} style={INP} onChange={(e) => setEditing({ ...editing, lines: editing.lines.map((x, j) => j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x) })} />
                  <input type="number" min={0} value={l.price || ""} placeholder="Price" style={INP} onChange={(e) => setEditing({ ...editing, lines: editing.lines.map((x, j) => j === i ? { ...x, price: Number(e.target.value) || 0 } : x) })} />
                  <button type="button" aria-label="Remove line" disabled={editing.lines.length === 1} onClick={() => setEditing({ ...editing, lines: editing.lines.filter((_, j) => j !== i) })} style={{ border: "none", background: "none", cursor: "pointer", color: "#dc2626" }}>×</button>
                </div>
              ))}
              <datalist id="quote-services">{services.map((s) => <option key={s.id} value={s.name} />)}</datalist>
              <button type="button" style={BTN_SMALL} onClick={() => setEditing({ ...editing, lines: [...editing.lines, { name: "", qty: 1, price: 0 }] })}><Plus size={13} /> Add item</button>
            </div>

            <label><Small>Discount</Small><input type="number" min={0} value={editing.discount || ""} style={INP} onChange={(e) => setEditing({ ...editing, discount: Number(e.target.value) || 0 })} /></label>
            <label><Small>Valid until</Small><input type="date" value={editing.validUntil ?? ""} style={INP} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value || undefined })} /></label>
            <label><Small>Deposit to confirm</Small><input type="number" min={0} value={editing.depositAsked || ""} style={INP} onChange={(e) => setEditing({ ...editing, depositAsked: Number(e.target.value) || 0 })} /></label>
            <label><Small>Deposit received</Small><input type="number" min={0} value={editing.depositPaid || ""} style={INP} onChange={(e) => setEditing({ ...editing, depositPaid: Number(e.target.value) || 0 })} /></label>
            <label style={{ gridColumn: "1 / -1" }}><Small>Notes</Small><input value={editing.notes ?? ""} style={INP} onChange={(e) => setEditing({ ...editing, notes: e.target.value || undefined })} /></label>
            <div style={{ gridColumn: "1 / -1", fontSize: 14, fontWeight: 900, color: "#1a1a2e" }}>Total: {money(quoteTotal(editing))}</div>
            <select value={editing.status} style={{ ...INP, gridColumn: "1 / -1" }} onChange={(e) => setEditing({ ...editing, status: e.target.value as QuoteStatus })}>
              {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <SaveButton enabled={valid(editing)} onClick={() => { save({ ...editing, clientName: editing.clientName.trim(), lines: editing.lines.filter((l) => l.name.trim()) }); setEditing(null); }}>Save quotation</SaveButton>
        </Modal>
      )}
    </div>
  );
}
