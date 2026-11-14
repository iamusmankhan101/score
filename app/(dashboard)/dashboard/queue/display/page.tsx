"use client";
/* eslint-disable @next/next/no-img-element -- the logo is a clinic-chosen URL of any size */

/**
 * Waiting-room screen. Open it on a TV signed in to the clinic: it shows the tokens being
 * served and the next ones in line, updates on its own, and can chime when a token is called.
 * Only token numbers are shown (plus the doctor a called token should go to); never patient names or treatments.
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
  // The clinic logo redrawn as plain white ink on a transparent background (whatever background it was saved with);
  // null until it's ready, or when it can't be read, in which case a white box is used instead.
  const [whiteLogo, setWhiteLogo] = useState<string | null>(null);
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
        const w = Math.min(im.naturalWidth, 900), h = Math.round(im.naturalHeight * w / im.naturalWidth);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d")!; g.drawImage(im, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h), px = d.data;
        for (let i = 0; i < px.length; i += 4) {
          // Dark ink becomes opaque white; a light or transparent background becomes transparent.
          const L = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          let a = Math.max(0, Math.min(1, (226 - L) / (226 - 165))) * (px[i + 3] / 255);
          if (a < 0.1) a = 0;
          px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = Math.round(a * 255);
        }
        g.putImageData(d, 0, 0);
        setWhiteLogo(c.toDataURL("image/png"));
      } catch { setWhiteLogo(null); }
    };
    im.onerror = () => setWhiteLogo(null);
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
  const next = waiting.slice(0, 24);
  const time = now.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
  const date = now.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });

  /** A token tile: the number only. A called token also shows its doctor, so people know where to go. */
  const tile = (a: Appointment, kind: "serving" | "next" | "waiting") => (
    <div key={a.id} style={{
      borderRadius: 18, textAlign: "center", padding: "clamp(8px, 1vw, 14px) 6px",
      background: kind === "serving" ? "linear-gradient(160deg,#16a34a,#15803d)" : kind === "next" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
      border: kind === "next" ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
      animation: justCalled === a.id ? "qd-pulse 1.4s ease-in-out infinite" : undefined,
    }}>
      <div style={{ fontSize: kind === "serving" ? "clamp(40px, 5vw, 80px)" : "clamp(30px, 3.6vw, 58px)", fontWeight: 900, lineHeight: 1.05 }}>{a.tokenNo}</div>
      {kind === "serving" && a.staffName && <div style={{ fontSize: "clamp(11px, 1.1vw, 17px)", fontWeight: 700, opacity: 0.9, marginTop: 2 }}>{a.staffName}</div>}
      {kind === "serving" && justCalled === a.id && <div style={{ fontSize: "clamp(10px, 1vw, 15px)", letterSpacing: "0.16em", textTransform: "uppercase", color: "#dcfce7", marginTop: 2 }}>Please proceed</div>}
      {kind === "next" && <div style={{ fontSize: "clamp(10px, 1vw, 15px)", letterSpacing: "0.16em", textTransform: "uppercase", color: "#ddd6fe", marginTop: 2 }}>Next</div>}
    </div>
  );
  const column = (title: string, count: number, color: string, tiles: React.ReactNode[], emptyText: string, minTile: string) => (
    <section style={{ background: "rgba(255,255,255,0.07)", borderRadius: 22, padding: "clamp(12px, 1.4vw, 20px)", borderTop: `4px solid ${color}`, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 4px clamp(10px, 1vw, 16px)" }}>
        <span style={{ fontSize: "clamp(15px, 1.7vw, 26px)", fontWeight: 800 }}>{title}</span>
        <span style={{ marginLeft: "auto", minWidth: 30, textAlign: "center", fontSize: "clamp(12px, 1.3vw, 20px)", fontWeight: 800, background: `${color}33`, padding: "1px 12px", borderRadius: 20 }}>{count}</span>
      </div>
      {count === 0
        ? <div style={{ textAlign: "center", padding: "clamp(22px, 3vw, 48px) 12px", fontSize: "clamp(14px, 1.6vw, 24px)", color: "rgba(255,255,255,0.55)", fontWeight: 300 }}>{emptyText}</div>
        : <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minTile}, 1fr))`, gap: "clamp(8px, 1vw, 14px)" }}>{tiles}</div>}
    </section>
  );

  return (
    <div ref={box} style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 15% -10%, #3b2a86 0%, #1d1442 55%, #140d30 100%)", color: "#fff", padding: "clamp(20px, 3vw, 44px)", display: "flex", flexDirection: "column", gap: "clamp(18px, 2.4vw, 36px)", position: "relative" }}>
      <style>{`@keyframes qd-pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.55)}50%{box-shadow:0 0 0 22px rgba(74,222,128,0)}}`}</style>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        {clinic.logo
          ? whiteLogo
            ? <img src={whiteLogo} alt={clinic.name} style={{ height: "clamp(40px, 5vw, 72px)", width: "auto", maxWidth: 420, objectFit: "contain" }} />
            : <div style={{ background: "#fff", borderRadius: 14, padding: "6px 14px", display: "flex" }}><img src={clinic.logo} alt={clinic.name} style={{ height: "clamp(32px, 4vw, 56px)", width: "auto", maxWidth: 320, objectFit: "contain" }} /></div>
          : <div style={{ fontSize: "clamp(20px, 2.2vw, 34px)", fontWeight: 800 }}>{clinic.name}</div>}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "clamp(24px, 2.8vw, 44px)", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{time}</div>
          <div style={{ fontSize: "clamp(12px, 1.2vw, 18px)", color: "#c4b5fd", marginTop: 4 }}>{date}</div>
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

      {/* Two columns: tokens being served, and tokens waiting. Numbers only. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "clamp(12px, 1.6vw, 24px)", flex: 1, alignItems: "start" }}>
        {column("Now serving", serving.length, "#22c55e", serving.map((a) => tile(a, "serving")),
          waiting.length > 0 ? "Please be seated. You will be called shortly." : "Welcome. Please take a seat.", "clamp(120px, 11vw, 170px)")}
        {column("Waiting", waiting.length, "#8b5cf6", [
          ...next.map((a, i) => tile(a, i === 0 ? "next" : "waiting")),
          ...(waiting.length > next.length ? [<div key="more" style={{ alignSelf: "center", textAlign: "center", fontSize: "clamp(13px, 1.4vw, 22px)", color: "rgba(255,255,255,0.6)" }}>+ {waiting.length - next.length} more</div>] : []),
        ], "No one is waiting", "clamp(86px, 8vw, 124px)")}
      </div>

      <footer style={{ fontSize: "clamp(12px, 1.2vw, 18px)", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        Please keep your token slip with you. Your number will appear above when it is your turn.
      </footer>
    </div>
  );
}
