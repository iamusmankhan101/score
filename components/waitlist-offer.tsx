"use client";

/**
 * Waiting-list messaging, shared by the Waiting List page and the popup that
 * opens when an appointment is cancelled or marked no-show. Nothing is sent
 * until staff tap Notify.
 */

import { useState } from "react";
import { Hourglass, Send, X } from "lucide-react";
import { settingsStore } from "@/lib/settings-store";
import { getCurrentPlan } from "@/lib/plan-limits";
import { normalizePhone, whatsAppConnected } from "@/lib/whatsapp-scheduler";
import { getWaitlist, todayKey, type WaitlistEntry } from "@/lib/clinic";
import type { Appointment } from "@/lib/types";

export const fmtWaitDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

/** Pro / Premium with WhatsApp connected sends from here; everyone else gets WhatsApp opened, ready to send. */
export const canAutoSend = () =>
  getCurrentPlan().whatsapp && whatsAppConnected(settingsStore.wasender as Parameters<typeof whatsAppConnected>[0]);

export function waitlistMessage(e: WaitlistEntry, slot?: { date: string; startTime: string }) {
  const salonName = (settingsStore.salon as { name?: string }).name || "us";
  const when = slot ? ` on ${fmtWaitDate(slot.date)} at ${fmtTime(slot.startTime)}` : e.preferredDate ? ` on ${fmtWaitDate(e.preferredDate)}` : "";
  return `Hi ${e.name.split(" ")[0]}, a slot has opened up at ${salonName}${when} for ${e.wants}. Reply to book it — first come, first served!`;
}

export const waLink = (e: WaitlistEntry, text: string) => `https://wa.me/${normalizePhone(e.phone)}?text=${encodeURIComponent(text)}`;

export async function sendWaitlistMessage(e: WaitlistEntry, text: string): Promise<void> {
  const res = await fetch("/api/clinic/whatsapp-send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "text", phone: e.phone, text }) });
  const d = await res.json() as { ok?: boolean; error?: string };
  if (!d.ok) throw new Error(d.error || "Send failed");
}

/**
 * Who to offer a freed slot to: up to 3 people still waiting who want that day,
 * then people happy with any day — longest-waiting first. Past slots get nobody.
 */
export function waitlistMatches(date: string, limit = 3): WaitlistEntry[] {
  if (date < todayKey()) return [];
  const waiting = getWaitlist().filter((e) => e.status === "waiting" && e.phone && (!e.preferredDate || e.preferredDate === date));
  const byAge = (a: WaitlistEntry, b: WaitlistEntry) => a.createdAt.localeCompare(b.createdAt);
  return [
    ...waiting.filter((e) => e.preferredDate === date).sort(byAge),
    ...waiting.filter((e) => !e.preferredDate).sort(byAge),
  ].slice(0, limit);
}

/** Popup after a cancellation / no-show: offer the freed slot to the first people in line. */
export function WaitlistOffer({ appt, matches, onClose }: { appt: Appointment; matches: WaitlistEntry[]; onClose: () => void }) {
  const [auto] = useState(canAutoSend);
  const [sent, setSent] = useState<Record<string, string>>({});
  const text = (e: WaitlistEntry) => waitlistMessage(e, appt);

  async function notify(e: WaitlistEntry) {
    setSent((s) => ({ ...s, [e.id]: "sending" }));
    try {
      await sendWaitlistMessage(e, text(e));
      setSent((s) => ({ ...s, [e.id]: "sent" }));
    } catch (err) {
      setSent((s) => ({ ...s, [e.id]: err instanceof Error ? err.message : "Send failed" }));
    }
  }
  const pending = matches.filter((e) => !["sending", "sent"].includes(sent[e.id] ?? ""));

  const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 800, cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" };

  return (
    <div onClick={onClose} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 130, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(ev) => ev.stopPropagation()} className="modal-sheet" style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 460, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f3ff", display: "grid", placeItems: "center", flexShrink: 0 }}><Hourglass size={18} color="#7C3AED" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#1a1a2e" }}>A slot just opened</div>
            <div style={{ fontSize: 12.5, color: "#6b6b8a" }}>{fmtWaitDate(appt.date)} at {fmtTime(appt.startTime)} · {matches.length} on the waiting list want{matches.length === 1 ? "s" : ""} it</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: "none", background: "rgba(0,0,0,0.06)", borderRadius: 8, padding: 7, cursor: "pointer", display: "flex" }}><X size={14} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {matches.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #ececf4", borderRadius: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1a1a2e" }}>{e.name}</div>
                <div style={{ fontSize: 12, color: "#6b6b8a" }}>{e.wants}{e.preferredDate ? "" : " · any day"}{e.preferredTime ? ` · ${e.preferredTime}` : ""}</div>
                {sent[e.id] && !["sending", "sent"].includes(sent[e.id]) && <div style={{ fontSize: 11.5, color: "#dc2626" }}>{sent[e.id]}</div>}
              </div>
              {auto ? (
                <button type="button" onClick={() => notify(e)} disabled={sent[e.id] === "sending" || sent[e.id] === "sent"} style={btn}>
                  <Send size={13} /> {sent[e.id] === "sent" ? "Sent ✓" : sent[e.id] === "sending" ? "Sending…" : "Notify"}
                </button>
              ) : (
                <a href={waLink(e, text(e))} target="_blank" rel="noopener noreferrer" onClick={() => setSent((s) => ({ ...s, [e.id]: "sent" }))} style={btn}>
                  <Send size={13} /> {sent[e.id] === "sent" ? "Opened ✓" : "Notify"}
                </a>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {auto && matches.length > 1 && (
            <button type="button" disabled={pending.length === 0} onClick={() => pending.forEach(notify)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: pending.length ? "#7C3AED" : "#e8e8f0", color: pending.length ? "#fff" : "#9898b0", fontSize: 13, fontWeight: 800, cursor: pending.length ? "pointer" : "default" }}>
              Notify all {matches.length}
            </button>
          )}
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e4e4ee", background: "#fff", color: "#6b6b8a", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            {Object.keys(sent).length ? "Done" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  );
}
