import type { Appointment, Client } from "@/lib/types";
import { getDefaultLocationId } from "@/lib/locations";
import { normalizePhone } from "@/lib/whatsapp-scheduler";
import { newClientId } from "@/lib/ids";

/**
 * A client record for a guest typed by name only, with nothing already in the
 * system to match — the salon's client base is the source of truth for who's
 * been in, so anyone billed on a visit gets a real record, not just a name on
 * an invoice line.
 */
export function newGuestClient(name: string, createdAt: string, phone?: string): Client {
  return {
    id: newClientId(),
    name: name.trim(),
    phone: phone?.trim() ? normalizePhone(phone) : "",
    locationId: getDefaultLocationId(),
    tags: ["New"],
    source: "walk-in",
    createdAt,
    totalVisits: 0,
    totalSpend: 0,
  };
}

/**
 * Fills in `clientId` on every guest that doesn't already have one, creating a
 * client record per distinct name (case-insensitive) rather than one per
 * occurrence — the same person typed on two different days, or rung up twice
 * at the till, becomes one client record, not two.
 */
export function resolveGuestClientIds<G extends { clientId?: string; name: string; phone?: string }>(
  guestsList: G[],
  createdAt: string,
): { guests: G[]; newClients: Client[] } {
  const created = new Map<string, Client>();
  const guests = guestsList.map((g) => {
    if (g.clientId || !g.name.trim()) return g;
    const key = g.name.trim().toLowerCase();
    let client = created.get(key);
    if (!client) {
      client = newGuestClient(g.name, createdAt, g.phone);
      created.set(key, client);
    }
    return { ...g, clientId: client.id };
  });
  return { guests, newClients: Array.from(created.values()) };
}

export interface ClientCredit {
  visits: number;
  spend: number;
  lastDate: string;
}

/**
 * Every client credited by a set of appointments: the main client in full
 * (the invoice, spend and loyalty are theirs — they're the one who pays), and
 * each named guest for their own share of what was actually done to them.
 * Guests get a visit and their own spend on their own record; no loyalty
 * points, which stay with whoever paid.
 */
export function creditsFromAppointments(appts: Appointment[]): Map<string, ClientCredit> {
  const map = new Map<string, ClientCredit>();
  const bump = (id: string | undefined, spend: number, date: string) => {
    if (!id) return;
    const cur = map.get(id) ?? { visits: 0, spend: 0, lastDate: "" };
    map.set(id, { visits: cur.visits + 1, spend: cur.spend + spend, lastDate: date > cur.lastDate ? date : cur.lastDate });
  };
  for (const a of appts) {
    bump(a.clientId, a.totalAmount, a.date);
    for (const g of a.guests ?? []) {
      bump(g.clientId, g.servicePrices.reduce((sum, p) => sum + p, 0), a.date);
    }
  }
  return map;
}

/**
 * Applies (`sign` 1) or reverses (`sign` -1) a credit map onto a client list.
 * `lastVisitDate` only ever moves forward on apply — a reversal (deleting a
 * booking) doesn't try to guess what the "previous" last-visit date was.
 */
export function applyClientCredits(clients: Client[], credits: Map<string, ClientCredit>, sign: 1 | -1): Client[] {
  return clients.map((c) => {
    const credit = credits.get(c.id);
    if (!credit) return c;
    return {
      ...c,
      totalVisits: Math.max(0, c.totalVisits + sign * credit.visits),
      totalSpend: Math.max(0, c.totalSpend + sign * credit.spend),
      lastVisitDate: sign > 0 && credit.lastDate > (c.lastVisitDate ?? "") ? credit.lastDate : c.lastVisitDate,
    };
  });
}
