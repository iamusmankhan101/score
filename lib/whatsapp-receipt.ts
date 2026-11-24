import { advanceThanks, isAdvanceInvoice, type SalonInvoice } from "@/lib/salon-invoices";
import { settingsStore } from "@/lib/settings-store";
import { fillTemplate, normalizePhone } from "@/lib/whatsapp-scheduler";

export type ReceiptQueueResult = "queued" | "failed" | "skipped";

/** Leads the caption when an edited invoice is sent again, so the client knows which copy counts. */
const UPDATED_INVOICE_TEXT = "Your invoice has been updated. Please find the revised copy attached — it replaces the one sent earlier.";

/**
 * Queues the invoice PDF to the client on WhatsApp (see /api/whatsapp/queue-pos-receipt).
 *
 * `resend` is for an invoice that was edited after it went out: the queue keeps
 * one row per invoice and normally refuses to send a row twice, which would
 * leave the client holding the old figures.
 */
export async function queueInvoiceReceipt(
  invoice: SalonInvoice,
  client: { name: string; phone?: string },
  opts: { resend?: boolean } = {},
): Promise<ReceiptQueueResult> {
  if (!client.phone) return "skipped";
  const ws = settingsStore.wasender as { enabled?: boolean; autoPosThankYou?: boolean };
  if (ws.enabled === false) return "skipped";

  const salon = settingsStore.salon as { name: string; phone: string; email: string; address: string; logo?: string };
  let thankYouText = "";
  if (opts.resend) {
    thankYouText = UPDATED_INVOICE_TEXT;
  } else {
    // The thank-you text is prepended to the invoice caption so the client gets
    // one WhatsApp message (PDF + caption), not two separate texts back to back.
    const thankYouTpl = (settingsStore.whatsapp as { posThankYou?: string }).posThankYou;
    if (isAdvanceInvoice(invoice)) {
      thankYouText = advanceThanks(client.name, salon.name); // not "thanks for visiting today" — nothing has been done yet
    } else if (ws.autoPosThankYou !== false && thankYouTpl) {
      thankYouText = fillTemplate(thankYouTpl, { name: client.name, salon_name: salon.name });
    }
  }

  try {
    const response = await fetch("/api/whatsapp/queue-pos-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice,
        salon,
        phone: normalizePhone(client.phone),
        providerConfig: settingsStore.wasender,
        thankYouText,
        resend: !!opts.resend,
      }),
    });
    const result = await response.json() as { ok?: boolean };
    return result.ok && response.ok ? "queued" : "failed";
  } catch {
    return "failed";
  }
}
