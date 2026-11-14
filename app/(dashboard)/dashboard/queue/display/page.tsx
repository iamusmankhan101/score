"use client";
/* eslint-disable @next/next/no-img-element -- the logo is a clinic-chosen URL of any size */

/**
 * Waiting-room screen. Open it on a TV signed in to the clinic: it shows the tokens being
 * served and the next ones in line, updates on its own, and can chime when a token is called.
 * Patient names are never shown, only token numbers and the doctor.
 */

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Maximize2 } from "lucide-react";
import { getStoredAppointments, subscribeToStoredData } from "@/lib/storage";
import { todayKey } from "@/lib/clinic-core";
import { clinicHeader } from "@/lib/clinic-wa";
import type { Appointment } from "@/lib/types";

const byToken = (a: Appointment, b: Appointment) => (a.tokenNo ?? 0) - (b.tokenNo ?? 0);

/** Two soft notes, played only after the user has switched sound on (browsers block audio before a click). */
function chime(ctx: AudioContext) {
  [[660, 0], [880, 0.22]].forEach(([freq, at]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + at + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.7);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + 0.75);
  });
}

export default function QueueDisplayPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [clinic, setClinic] = useState<{ name: string; logo?: string }>({ name: "" });
  const [now, setNow] = useState(() => new Date());
  const [sound, setSound] = useState(false);
  // "white": the logo is drawn in plain white straight on the screen. That only works when it has a transparent
  // background; otherwise (or if it can't be inspected) it stays in a white box.
  const [logoMode, setLogoMode] = useState<"white" | "box">("box");
  const [justCalled, setJustCalled] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const soundOn = useRef(false);
  const seenServing = useRef<Set<string> | null>(null);

  useEffect(() => {
    const load = () => {
      const list = getStoredAppointments();
      setAppts(list);
      const h = clinicHeader();
      setClinic({ name: h.name, logo: h.logo });
      // A token that wasn't being served a moment ago has just been called: chime and highlight it.
      const serving = new Set(list.filter((a) => a.date === todayKey() && a.status === "in-progress" && a.tokenNo).map((a) => a.id));
      const before = seenServing.current;
      seenServing.current = serving;
      if (before) {
        const fresh = [...serving].find((id) => !before.has(id));
        if (fresh) {
          setJustCalled(fresh);
          window.setTimeout(() => setJustCalled((cur) => cur === fresh ? null : cur), 8000);
          if (soundOn.current && audio.current) chime(audio.current);
        }
      }
    };
    load();
    const poll = window.setInterval(load, 10_000); // another device's changes arrive through sync
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    const off = subscribeToStoredData(load);
    return () => { window.clearInterval(poll); window.clearInterval(tick); off(); };
  }, []);

  const logoUrl = clinic.logo;
  useEffect(() => {
    if (!logoUrl) return;
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = 8; c.height = 8;
        const g = c.getContext("2d")!; g.drawImage(im, 0, 0, 8, 8);
        const corners = [0, 7].flatMap((x) => [0, 7].map((y) => g.getImageData(x, y, 1, 1).data[3]));
        setLogoMode(corners.every((a) => a < 20) ? "white" : "box");
      } catch { setLogoMode("box"); }
    };
    im.onerror = () => setLogoMode("box");
    im.src = logoUrl;
  }, [logoUrl]);

  function toggleSound() {
    if (!sound) {
      audio.current ??= new AudioContext();
      void audio.current.resume();
      chime(audio.current); // a test chime, so the clinic knows it works
    }
    soundOn.current = !sound;
    setSound(!sound);
  }

  const today = appts.filter((a) => a.date === todayKey() && a.tokenNo);
  const serving = today.filter((a) => a.status === "in-progress").sort(byToken);
  const waiting = today.filter((a) => a.status === "arrived").sort(byToken);
  const next = waiting.slice(0, 10);
  const time = now.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
  const date = now.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });

  const firstName = (full: string) => full.trim().split(/\s+/)[0] || "";
  const minutesWaiting = (a: Appointment) => a.arrivedAt ? Math.max(0, Math.round((now.getTime() - new Date(a.arrivedAt).getTime()) / 60000)) : null;
  const waitColor = (m: number) => m >= 30 ? ["#fef2f2", "#dc2626"] : m >= 15 ? ["#fffbeb", "#d97706"] : ["#f0fdf4", "#16a34a"];

  /** One patient card (first name only, never the full name). */
  const card = (a: Appointment, color: string, serving: boolean, isNext = false) => {
    const m = serving ? null : minutesWaiting(a);
    const wc = m === null ? null : waitColor(m);
    return (
      <div key={a.id} style={{ background: "#fff", color: "#1a1a2e", borderRadius: 22, padding: "clamp(12px, 1.4vw, 22px)", display: "flex", alignItems: "center", gap: "clamp(14px, 1.8vw, 28px)", marginBottom: "clamp(10px, 1.2vw, 18px)",
        outline: isNext ? "3px solid #c4b5fd" : undefined, animation: justCalled === a.id ? "qd-pulse 1.4s ease-in-out infinite" : undefined }}>
        <div style={{ minWidth: "clamp(70px, 8vw, 130px)", height: "clamp(70px, 8vw, 130px)", borderRadius: 20, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(34px, 4.6vw, 76px)", fontWeight: 900, flexShrink: 0, padding: "0 10px" }}>{a.tokenNo}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "clamp(20px, 2.6vw, 42px)", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName(a.clientName)}</div>
          <div style={{ fontSize: "clamp(14px, 1.6vw, 26px)", color: "#6b6b8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.serviceNames.join(", ")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4, fontSize: "clamp(13px, 1.4vw, 22px)", color: "#8a8aa3", fontWeight: 700 }}>
            {a.staffName && <span>{a.staffName}</span>}
            {wc && m !== null && <span style={{ background: wc[0], color: wc[1], padding: "2px 12px", borderRadius: 20 }}>{m} min</span>}
            {serving && justCalled === a.id && <span style={{ color: "#16a34a" }}>Please proceed</span>}
            {isNext && <span style={{ color: "#7C3AED" }}>Next</span>}
          </div>
        </div>
      </div>
    );
  };
  const column = (title: string, count: number, color: string, cards: React.ReactNode[], emptyText: string) => (
    <section style={{ background: "rgba(255,255,255,0.07)", borderRadius: 26, padding: "clamp(12px, 1.6vw, 24px)", borderTop: `5px solid ${color}`, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 6px clamp(10px, 1.2vw, 18px)" }}>
        <span style={{ fontSize: "clamp(18px, 2.2vw, 34px)", fontWeight: 800 }}>{title}</span>
        <span style={{ marginLeft: "auto", minWidth: 36, textAlign: "center", fontSize: "clamp(14px, 1.6vw, 26px)", fontWeight: 800, background: `${color}33`, color: "#fff", padding: "2px 14px", borderRadius: 20 }}>{count}</span>
      </div>
      {count === 0 ? <div style={{ textAlign: "center", padding: "clamp(28px, 4vw, 70px) 12px", fontSize: "clamp(16px, 2vw, 32px)", color: "rgba(255,255,255,0.55)", fontWeight: 300 }}>{emptyText}</div> : cards}
    </section>
  );


  return (
    <div ref={box} style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 15% -10%, #3b2a86 0%, #1d1442 55%, #140d30 100%)", color: "#fff", padding: "clamp(20px, 3vw, 44px)", display: "flex", flexDirection: "column", gap: "clamp(18px, 2.4vw, 36px)", position: "relative" }}>
      <style>{`@keyframes qd-pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.55)}50%{box-shadow:0 0 0 22px rgba(74,222,128,0)}}`}</style>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        {clinic.logo
          ? logoMode === "white"
            ? <img src={clinic.logo} alt={clinic.name} style={{ height: "clamp(44px, 6vw, 88px)", width: "auto", maxWidth: 420, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            : <div style={{ background: "#fff", borderRadius: 16, padding: "8px 18px", display: "flex" }}><img src={clinic.logo} alt={clinic.name} style={{ height: "clamp(36px, 4.5vw, 64px)", width: "auto", maxWidth: 320, objectFit: "contain" }} /></div>
          : <div style={{ fontSize: "clamp(22px, 2.6vw, 40px)", fontWeight: 800 }}>{clinic.name}</div>}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "clamp(28px, 3.6vw, 56px)", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{time}</div>
          <div style={{ fontSize: "clamp(13px, 1.4vw, 22px)", color: "#c4b5fd", marginTop: 4 }}>{date}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" aria-label={sound ? "Turn call sound off" : "Turn call sound on"} title={sound ? "Call sound on" : "Call sound off"} onClick={toggleSound}
            style={{ border: "none", background: sound ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, padding: 10, cursor: "pointer", display: "flex" }}>
            {sound ? <Bell size={18} /> : <BellOff size={18} />}
          </button>
          <button type="button" aria-label="Full screen" onClick={() => box.current?.requestFullscreen?.().catch(() => {})}
            style={{ border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, padding: 10, cursor: "pointer", display: "flex" }}><Maximize2 size={18} /></button>
        </div>
      </header>

      {/* Two columns, like the Queue page: who is with a doctor, and who is waiting */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: "clamp(14px, 2vw, 30px)", flex: 1, alignItems: "start" }}>
        {column("Now serving", serving.length, "#22c55e", serving.map((a) => card(a, "#16a34a", true)),
          waiting.length > 0 ? "Please be seated. You will be called shortly." : "Welcome. Please take a seat.")}
        {column("Waiting", waiting.length, "#8b5cf6", [
          ...next.map((a, i) => card(a, "#7C3AED", false, i === 0)),
          ...(waiting.length > next.length ? [<div key="more" style={{ textAlign: "center", fontSize: "clamp(16px, 1.8vw, 28px)", color: "rgba(255,255,255,0.6)", padding: 8 }}>+ {waiting.length - next.length} more</div>] : []),
        ], "No one is waiting")}
      </div>

      <footer style={{ fontSize: "clamp(12px, 1.2vw, 18px)", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        Please keep your token slip with you. Your number will appear above when it is your turn.
      </footer>
    </div>
  );
}
