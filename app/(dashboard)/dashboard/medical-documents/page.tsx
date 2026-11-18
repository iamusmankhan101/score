"use client";

/**
 * Medical documents on the clinic's letterhead: referral letter, medical certificate,
 * discharge summary and a patient's statement of account. Pick the patient and the
 * document, fill in a few lines, download or print the PDF.
 */

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import PageTitle from "@/components/page-title";
import { INP, PAGE, Small } from "@/components/clinic/ui";
import { getStoredClients, subscribeToStoredData } from "@/lib/storage";
import { audit, todayKey } from "@/lib/clinic";
import { downloadClinicPdf, printClinicPdf } from "@/lib/clinic-wa";
import { balanceDue, getSalonInvoices } from "@/lib/salon-invoices";
import type { GenericDoc } from "@/lib/clinic-pdf";
import type { Client } from "@/lib/types";

type Kind = "referral" | "certificate" | "discharge" | "statement";

const KINDS: { id: Kind; label: string; fields: { key: string; label: string; area?: boolean; date?: boolean }[] }[] = [
  { id: "referral", label: "Referral letter", fields: [
    { key: "to", label: "Refer to (doctor / hospital)" }, { key: "reason", label: "Reason for referral", area: true },
    { key: "history", label: "Relevant history and findings", area: true }, { key: "request", label: "What you are asking for", area: true } ] },
  { id: "certificate", label: "Medical certificate", fields: [
    { key: "purpose", label: "Purpose (e.g. sick leave, fitness)" }, { key: "diagnosis", label: "Diagnosis (optional)" },
    { key: "from", label: "From", date: true }, { key: "to", label: "To", date: true } ] },
  { id: "discharge", label: "Discharge summary", fields: [
    { key: "diagnosis", label: "Diagnosis / procedure", area: true }, { key: "treatment", label: "Treatment given", area: true },
    { key: "meds", label: "Medication on discharge", area: true }, { key: "followup", label: "Follow-up advice", area: true } ] },
  { id: "statement", label: "Statement of account", fields: [] },
];

const fmtMoney = (n: number) => n.toLocaleString("en-US");

export default function MedicalDocumentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [kind, setKind] = useState<Kind>("referral");
  const [doctor, setDoctor] = useState("");
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = () => setClients(getStoredClients());
    load();
    return subscribeToStoredData(load);
  }, []);

  const client = clients.find((c) => c.id === clientId);
  const spec = KINDS.find((k) => k.id === kind)!;

  const doc = useMemo((): GenericDoc | null => {
    if (!client) return null;
    const meta: [string, string][] = [["Patient", client.name], ["Phone", client.phone], ["Date", todayKey()]];
    if (kind === "referral") return { title: "Referral letter", meta: [...meta, ["To", f.to ?? ""]], signer: doctor,
      body: `Dear Colleague,\n\nI am referring ${client.name} to you for ${f.reason || "further assessment"}.\n\nRelevant history and findings:\n${f.history || "-"}\n\nRequest:\n${f.request || "Please assess and advise."}\n\nThank you for seeing the patient.` };
    if (kind === "certificate") return { title: "Medical certificate", meta, signer: doctor,
      body: `This is to certify that ${client.name} was examined at this clinic${f.purpose ? ` for ${f.purpose}` : ""}${f.diagnosis ? ` (${f.diagnosis})` : ""}.\n\n${f.from && f.to ? `The patient is advised rest / is unfit for duty from ${f.from} to ${f.to}.` : "The patient is advised rest as needed."}` };
    if (kind === "discharge") return { title: "Discharge summary", meta, signer: doctor,
      body: `Diagnosis / procedure:\n${f.diagnosis || "-"}\n\nTreatment given:\n${f.treatment || "-"}\n\nMedication on discharge:\n${f.meds || "-"}\n\nFollow-up advice:\n${f.followup || "-"}` };
    const invs = getSalonInvoices().filter((i) => i.clientId === client.id).sort((a, b) => a.date.localeCompare(b.date));
    const owed = invs.reduce((sum, i) => sum + balanceDue(i), 0);
    return { title: "Statement of account", meta, signer: doctor,
      table: { head: ["Invoice", "Date", "Total", "Balance"], rows: invs.map((i) => [i.number, i.date, fmtMoney(i.total), fmtMoney(balanceDue(i))]),
        foot: [["Total outstanding", fmtMoney(owed)]] } };
  }, [client, kind, f, doctor]);

  async function run(mode: "download" | "print") {
    if (!doc || !client) return;
    setBusy(true); setErr("");
    try {
      const payload = { kind: "document", doc, patientName: client.name };
      if (mode === "download") await downloadClinicPdf(payload, `${doc.title} - ${client.name}`);
      else await printClinicPdf(payload);
      audit(mode === "download" ? "download" : "send", "document", client.id, doc.title);
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't create the PDF."); }
    setBusy(false);
  }

  return (
    <div className="dash-page dashboard-polish" style={PAGE}>
      <PageTitle icon={<FileText size={24} />} title="Medical Documents" subtitle="Referral letters, certificates, discharge summaries and statements, on your letterhead" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, maxWidth: 820 }}>
        <label><Small>Patient</Small>
          <select value={clientId} style={INP} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select a patient…</option>
            {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
          </select></label>
        <label><Small>Document</Small>
          <select value={kind} style={INP} onChange={(e) => { setKind(e.target.value as Kind); setF({}); }}>
            {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select></label>
        <label><Small>Doctor (printed under the signature)</Small><input value={doctor} style={INP} placeholder="Dr …" onChange={(e) => setDoctor(e.target.value)} /></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, maxWidth: 820 }}>
        {spec.fields.map((fl) => (
          <label key={fl.key}><Small>{fl.label}</Small>
            {fl.area ? <textarea rows={3} value={f[fl.key] ?? ""} style={{ ...INP, resize: "vertical" }} onChange={(e) => setF({ ...f, [fl.key]: e.target.value })} />
              : <input type={fl.date ? "date" : "text"} value={f[fl.key] ?? ""} style={INP} onChange={(e) => setF({ ...f, [fl.key]: e.target.value })} />}
          </label>
        ))}
        {kind === "statement" && <div style={{ fontSize: 12.5, color: "#6b6b8a" }}>Lists every invoice for this patient with what is still owed.</div>}
      </div>
      {err && <div style={{ fontSize: 12.5, color: "#dc2626" }}>{err}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" disabled={!doc || busy} onClick={() => run("download")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: doc ? "#7C3AED" : "#e8e8f0", color: doc ? "#fff" : "#9898b0", fontSize: 13, fontWeight: 800, cursor: "pointer" }}><Download size={14} /> Download PDF</button>
        <button type="button" disabled={!doc || busy} onClick={() => run("print")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1px solid #e4e4ee", background: "#fff", color: "#6b6b8a", fontSize: 13, fontWeight: 800, cursor: "pointer" }}><Printer size={14} /> Print</button>
      </div>
    </div>
  );
}
