"use client";

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

  const label: React.CSSProperties = { fontSize: "clamp(13px, 1.3vw, 20px)", letterSpacing: "0.22em", textTransform: "uppercase", color: "#c4b5fd", fontWeight: 700 };

  return (
    <div ref={box} style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 15% -10%, #3b2a86 0%, #1d1442 55%, #140d30 100%)", color: "#fff", padding: "clamp(20px, 3vw, 44px)", display: "flex", flexDirection: "column", gap: "clamp(18px, 2.4vw, 36px)", position: "relative" }}>
      <style>{`@keyframes qd-pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.55)}50%{box-shadow:0 0 0 22px rgba(74,222,128,0)}}`}</style>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        {clinic.logo
          // eslint-disable-next-line @next/next/no-img-element -- clinic-chosen logo URL
          ? <div style={{ background: "#fff", borderRadius: 16, padding: "8px 18px", display: "flex" }}><img src={clinic.logo} alt={clinic.name} style={{ height: "clamp(36px, 4.5vw, 64px)", width: "auto", maxWidth: 320, objectFit: "contain" }} /></div>
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

      {/* Now serving */}
      <section>
        <div style={label}>Now serving</div>
        {serving.length === 0 ? (
          <div style={{ marginTop: 14, fontSize: "clamp(24px, 3vw, 44px)", color: "rgba(255,255,255,0.55)", fontWeight: 300 }}>
            {waiting.length > 0 ? "Please be seated. You will be called shortly." : "Welcome. Please take a seat."}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(14px, 2vw, 28px)", marginTop: 16 }}>
            {serving.map((a) => (
              <div key={a.id} style={{ background: "linear-gradient(160deg,#16a34a,#15803d)", borderRadius: 28, padding: "clamp(14px, 2vw, 28px) clamp(28px, 4vw, 64px)", textAlign: "center", minWidth: "clamp(180px, 20vw, 320px)", animation: justCalled === a.id ? "qd-pulse 1.4s ease-in-out infinite" : undefined }}>
                <div style={{ fontSize: "clamp(72px, 13vw, 200px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>{a.tokenNo}</div>
                {a.staffName && <div style={{ fontSize: "clamp(16px, 2vw, 32px)", fontWeight: 700, marginTop: 6 }}>{a.staffName}</div>}
                {justCalled === a.id && <div style={{ fontSize: "clamp(13px, 1.4vw, 22px)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 6, color: "#dcfce7" }}>Please proceed</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Next in line */}
      <section style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div style={label}>Next in line</div>
          {waiting.length > 0 && <div style={{ fontSize: "clamp(13px, 1.3vw, 20px)", color: "rgba(255,255,255,0.55)" }}>{waiting.length} waiting</div>}
        </div>
        {next.length === 0 ? (
          <div style={{ marginTop: 14, fontSize: "clamp(20px, 2.4vw, 36px)", color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>No one waiting</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(10px, 1.4vw, 20px)", marginTop: 16 }}>
            {next.map((a, i) => (
              <div key={a.id} style={{ background: i === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)", border: i === 0 ? "2px solid rgba(255,255,255,0.45)" : "2px solid transparent", borderRadius: 22, padding: "clamp(8px, 1.2vw, 18px) clamp(20px, 2.6vw, 44px)", textAlign: "center", minWidth: "clamp(90px, 9vw, 150px)" }}>
                <div style={{ fontSize: "clamp(36px, 6vw, 96px)", fontWeight: 800, lineHeight: 1.1 }}>{a.tokenNo}</div>
                {i === 0 && <div style={{ fontSize: "clamp(11px, 1.1vw, 17px)", letterSpacing: "0.18em", textTransform: "uppercase", color: "#ddd6fe" }}>Next</div>}
              </div>
            ))}
            {waiting.length > next.length && (
              <div style={{ alignSelf: "center", fontSize: "clamp(16px, 1.8vw, 28px)", color: "rgba(255,255,255,0.55)" }}>+ {waiting.length - next.length} more</div>
            )}
          </div>
        )}
      </section>

      <footer style={{ fontSize: "clamp(12px, 1.2vw, 18px)", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        Please keep your token slip with you. Your number will appear above when it is your turn.
      </footer>
    </div>
  );
}
