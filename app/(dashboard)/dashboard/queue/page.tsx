"use client";

/**
 * Waiting-room queue. A patient who arrives gets a token (1, 2, 3… each day);
 * the doctor's team calls the next token. Status changes use the same
 * appointment statuses as everywhere else, so billing and reports stay in step.
 */

import { useEffect, useState } from "react";
import { ListOrdered, LogIn, PhoneCall, Check, UserPlus, Printer, Send, Monitor, X } from "lucide-react";
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
  const w = window.open("", "_blank", "width=320,height=420");
  if (!w) return;
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  w.document.write(`<!doctype html><title>Token ${a.tokenNo}</title><style>body{font-family:system-ui,sans-serif;text-align:center;margin:0;padding:12px;width:72mm}
    h1{font-size:15px;margin:0 0 6px}.n{font-size:84px;font-weight:900;line-height:1;margin:8px 0}.s{font-size:13px;margin:3px 0}.m{font-size:11px;color:#555}</style>
    <h1>${esc(clinicHeader().name)}</h1><div class="m">Your token</div><div class="n">${a.tokenNo}</div>
    <div class="s"><b>${esc(a.clientName)}</b></div><div class="s">${esc(a.staffName)}</div>
    <div class="m">${esc(todayKey())} · ${esc(hhmm())}</div><div class="m">${ahead > 0 ? `${ahead} ahead of you` : "You are next"}</div>
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

  const mine = appts.filter((a) => a.date === today);
  const serving = mine.filter((a) => a.status === "in-progress").sort((a, b) => (a.tokenNo ?? 0) - (b.tokenNo ?? 0));
  const waiting = mine.filter((a) => a.status === "arrived").sort((a, b) => (a.tokenNo ?? 0) - (b.tokenNo ?? 0));
  const expected = mine.filter((a) => a.status === "booked" || a.status === "confirmed").sort((a, b) => a.startTime.localeCompare(b.startTime));
  const waited = (a: Appointment) => a.arrivedAt ? Math.max(0, Math.round((now - new Date(a.arrivedAt).getTime()) / 60000)) : null;
  const token = (a: Appointment, color: string) => (
    <div style={{ width: 54, height: 54, borderRadius: 12, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, flexShrink: 0 }}>{a.tokenNo ?? "–"}</div>
  );
  const row = (a: Appointment, left: React.ReactNode, action?: React.ReactNode, sub?: string) => (
    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid #ececf4", borderRadius: 12, background: "#fff", marginBottom: 8 }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>{a.clientName}</div>
        <div style={{ fontSize: 12, color: "#6b6b8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.serviceNames.join(", ")} · {a.staffName}{sub ? ` · ${sub}` : ""}</div>
      </div>
      {action}
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <PageTitle icon={<ListOrdered size={24} />} title="Queue" subtitle={`${waiting.length} waiting · ${serving.length} with the doctor`}
        right={<div style={{ display: "flex", gap: 8 }}>
          <a href="/dashboard/queue/display" target="_blank" rel="noopener noreferrer" style={{ ...GHOST, textDecoration: "none" }}><Monitor size={14} /> Waiting-room screen</a>
          <button type="button" onClick={() => setWalkIn(true)} style={BTN}><UserPlus size={14} /> Walk-in</button>
        </div>} />
      {notice && <div style={{ margin: "10px 0 0", padding: "8px 12px", background: "#f5f3ff", borderRadius: 9, fontSize: 13, color: "#5b21b6" }}>{notice}</div>}

      <div style={SECTION}>Now serving</div>
      {serving.length === 0 ? <div style={{ color: "#8a8aa3", fontSize: 13 }}>Nobody is in with a doctor.</div> :
        serving.map((a) => row(a, token(a, "#16a34a"),
          <button type="button" onClick={() => setStatus(a.id, "completed")} style={{ ...BTN, background: "#16a34a" }}><Check size={14} /> Done</button>))}

      <div style={SECTION}>Waiting ({waiting.length})</div>
      {waiting.length === 0 ? <div style={{ color: "#8a8aa3", fontSize: 13 }}>No one waiting. Patients get a token when you check them in below.</div> :
        waiting.map((a, i) => row(a, token(a, "#7C3AED"),
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" title="Print token slip" aria-label="Print token slip" onClick={() => printSlip(a, i)} style={GHOST}><Printer size={13} /></button>
            {!auto && (() => { const ph = getStoredClients().find((c) => c.id === a.clientId)?.phone; return ph ? <a href={whatsAppLink(ph, tokenMessage(a, i))} target="_blank" rel="noopener noreferrer" title="Send the token on WhatsApp" style={{ ...GHOST, textDecoration: "none", color: "#16a34a" }}><Send size={13} /></a> : null; })()}
            <button type="button" onClick={() => setStatus(a.id, "in-progress")} style={BTN}><PhoneCall size={14} /> {i === 0 ? "Call next" : "Call"}</button>
          </div>,
          waited(a) !== null ? `waiting ${waited(a)} min` : undefined))}

      <div style={SECTION}>Expected today ({expected.length})</div>
      {expected.length === 0 ? <div style={{ color: "#8a8aa3", fontSize: 13 }}>No more booked appointments today. Use Walk-in for patients without a booking.</div> :
        expected.map((a) => row(a, <div style={{ width: 54, textAlign: "center", fontWeight: 800, fontSize: 13, color: "#6b6b8a" }}>{a.startTime}</div>,
          <button type="button" onClick={() => setStatus(a.id, "arrived")} style={{ ...BTN, background: "#fff", color: "#7C3AED", border: "1px solid #ddd6fe" }}><LogIn size={14} /> Check in</button>))}
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
