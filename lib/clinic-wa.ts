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
