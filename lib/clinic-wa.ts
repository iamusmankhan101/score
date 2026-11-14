/** Browser helpers for messaging a patient from the clinic screens: automatic WhatsApp where it's connected, a wa.me link otherwise. */

import { getCurrentPlan } from "@/lib/plan-limits";
import { settingsStore } from "@/lib/settings-store";
import { normalizePhone, whatsAppConnected } from "@/lib/whatsapp-scheduler";

export function clinicHeader() {
  const salon = settingsStore.salon as { name?: string; phone?: string; address?: string; logo?: string };
  // Absolute, because the PDF is drawn on the server, which can't resolve a path like "/logo.png".
  let logo: string | undefined;
  try { logo = salon.logo ? new URL(salon.logo, window.location.href).href : undefined; } catch { /* no usable logo */ }
  return { name: salon.name || "Clinic", phone: salon.phone, address: salon.address, logo };
}

/**
 * Pro/Premium with WhatsApp connected: messages go straight to the patient
 * through the clinic's own number (app/api/clinic/whatsapp-send). Otherwise
 * the buttons fall back to opening WhatsApp with the message ready.
 */
export function autoWhatsApp(): boolean {
  return getCurrentPlan().whatsapp && whatsAppConnected(settingsStore.wasender as Parameters<typeof whatsAppConnected>[0]);
}

export async function sendClinicWhatsApp(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch("/api/clinic/whatsapp-send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clinic: clinicHeader(), ...payload }) });
  const d = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
  if (!d.ok) throw new Error(d.error || "WhatsApp send failed.");
}

/** wa.me link with the message filled in, for the patient's number. */
export const whatsAppLink = (phone: string, text: string) => `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;

// Printing on pre-printed letterhead paper: the PDF leaves the header area empty. A per-device choice.
const BLANK_HEADER_KEY = "werzio_pdf_blank_header";
export function blankHeaderOn(): boolean {
  try { return localStorage.getItem(BLANK_HEADER_KEY) === "on"; } catch { return false; }
}
export function setBlankHeader(on: boolean): void {
  try { localStorage.setItem(BLANK_HEADER_KEY, on ? "on" : "off"); } catch { /* choice isn't remembered */ }
}

/** Asks the server for a PDF (app/api/clinic/pdf) and saves it. */
export async function downloadClinicPdf(payload: Record<string, unknown>, filename: string) {
  const res = await fetch("/api/clinic/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clinic: { ...clinicHeader(), blankHeader: blankHeaderOn() }, ...payload }) });
  if (!res.ok) throw new Error("Couldn't create the PDF.");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = `${filename.replace(/[^\w .-]/g, "")}.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/** Opens the same letterhead PDF in the browser's print dialog (falls back to a new tab if the browser won't print it directly). */
export async function printClinicPdf(payload: Record<string, unknown>) {
  const res = await fetch("/api/clinic/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clinic: { ...clinicHeader(), blankHeader: blankHeaderOn() }, ...payload }) });
  if (!res.ok) throw new Error("Couldn't create the PDF.");
  const url = URL.createObjectURL(await res.blob());
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.onload = () => {
    try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } catch { window.open(url, "_blank"); }
  };
  frame.src = url;
  document.body.appendChild(frame);
  window.setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 120_000);
}

