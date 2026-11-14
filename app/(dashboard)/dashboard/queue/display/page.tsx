"use client";

/** Waiting-room screen: the tokens being served and the next ones in line. Open it on a TV signed in to the clinic; it updates on its own. */

import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { getStoredAppointments, subscribeToStoredData } from "@/lib/storage";
import { todayKey } from "@/lib/clinic-core";
import { clinicHeader } from "@/lib/clinic-wa";
import type { Appointment } from "@/lib/types";

export default function QueueDisplayPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [name, setName] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => { setAppts(getStoredAppointments()); setName(clinicHeader().name); };
    load();
    const poll = window.setInterval(load, 15_000); // another device's changes arrive through sync
    const off = subscribeToStoredData(load);
    return () => { window.clearInterval(poll); off(); };
  }, []);

  const today = appts.filter((a) => a.date === todayKey() && a.tokenNo);
  const byToken = (a: Appointment, b: Appointment) => (a.tokenNo ?? 0) - (b.tokenNo ?? 0);
  const serving = today.filter((a) => a.status === "in-progress").sort(byToken);
  const next = today.filter((a) => a.status === "arrived").sort(byToken).slice(0, 8);

  return (
    <div ref={box} style={{ minHeight: "100vh", background: "#1d1442", color: "#fff", padding: "32px 40px 44px", position: "relative" }}>
      <button type="button" aria-label="Full screen" onClick={() => box.current?.requestFullscreen?.().catch(() => {})}
        style={{ position: "absolute", top: 14, right: 14, border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: 8, cursor: "pointer" }}><Maximize2 size={16} /></button>
      <div style={{ fontSize: 20, fontWeight: 800, opacity: 0.8 }}>{name}</div>
      <div style={{ fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 22, color: "#c4b5fd" }}>Now serving</div>
      {serving.length === 0 ? <div style={{ fontSize: 28, marginTop: 10, opacity: 0.6 }}>Please wait</div> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 10 }}>
          {serving.map((a) => (
            <div key={a.id} style={{ background: "#16a34a", borderRadius: 20, padding: "14px 30px", textAlign: "center" }}>
              <div style={{ fontSize: "clamp(64px, 14vw, 140px)", fontWeight: 900, lineHeight: 1 }}>{a.tokenNo}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{a.staffName}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 34, color: "#c4b5fd" }}>Next in line</div>
      {next.length === 0 ? <div style={{ fontSize: 20, marginTop: 10, opacity: 0.6 }}>No one waiting</div> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
          {next.map((a) => <div key={a.id} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "8px 24px", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800 }}>{a.tokenNo}</div>)}
        </div>
      )}
    </div>
  );
}
