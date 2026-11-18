"use client";

/**
 * Lab & scan orders: tests and scans ordered for a patient, tracked from ordered
 * to reported. Overdue ones (past their due date, no result yet) are flagged, and
 * abnormal results are marked so the doctor sees them first.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, Check, FlaskConical, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import PageTitle from "@/components/page-title";
import { BTN_PRIMARY, BTN_SMALL, Chip, INP, Modal, PAGE, ROW, SaveButton, Small } from "@/components/clinic/ui";
import { getStoredClients, subscribeToStoredData } from "@/lib/storage";
import { normalizePhone } from "@/lib/whatsapp-scheduler";
import { LAB_STATUSES, getLabOrders, labIsOverdue, newId, removeRecord, saveLabOrders, todayKey, upsertRecord, type LabOrder } from "@/lib/clinic";
import type { Client } from "@/lib/types";

type Filter = "open" | "overdue" | "abnormal" | "reported" | "all";

const blank = (): LabOrder => ({ id: newId("lab"), clientId: "", clientName: "", kind: "Lab", tests: "", status: "ordered", createdAt: new Date().toISOString() });

export default function LabOrdersPage() {
  const [list, setList] = useState<LabOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<LabOrder | null>(null);
  const [reporting, setReporting] = useState<LabOrder | null>(null);
  const [filter, setFilter] = useState<Filter>("open");

  useEffect(() => {
    const load = () => { setList(getLabOrders()); setClients(getStoredClients()); };
    load();
    return subscribeToStoredData(load);
  }, []);

  const save = (o: LabOrder) => setList(upsertRecord(getLabOrders, saveLabOrders, o));
  const today = todayKey();
  const overdue = list.filter((o) => labIsOverdue(o, today));
  const abnormal = list.filter((o) => o.abnormal && o.status === "reported");

  const shown = list
    .filter((o) => filter === "all" || (filter === "open" ? o.status !== "reported" : filter === "overdue" ? labIsOverdue(o, today) : filter === "abnormal" ? o.abnormal && o.status === "reported" : o.status === "reported"))
    .sort((a, b) => (b.createdAt).localeCompare(a.createdAt));

  const prepLink = (o: LabOrder) => {
    const phone = clients.find((c) => c.id === o.clientId)?.phone;
    if (!phone) return null;
    const text = `Hello ${o.clientName}, your ${o.kind === "Lab" ? "lab test" : "scan"} (${o.tests})${o.provider ? ` at ${o.provider}` : ""} has been ordered.${o.prep ? ` Preparation: ${o.prep}` : ""}${o.dueDate ? ` Result expected by ${o.dueDate}.` : ""}`;
    return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="dash-page dashboard-polish" style={PAGE}>
      <PageTitle icon={<FlaskConical size={24} />} title="Lab & Scan Orders"
        subtitle={`${list.filter((o) => o.status !== "reported").length} open · ${overdue.length} overdue · ${abnormal.length} abnormal results`}
        right={<button type="button" onClick={() => setEditing(blank())} style={BTN_PRIMARY}><Plus size={14} /> New order</button>} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["open", "overdue", "abnormal", "reported", "all"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            style={{ ...BTN_SMALL, ...(filter === f ? { background: "#7C3AED", color: "#fff", border: "1px solid #7C3AED" } : {}), textTransform: "capitalize" }}>{f}</button>
        ))}
      </div>

      {shown.length === 0 ? <div style={{ fontSize: 13, color: "#9898b0", padding: 20, textAlign: "center" }}>Nothing here. Order a test or scan for a patient and track it until the result is back.</div>
        : shown.map((o) => {
          const late = labIsOverdue(o, today);
          const link = prepLink(o);
          return (
            <div key={o.id} style={{ ...ROW, borderColor: late ? "#fecaca" : o.abnormal ? "#fed7aa" : "#ececf4" }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{o.clientName} <span style={{ fontWeight: 600, color: "#9898b0", fontSize: 12 }}>· {o.kind}</span></div>
                <div style={{ fontSize: 12.5, color: "#6b6b8a" }}>{o.tests}{o.provider ? ` · ${o.provider}` : ""}{o.dueDate ? ` · due ${o.dueDate}` : ""}</div>
                {o.indication && <div style={{ fontSize: 11.5, color: "#9898b0" }}>Reason: {o.indication}</div>}
                {o.result && <div style={{ fontSize: 12.5, color: o.abnormal ? "#c2410c" : "#15803d", marginTop: 3 }}>Result: {o.result}</div>}
              </div>
              {late && <Chip color="#dc2626" bg="#fef2f2"><AlertTriangle size={11} style={{ verticalAlign: -1 }} /> Overdue</Chip>}
              {o.abnormal && o.status === "reported" && <Chip color="#c2410c" bg="#fff7ed">Abnormal</Chip>}
              <Chip>{LAB_STATUSES.find((s) => s.id === o.status)?.label}</Chip>
              {o.status === "ordered" && <button type="button" style={BTN_SMALL} onClick={() => save({ ...o, status: "sample" })}><Check size={13} /> Sample / scan done</button>}
              {o.status !== "reported" && <button type="button" style={BTN_SMALL} onClick={() => setReporting({ ...o })}><Check size={13} /> Enter result</button>}
              {link && o.status !== "reported" && <a href={link} target="_blank" rel="noopener noreferrer" style={{ ...BTN_SMALL, color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}><MessageCircle size={13} /> Send prep</a>}
              <button type="button" aria-label="Edit" style={BTN_SMALL} onClick={() => setEditing(o)}><Pencil size={13} /></button>
              <button type="button" aria-label="Remove" style={{ ...BTN_SMALL, borderColor: "#fecaca" }} onClick={() => setList(removeRecord(getLabOrders, saveLabOrders, o.id))}><Trash2 size={13} color="#dc2626" /></button>
            </div>
          );
        })}

      {editing && (
        <Modal title={list.some((o) => o.id === editing.id) ? "Edit order" : "New lab / scan order"} onClose={() => setEditing(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ gridColumn: "1 / -1" }}><Small>Patient</Small>
              <select value={editing.clientId} style={INP} onChange={(e) => { const c = clients.find((x) => x.id === e.target.value); setEditing({ ...editing, clientId: e.target.value, clientName: c?.name ?? "" }); }}>
                <option value="">Select a patient…</option>
                {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
              </select></label>
            <label><Small>Type</Small>
              <select value={editing.kind} style={INP} onChange={(e) => setEditing({ ...editing, kind: e.target.value as LabOrder["kind"] })}><option>Lab</option><option>Radiology</option></select></label>
            <label><Small>Due date</Small><input type="date" value={editing.dueDate ?? ""} style={INP} onChange={(e) => setEditing({ ...editing, dueDate: e.target.value || undefined })} /></label>
            <label style={{ gridColumn: "1 / -1" }}><Small>Tests / scans</Small><input value={editing.tests} placeholder="e.g. CBC, HbA1c, Ultrasound abdomen" style={INP} onChange={(e) => setEditing({ ...editing, tests: e.target.value })} /></label>
            <label><Small>Lab / provider</Small><input value={editing.provider ?? ""} style={INP} onChange={(e) => setEditing({ ...editing, provider: e.target.value || undefined })} /></label>
            <label><Small>Reason (indication)</Small><input value={editing.indication ?? ""} style={INP} onChange={(e) => setEditing({ ...editing, indication: e.target.value || undefined })} /></label>
            <label style={{ gridColumn: "1 / -1" }}><Small>Patient preparation</Small><input value={editing.prep ?? ""} placeholder="e.g. Fast for 8 hours" style={INP} onChange={(e) => setEditing({ ...editing, prep: e.target.value || undefined })} /></label>
          </div>
          <SaveButton enabled={!!editing.clientId && !!editing.tests.trim()} onClick={() => { save({ ...editing, tests: editing.tests.trim() }); setEditing(null); }}>Save order</SaveButton>
        </Modal>
      )}

      {reporting && (
        <Modal title={`Result: ${reporting.tests}`} onClose={() => setReporting(null)}>
          <label><Small>Result summary</Small>
            <textarea value={reporting.result ?? ""} rows={4} style={{ ...INP, resize: "vertical" }} onChange={(e) => setReporting({ ...reporting, result: e.target.value })} /></label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontSize: 13, color: "#1a1a2e" }}>
            <input type="checkbox" checked={!!reporting.abnormal} onChange={(e) => setReporting({ ...reporting, abnormal: e.target.checked })} /> Abnormal result: flag for the doctor
          </label>
          <SaveButton enabled={!!reporting.result?.trim()} onClick={() => { save({ ...reporting, status: "reported", reportedAt: new Date().toISOString() }); setReporting(null); }}>Mark as reported</SaveButton>
        </Modal>
      )}
    </div>
  );
}
