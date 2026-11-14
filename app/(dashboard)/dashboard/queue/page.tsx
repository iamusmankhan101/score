"use client";

/**
 * Waiting-room queue. A patient who arrives gets a token (1, 2, 3… each day);
 * the doctor's team calls the next token. Status changes use the same
 * appointment statuses as everywhere else, so billing and reports stay in step.
 */

import { useEffect, useState } from "react";
import { ListOrdered, LogIn, PhoneCall, Check, UserPlus, Printer, Send, Monitor, X, Clock, Users, Stethoscope, CalendarClock, CircleCheck } from "lucide-react";
import PageTitle from "@/components/page-title";
import { getStoredAppointments, getStoredClients, getStoredServices, getStoredStaff, saveAppointments, saveClients, subscribeToStoredData } from "@/lib/storage";
import { applyClientCredits, creditsFromAppointments, newGuestClient } from "@/lib/appointment-credit";
import { autoWhatsApp, clinicHeader, sendClinicWhatsApp, whatsAppLink } from "@/lib/clinic-wa";
import { todayKey, withToken } from "@/lib/clinic-core";
import { newId } from "@/lib/clinic";
import type { Appointment, AppointmentStatus, Client, Service, Staff } from "@/lib/types";

const BTN: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 9, border: "none", background: "#7C3AED", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer" };
const INP: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 9, border: "1px solid #e4e4ee", fontSize: 13, color: "#1a1a2e", outline: "none", background: "#fff" };
const GHOST: React.CSSProperties = { ...BTN, background: "#fff", color: "#6b6b8a", border: "1px solid #e4e4ee", padding: "7px 10px", fontSize: 12 };

const hhmm = (d = new Date()) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const addMin = (t: string, m: number) => { const [h, mi] = t.split(":").map(Number); const x = h * 60 + mi + m; return `${String(Math.floor(x / 60) % 24).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };

/** The message a patient gets with their token. */
const tokenMessage = (a: Appointment, ahead: number) =>
  `*${clinicHeader().name}* — your token is *#${a.tokenNo}*. ${ahead > 0 ? `${ahead} patient${ahead > 1 ? "s are" : " is"} ahead of you.` : "You are next."} Please wait and we will call you.`;

/** Opens a small printable token slip and prints it. */
function printSlip(a: Appointment, ahead: number) {
  const w = window.open("", "_blank", "width=340,height=460");
  if (!w) return;
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  // 80 mm thermal roll: the page is 80 mm wide with no margins, everything black and centred.
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Token ${a.tokenNo}</title><style>
    @page{size:80mm 100mm;margin:0}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;width:80mm}
    body{font-family:Arial,Helvetica,sans-serif;text-align:center;color:#000;padding:4mm 5mm}
    h1{font-size:16px;margin:0 0 2mm;line-height:1.2}
    .l{font-size:12px;margin:0}.n{font-size:92px;font-weight:900;line-height:1;margin:2mm 0}
    .s{font-size:14px;font-weight:700;margin:1mm 0}.m{font-size:11px;margin:1mm 0}
    hr{border:0;border-top:1px dashed #000;margin:3mm 0}
  </style>
    <h1>${esc(clinicHeader().name)}</h1><hr><div class="l">Your token</div><div class="n">${a.tokenNo}</div><hr>
    <div class="s">${esc(a.clientName)}</div>${a.staffName ? `<div class="s">${esc(a.staffName)}</div>` : ""}
    <div class="m">${esc(todayKey())} &middot; ${esc(hhmm())}</div><div class="s">${ahead > 0 ? `${ahead} ahead of you` : "You are next"}</div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}</script>`);
  w.document.close();
}

const SECTION: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "#9898b0", textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 8px" };

export default function QueuePage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const today = todayKey();
  const [walkIn, setWalkIn] = useState(false);
  const [notice, setNotice] = useState("");
  /** Shown after a patient is marked done, so the prescription is written while the visit is fresh. */
  const [rxPrompt, setRxPrompt] = useState<{ clientId: string; apptId: string; name: string } | null>(null);
  const auto = autoWhatsApp();

  useEffect(() => {
    const load = () => setAppts(getStoredAppointments());
    load();
    const tick = window.setInterval(() => setNow(Date.now()), 30_000); // keeps waiting times current
    const off = subscribeToStoredData(load);
    return () => { window.clearInterval(tick); off(); };
  }, []);

  function setStatus(id: string, status: AppointmentStatus) {
    // Read the freshest list so a change made on another screen isn't overwritten.
    let list = getStoredAppointments().map((a) => a.id === id ? { ...a, status } : a);
    if (status === "arrived") list = withToken(list, id);
    saveAppointments(list);
    setAppts(list);
    if (status === "arrived") announce(list, id);
    if (status === "completed") { const a = list.find((x) => x.id === id); if (a) setRxPrompt({ clientId: a.clientId, apptId: a.id, name: a.clientName }); }
  }

  /** Sends the token to the patient's WhatsApp when it is connected; otherwise the row shows a WhatsApp button. */
  function announce(list: Appointment[], id: string) {
    const a = list.find((x) => x.id === id);
    const phone = a && getStoredClients().find((c) => c.id === a.clientId)?.phone;
    if (!a?.tokenNo) return;
    setNotice(`Token ${a.tokenNo} given to ${a.clientName}.`);
    if (phone && autoWhatsApp()) {
      const ahead = list.filter((x) => x.date === a.date && x.status === "arrived" && (x.tokenNo ?? 0) < a.tokenNo!).length;
      sendClinicWhatsApp({ kind: "text", phone, text: tokenMessage(a, ahead) }).catch((e: Error) => setNotice(`Token ${a.tokenNo} given, but WhatsApp failed: ${e.message}`));
    }
  }

  /** Walk-in: a real appointment, already arrived, billed and reported like any other. */
  function addWalkIn(f: { clientId: string; name: string; phone: string; staffId: string; serviceId: string }) {
    const staff = getStoredStaff().find((s) => s.id === f.staffId);
    const svc = getStoredServices().find((s) => s.id === f.serviceId);
    const nowD = new Date();
    let client = getStoredClients().find((c) => c.id === f.clientId);
    const fresh: Client[] = [];
    if (!client) { client = newGuestClient(f.name, today, f.phone); fresh.push(client); }
    const start = hhmm(nowD);
    const appt: Appointment = {
      id: newId("a"), clientId: client.id, clientName: client.name, staffId: staff?.id ?? "", staffName: staff?.name ?? "", section: staff?.section,
      serviceIds: svc ? [svc.id] : [], serviceNames: svc ? [svc.name] : ["Consultation"], servicePrices: svc ? [svc.price] : [],
      date: today, startTime: start, endTime: addMin(start, svc?.durationMin ?? 30), status: "arrived", totalAmount: svc?.price ?? 0,
      source: "walk-in", createdAt: nowD.toISOString(),
    };
    const list = withToken([appt, ...getStoredAppointments()], appt.id);
    saveAppointments(list);
    saveClients(applyClientCredits([...fresh, ...getStoredClients()], creditsFromAppointments([appt]), 1));
    setAppts(list);
    announce(list, appt.id);
    const given = list.find((x) => x.id === appt.id)!;
    printSlip(given, list.filter((x) => x.date === today && x.status === "arrived" && (x.tokenNo ?? 0) < (given.tokenNo ?? 0)).length);
    setWalkIn(false);
  }

  const [doc, setDoc] = useState("all");
  const byToken = (a: Appointment, b: Appointment) => (a.tokenNo ?? 0) - (b.tokenNo ?? 0);
  const todays = appts.filter((a) => a.date === today);
  const doctors = [...new Map(todays.filter((a) => a.staffId).map((a) => [a.staffId, a.staffName])).entries()];
  const mine = doc === "all" ? todays : todays.filter((a) => a.staffId === doc);
  const serving = mine.filter((a) => a.status === "in-progress").sort(byToken);
  const waiting = mine.filter((a) => a.status === "arrived").sort(byToken);
  const expected = mine.filter((a) => a.status === "booked" || a.status === "confirmed").sort((a, b) => a.startTime.localeCompare(b.startTime));
  const seen = mine.filter((a) => a.status === "completed").sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const waited = (a: Appointment) => a.arrivedAt ? Math.max(0, Math.round((now - new Date(a.arrivedAt).getTime()) / 60000)) : null;
  const waits = waiting.map(waited).filter((m): m is number => m !== null);
  const longest = waits.length ? Math.max(...waits) : 0;
  const longestColor = longest >= 30 ? "#dc2626" : longest >= 15 ? "#d97706" : "#16a34a";
  const waitPill = (m: number | null) => {
    if (m === null) return null;
    const c = m >= 30 ? ["#fef2f2", "#dc2626"] : m >= 15 ? ["#fffbeb", "#d97706"] : ["#f0fdf4", "#16a34a"];
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: c[0], color: c[1], fontSize: 11.5, fontWeight: 800 }}><Clock size={11} /> {m} min</span>;
  };

  const tile = (label: string, value: React.ReactNode, color: string, icon: React.ReactNode) => (
    <div style={{ flex: "1 1 150px", background: "#fff", border: "1px solid #ececf4", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div><div style={{ fontSize: 24, fontWeight: 900, color: "#1a1a2e", lineHeight: 1.1 }}>{value}</div><div style={{ fontSize: 12, color: "#8a8aa3", fontWeight: 700 }}>{label}</div></div>
    </div>
  );

  const card = (a: Appointment, lead: React.ReactNode, meta: React.ReactNode, actions?: React.ReactNode) => (
    <div key={a.id} style={{ background: "#fff", border: "1px solid #ececf4", borderRadius: 14, padding: 12, marginBottom: 10, boxShadow: "0 1px 2px rgba(20,20,60,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {lead}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.clientName}</div>
          <div style={{ fontSize: 12, color: "#6b6b8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.serviceNames.join(", ")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap", fontSize: 11.5, color: "#8a8aa3", fontWeight: 600 }}>
            <Stethoscope size={11} /> {a.staffName || "Unassigned"} {meta}
          </div>
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
  const chip = (a: Appointment, color: string) => (
    <div style={{ minWidth: 52, height: 52, borderRadius: 14, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, flexShrink: 0, padding: "0 6px" }}>{a.tokenNo ?? "–"}</div>
  );
  const column = (title: string, count: number, color: string, icon: React.ReactNode, children: React.ReactNode, empty: { text: string; hint?: string }) => (
    <section style={{ background: "#f7f7fb", borderRadius: 16, padding: 12, minWidth: 0, borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 10px", fontWeight: 900, fontSize: 14, color: "#1a1a2e" }}>
        <span style={{ color, display: "flex" }}>{icon}</span> {title}
        <span style={{ marginLeft: "auto", minWidth: 24, textAlign: "center", padding: "1px 8px", borderRadius: 20, background: `${color}1a`, color, fontSize: 12, fontWeight: 900 }}>{count}</span>
      </div>
      {count === 0 ? (
        <div style={{ textAlign: "center", padding: "26px 10px", color: "#8a8aa3" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{empty.text}</div>
          {empty.hint && <div style={{ fontSize: 12, marginTop: 4 }}>{empty.hint}</div>}
        </div>
      ) : children}
    </section>
  );

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: 16 }}>
      <PageTitle icon={<ListOrdered size={24} />} title="Queue" subtitle={new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
        right={<div style={{ display: "flex", gap: 8 }}>
          <a href="/dashboard/queue/display" target="_blank" rel="noopener noreferrer" style={{ ...GHOST, textDecoration: "none" }}><Monitor size={14} /> Waiting-room screen</a>
          <button type="button" onClick={() => setWalkIn(true)} style={BTN}><UserPlus size={14} /> Walk-in</button>
        </div>} />

      {notice && (
        <div style={{ margin: "12px 0 0", padding: "9px 12px", background: "#f5f3ff", borderRadius: 10, fontSize: 13, color: "#5b21b6", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1 }}>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#5b21b6", display: "flex" }}><X size={15} /></button>
        </div>
      )}

      {rxPrompt && (
        <div style={{ margin: "12px 0 0", padding: "9px 12px", background: "#f0fdf4", borderRadius: 10, fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1 }}>{rxPrompt.name} is done.</span>
          <a href={`/dashboard/clients/${rxPrompt.clientId}?rx=${rxPrompt.apptId}`} style={{ fontWeight: 800, color: "#7C3AED", textDecoration: "none" }}>Write prescription</a>
          <button type="button" aria-label="Dismiss" onClick={() => setRxPrompt(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "#166534", display: "flex" }}><X size={15} /></button>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
        {tile("Waiting", waiting.length, "#7C3AED", <Users size={19} />)}
        {tile("With the doctor", serving.length, "#16a34a", <Stethoscope size={19} />)}
        {tile("Seen today", seen.length, "#0891b2", <CircleCheck size={19} />)}
        {tile("Longest wait", waits.length ? `${longest} min` : "–", longestColor, <Clock size={19} />)}
      </div>

      {doctors.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }} role="tablist" aria-label="Filter by doctor">
          {[["all", "All doctors"] as const, ...doctors].map(([id, name]) => (
            <button key={id} type="button" role="tab" aria-selected={doc === id} onClick={() => setDoc(id)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${doc === id ? "#7C3AED" : "#e4e4ee"}`, background: doc === id ? "#7C3AED" : "#fff", color: doc === id ? "#fff" : "#6b6b8a", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>{name}</button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, alignItems: "start" }}>
        {column("Expected today", expected.length, "#6b6b8a", <CalendarClock size={17} />,
          expected.map((a) => card(a,
            <div style={{ minWidth: 52, height: 52, borderRadius: 14, background: "#ececf4", color: "#4b4b6b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{a.startTime}</div>, null,
            <button type="button" onClick={() => setStatus(a.id, "arrived")} style={{ ...BTN, background: "#fff", color: "#7C3AED", border: "1px solid #ddd6fe" }}><LogIn size={14} /> Check in</button>)),
          { text: "No booked appointments left today", hint: "Patients without a booking? Use Walk-in." })}

        {column("Waiting", waiting.length, "#7C3AED", <Users size={17} />,
          waiting.map((a, i) => card(a, chip(a, "#7C3AED"), waitPill(waited(a)),
            <>
              <button type="button" title="Print token slip" aria-label="Print token slip" onClick={() => printSlip(a, i)} style={GHOST}><Printer size={13} /></button>
              {!auto && (() => { const ph = getStoredClients().find((c) => c.id === a.clientId)?.phone; return ph ? <a href={whatsAppLink(ph, tokenMessage(a, i))} target="_blank" rel="noopener noreferrer" title="Send the token on WhatsApp" style={{ ...GHOST, textDecoration: "none", color: "#16a34a" }}><Send size={13} /></a> : null; })()}
              <button type="button" onClick={() => setStatus(a.id, "in-progress")} style={BTN}><PhoneCall size={14} /> {i === 0 ? "Call next" : "Call"}</button>
            </>)),
          { text: "No one is waiting", hint: "Check in an expected patient or add a walk-in." })}

        {column("With the doctor", serving.length, "#16a34a", <Stethoscope size={17} />,
          serving.map((a) => card(a, chip(a, "#16a34a"), null,
            <>
              <a href={`/dashboard/clients/${a.clientId}?rx=${a.id}`} style={{ ...GHOST, textDecoration: "none", color: "#7C3AED" }}>Prescription</a>
              <button type="button" onClick={() => setStatus(a.id, "completed")} style={{ ...BTN, background: "#16a34a" }}><Check size={14} /> Done</button>
            </>)),
          { text: "No one is in with a doctor" })}
      </div>

      {seen.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={SECTION}>Seen today</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {seen.slice(0, 12).map((a) => (
              <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: "#f0fdfa", color: "#0f766e", fontSize: 12, fontWeight: 700 }}>
                {a.tokenNo ? <b>#{a.tokenNo}</b> : null} {a.clientName}
              </span>
            ))}
          </div>
        </div>
      )}
      {walkIn && <WalkInModal onClose={() => setWalkIn(false)} onSave={addWalkIn} />}
    </div>
  );
}

function WalkInModal({ onClose, onSave }: { onClose: () => void; onSave: (f: { clientId: string; name: string; phone: string; staffId: string; serviceId: string }) => void }) {
  const [clients] = useState<Client[]>(() => getStoredClients());
  const [staff] = useState<Staff[]>(() => getStoredStaff().filter((s) => s.isActive));
  const [services] = useState<Service[]>(() => getStoredServices().filter((s) => s.isActive !== false));
  const [f, setF] = useState({ clientId: "", name: "", phone: "", staffId: staff[0]?.id ?? "", serviceId: "" });
  const ok = !!f.clientId || f.name.trim().length > 1;
  const lab: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, color: "#9898b0", textTransform: "uppercase", letterSpacing: "0.06em", margin: "10px 0 4px", display: "block" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 420, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontWeight: 900, fontSize: 16, flex: 1 }}>Walk-in patient</div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <label style={lab} htmlFor="wi-client">Existing patient</label>
        <select id="wi-client" value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })} style={INP}>
          <option value="">New patient…</option>
          {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
        </select>
        {!f.clientId && <>
          <label style={lab} htmlFor="wi-name">Name</label><input id="wi-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={INP} />
          <label style={lab} htmlFor="wi-phone">Phone (for the token on WhatsApp)</label><input id="wi-phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" style={INP} />
        </>}
        <label style={lab} htmlFor="wi-doc">Doctor</label>
        <select id="wi-doc" value={f.staffId} onChange={(e) => setF({ ...f, staffId: e.target.value })} style={INP}>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label style={lab} htmlFor="wi-svc">Treatment (optional)</label>
        <select id="wi-svc" value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })} style={INP}>
          <option value="">Consultation</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="button" disabled={!ok} onClick={() => onSave(f)} style={{ ...BTN, marginTop: 16, width: "100%", justifyContent: "center", opacity: ok ? 1 : 0.5 }}>Give token</button>
      </div>
    </div>
  );
}
