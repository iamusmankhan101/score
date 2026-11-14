"use client";

/** Patient portal (/portal/[token]): the patient's own appointments, prescriptions, records, bills and plan progress. Read-only, plus a link to book. */

import { use, useEffect, useState } from "react";

interface Portal {
  clinicName: string; phone: string; bookUrl: string; patientName: string;
  appointments: { id: string; date: string; startTime: string; services: string[]; doctor: string; status: string }[];
  prescriptions: { id: string; date: string; doctor?: string; diagnosis?: string; items: { time: string; product: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }[]; notes?: string }[];
  records: { id: string; date: string; doctor?: string; concerns: string[]; advice?: string }[];
  consents: { id: string; title: string; signedAt: string }[];
  plans: { id: string; title: string; closed: boolean; total: number; done: number; next?: string }[];
  invoices: { id: string; number: string; date: string; total: number; status: string; paid: number; items: string[] }[];
}
type Tab = "appointments" | "plans" | "prescriptions" | "records" | "bills";
const TABS: [Tab, string][] = [["appointments", "Appointments"], ["plans", "Progress"], ["prescriptions", "Prescriptions"], ["records", "Records"], ["bills", "Bills"]];
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;
const fmt = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
const CARD: React.CSSProperties = { background: "#fff", border: "1px solid #ececf4", borderRadius: 12, padding: 14, marginBottom: 10 };

export default function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<Portal | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("appointments");

  useEffect(() => {
    fetch(`/api/public/portal?token=${encodeURIComponent(token)}`).then((r) => r.json())
      .then((d) => d.ok ? setData(d) : setError(d.error || "Couldn't load."))
      .catch(() => setError("Couldn't reach the server."));
  }, [token]);

  if (error) return <main style={{ padding: 32, textAlign: "center", fontFamily: "system-ui" }}>{error}</main>;
  if (!data) return <main style={{ padding: 32, textAlign: "center", fontFamily: "system-ui" }}>Loading…</main>;
  const today = new Date().toLocaleDateString("en-CA");
  const upcoming = data.appointments.filter((a) => a.date >= today && !["cancelled", "no-show", "completed"].includes(a.status)).reverse();
  const past = data.appointments.filter((a) => !upcoming.includes(a));
  const due = data.invoices.reduce((s, i) => s + (i.total - i.paid), 0);
  const empty = (t: string) => <div style={{ ...CARD, color: "#8a8aa3", textAlign: "center" }}>{t}</div>;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif", background: "#f7f7fb", minHeight: "100vh", color: "#1a1a2e" }}>
      <h1 style={{ fontSize: 20, margin: "8px 0 2px" }}>{data.clinicName}</h1>
      <div style={{ color: "#6b6b8a", fontSize: 14, marginBottom: 12 }}>Hello {data.patientName.split(" ")[0]} — your records</div>
      <a href={data.bookUrl} style={{ display: "block", textAlign: "center", padding: 12, borderRadius: 10, background: "#7C3AED", color: "#fff", fontWeight: 800, textDecoration: "none", marginBottom: 14 }}>Book an appointment</a>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12 }}>
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{ padding: "8px 12px", borderRadius: 20, border: "1px solid #e4e4ee", whiteSpace: "nowrap", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: tab === id ? "#7C3AED" : "#fff", color: tab === id ? "#fff" : "#6b6b8a" }}>{label}</button>
        ))}
      </div>

      {tab === "appointments" && <>
        {upcoming.length > 0 && <h3 style={{ fontSize: 13, color: "#6b6b8a" }}>Upcoming</h3>}
        {upcoming.map((a) => <div key={a.id} style={CARD}><b>{fmt(a.date)} · {a.startTime}</b><div style={{ fontSize: 13 }}>{a.services.join(", ")}</div><div style={{ fontSize: 12, color: "#8a8aa3" }}>{a.doctor}</div></div>)}
        {past.length > 0 && <h3 style={{ fontSize: 13, color: "#6b6b8a" }}>Past visits</h3>}
        {past.map((a) => <div key={a.id} style={CARD}><b>{fmt(a.date)}</b> <span style={{ fontSize: 12, color: "#8a8aa3" }}>· {a.status}</span><div style={{ fontSize: 13 }}>{a.services.join(", ")}</div></div>)}
        {data.appointments.length === 0 && empty("No appointments yet.")}
      </>}
      {tab === "plans" && (data.plans.length === 0 ? empty("No treatment plans yet.") : data.plans.map((p) => (
        <div key={p.id} style={CARD}><b>{p.title}</b>{p.closed && <span style={{ fontSize: 12, color: "#8a8aa3" }}> · closed</span>}
          <div style={{ fontSize: 13, margin: "4px 0 8px" }}>{p.done} of {p.total} sessions done{p.next && !p.closed && p.done < p.total ? ` · next ${fmt(p.next)}` : ""}</div>
          <div style={{ height: 8, background: "#ececf4", borderRadius: 4 }}><div style={{ width: `${Math.min(100, (p.done / Math.max(1, p.total)) * 100)}%`, height: 8, background: "#7C3AED", borderRadius: 4 }} /></div>
        </div>)))}
      {tab === "prescriptions" && (data.prescriptions.length === 0 ? empty("No prescriptions yet.") : data.prescriptions.map((p) => (
        <div key={p.id} style={CARD}><b>{fmt(p.date)}</b>{p.doctor && <span style={{ fontSize: 12, color: "#8a8aa3" }}> · {p.doctor}</span>}
          {p.diagnosis && <div style={{ fontSize: 13, marginTop: 4 }}>For: {p.diagnosis}</div>}
          {p.items.map((i, n) => <div key={n} style={{ fontSize: 13, marginTop: 6 }}><b>{i.product}</b> <span style={{ color: "#6b6b8a" }}>({i.time}{[i.dosage, i.frequency, i.duration].filter(Boolean).map((x) => `, ${x}`).join("")})</span>{i.instructions && <div style={{ fontSize: 12, color: "#8a8aa3" }}>{i.instructions}</div>}</div>)}
          {p.notes && <div style={{ fontSize: 12, marginTop: 8, color: "#6b6b8a" }}>{p.notes}</div>}
        </div>)))}
      {tab === "records" && <>
        {data.records.map((c) => <div key={c.id} style={CARD}><b>{fmt(c.date)}</b>{c.doctor && <span style={{ fontSize: 12, color: "#8a8aa3" }}> · {c.doctor}</span>}
          {c.concerns.length > 0 && <div style={{ fontSize: 13, marginTop: 4 }}>Concerns: {c.concerns.join(", ")}</div>}{c.advice && <div style={{ fontSize: 13, marginTop: 4 }}>{c.advice}</div>}</div>)}
        {data.consents.length > 0 && <h3 style={{ fontSize: 13, color: "#6b6b8a" }}>Consent forms signed</h3>}
        {data.consents.map((c) => <div key={c.id} style={CARD}>{c.title} <span style={{ fontSize: 12, color: "#8a8aa3" }}>· {fmt(c.signedAt)}</span></div>)}
        {data.records.length === 0 && data.consents.length === 0 && empty("No records yet.")}
      </>}
      {tab === "bills" && <>
        {due > 0 && <div style={{ ...CARD, background: "#fffbeb", borderColor: "#fde68a" }}>Outstanding balance: <b>{rs(due)}</b></div>}
        {data.invoices.length === 0 ? empty("No invoices yet.") : data.invoices.map((i) => (
          <div key={i.id} style={CARD}><div style={{ display: "flex", justifyContent: "space-between" }}><b>{i.number}</b><b>{rs(i.total)}</b></div>
            <div style={{ fontSize: 12, color: "#8a8aa3" }}>{fmt(i.date)} · {i.status === "paid" ? "Paid" : i.status === "partial" ? `Part-paid ${rs(i.paid)}, ${rs(i.total - i.paid)} due` : "Unpaid"}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{i.items.filter(Boolean).join(", ")}</div></div>))}
      </>}
      {data.phone && <p style={{ textAlign: "center", fontSize: 13, color: "#8a8aa3" }}>Questions? Call <a href={`tel:${data.phone}`}>{data.phone}</a></p>}
    </main>
  );
}
