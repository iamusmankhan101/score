/**
 * Rebooking reminders — "It's been 4 weeks since your Hair Color, time for a touch-up?"
 *
 * A service with `rebookAfterDays` set gets a personal WhatsApp that many days
 * after the client last had it, unless they already have a booking coming up.
 * Pure targeting lives here; queueing is in lib/winback-queue.ts (enqueueRebookForUser).
 */

export const REBOOK_DEFAULT_TEMPLATE =
  "Hi {{name}}! It's been {{weeks}} weeks since your {{service}} at {{salon_name}}. Time to book your next one? Just reply here 💜";

/** A reminder missed for a few days (cron down, salon closed) still goes out inside this window, never later. */
export const REBOOK_CATCHUP_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;
const DONE = new Set(["completed", "cancelled", "no-show"]);

export interface RebookService { id: string; name: string; rebookAfterDays?: number }
export interface RebookClient { id: string; name: string; phone?: string; whatsappOptedOut?: boolean }
export interface RebookAppointment { clientId: string; date: string; status: string; serviceIds?: string[] }
export interface RebookInvoice {
  clientId?: string; date: string; status?: string; advanceAmount?: number; creditSale?: boolean;
  items?: { type: string; sourceId?: string }[];
}

export interface RebookDue { client: RebookClient; service: RebookService; lastVisit: string; days: number }

/** Clients due a rebooking reminder today (YYYY-MM-DD), at most one per client — the service due soonest after its interval. */
export function findRebookDue(
  clients: RebookClient[], services: RebookService[], appointments: RebookAppointment[], invoices: RebookInvoice[], today: string,
): RebookDue[] {
  const tracked = new Map(services.filter((s) => (s.rebookAfterDays ?? 0) > 0).map((s) => [s.id, s]));
  if (tracked.size === 0) return [];

  // clientId -> serviceId -> last date they had it
  const last = new Map<string, Map<string, string>>();
  const note = (clientId: string | undefined, serviceId: string | undefined, date: string) => {
    if (!clientId || !serviceId || !tracked.has(serviceId) || !/^\d{4}-\d{2}-\d{2}/.test(date)) return;
    const day = date.slice(0, 10);
    const m = last.get(clientId) ?? new Map<string, string>();
    if ((m.get(serviceId) ?? "") < day) m.set(serviceId, day);
    last.set(clientId, m);
  };
  const upcoming = new Set<string>();
  for (const a of appointments) {
    if (a.status === "completed") for (const id of a.serviceIds ?? []) note(a.clientId, id, a.date);
    else if (!DONE.has(a.status) && a.date >= today) upcoming.add(a.clientId);
  }
  for (const inv of invoices) {
    // An advance is paid before the visit happens — it isn't a visit.
    if (inv.status === "partial" && (inv.advanceAmount ?? 0) > 0 && !inv.creditSale) continue;
    for (const item of inv.items ?? []) if (item.type === "service") note(inv.clientId, item.sourceId, inv.date);
  }

  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const due: RebookDue[] = [];
  for (const client of clients) {
    if (client.whatsappOptedOut || !client.phone || upcoming.has(client.id)) continue;
    let pick: RebookDue | null = null;
    for (const [serviceId, lastVisit] of last.get(client.id) ?? []) {
      const service = tracked.get(serviceId)!;
      const days = Math.round((todayMs - Date.parse(`${lastVisit}T00:00:00Z`)) / DAY_MS);
      const over = days - service.rebookAfterDays!;
      if (over < 0 || over > REBOOK_CATCHUP_DAYS) continue;
      if (!pick || over < pick.days - pick.service.rebookAfterDays!) pick = { client, service, lastVisit, days };
    }
    if (pick) due.push(pick);
  }
  return due;
}

export function rebookTemplateVars(d: RebookDue, salonName: string): Record<string, string> {
  return {
    name: d.client.name, service: d.service.name, salon_name: salonName,
    days: String(d.days), weeks: String(Math.max(1, Math.round(d.days / 7))), last_visit: d.lastVisit,
  };
}
