/**
 * GET /api/salonflow
 *
 * Today's live data for the Salonflow screen (/dashboard/salonflow), which
 * polls this every few seconds. Owners see every branch; a manager only their
 * own. Staff logins get 403 — the screen shows the day's takings.
 *
 * Sends the menu, staff and hours plus today's appointments and paid bills,
 * and the same weekday last week (up to the same time) for trend arrows. The
 * page turns this into stations and alerts itself. Client phones are masked
 * here, and nothing else about clients leaves the server.
 *
 * Days are Pakistan time, like the rest of the screen.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { resolveActor } from "@/lib/api-auth";
import type { Appointment, Client, Service, Staff } from "@/lib/types";
import type { SalonInvoice } from "@/lib/salon-invoices";
import type { SalonLocation } from "@/lib/locations";

type Json = Record<string, unknown>;

const PKT_OFFSET_MS = 5 * 3600_000;
const DAY_MS = 24 * 3600_000;

const pktDate = (t: number) => new Date(t + PKT_OFFSET_MS).toISOString().slice(0, 10);
const pktTimeOfDay = (t: number) => (t + PKT_OFFSET_MS) % DAY_MS;

/** "2026-10-11" + "14:30" (PKT) → epoch ms. */
function pktEpoch(date: string, time: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "");
  const t = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  if (!d || !t) return null;
  return Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]) - PKT_OFFSET_MS;
}

function maskPhone(phone: string | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 3 ? `•••• ${digits.slice(-3)}` : "";
}

async function readRow<T>(key: string): Promise<T | null> {
  const result = await db.execute({ sql: "SELECT data FROM salon_data WHERE entity = ?", args: [key] });
  if (result.rows.length === 0) return null;
  try { return JSON.parse(result.rows[0].data as string) as T; } catch { return null; }
}

/** One branch's entities, with records deleted on any device (lib/deleted-records.ts) left out. */
async function readBranch(userId: string, locationId: string) {
  const prefix = locationId === "main" ? `${userId}_` : `${userId}_${locationId}_`;
  const list = async <T>(entity: string) => {
    const rows = await readRow<T[]>(prefix + entity);
    return Array.isArray(rows) ? rows : [];
  };
  const [tombstones, staff, services, appointments, invoices, clients] = await Promise.all([
    list<{ id?: string; entity?: string }>("deleted_records"),
    list<Staff>("staff"),
    list<Service>("services"),
    list<Appointment>("appointments"),
    list<SalonInvoice>("salon_invoices"),
    list<Client>("clients"),
  ]);
  const gone = new Set(tombstones.map((t) => `${t.entity}:${t.id}`));
  const keep = <T extends { id: string }>(entity: string, rows: T[]) => rows.filter((r) => r?.id && !gone.has(`${entity}:${r.id}`));
  return {
    staff: keep("staff", staff),
    services: keep("services", services),
    appointments: keep("appointments", appointments),
    invoices: keep("salon_invoices", invoices),
    clients: keep("clients", clients),
  };
}

// ponytail: only fully paid bills count as collected; part-payments and refunds are left out.
const paidOn = (inv: SalonInvoice, date: string) => inv.status === "paid" && (inv.paidDate ?? inv.date) === date;

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req);
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (actor.role === "staff") return Response.json({ error: "Not allowed" }, { status: 403 });

  try {
    const settings = (await readRow<Json>(`${actor.userId}_settings`)) ?? {};
    const salon = (settings.salon ?? {}) as { name?: string; city?: string };
    const configured = ((settings.locations as { items?: SalonLocation[] } | undefined)?.items) ?? [];
    const allBranches = configured.length ? configured : [{ id: "main", name: "Main Branch", city: salon.city }];
    const branches = actor.role === "manager" ? allBranches.filter((b) => b.id === actor.locationId) : allBranches;

    const now = Date.now();
    const today = pktDate(now);
    const lastWeekDate = pktDate(now - 7 * DAY_MS);
    const lastWeekCutoff = now - 7 * DAY_MS;

    const staff: Json[] = [], appointments: Json[] = [], payments: Json[] = [];
    const services = new Map<string, Json>();
    const byBranch: Record<string, { collected: number; served: number }> = {};

    for (const branch of branches) {
      const data = await readBranch(actor.userId, branch.id);
      const phoneOf = new Map(data.clients.map((c) => [c.id, c.phone]));

      for (const p of data.staff) {
        if (p.isActive === false) continue;
        staff.push({ id: p.id, name: p.name, role: p.role ?? "", branchId: branch.id });
      }
      for (const s of data.services) {
        if (s.isActive === false || services.has(s.id)) continue;
        services.set(s.id, {
          id: s.id, name: s.name, category: s.category, durationMin: s.durationMin || 30, price: s.price || 0,
          priceMax: s.variablePrice && s.priceRangeMax ? s.priceRangeMax : null,
          ...(s.assignedStaffIds?.length ? { staffIds: s.assignedStaffIds } : {}),
        });
      }
      for (const a of data.appointments) {
        if (a.date !== today) continue;
        const start = pktEpoch(a.date, a.startTime);
        if (start == null) continue;
        const end = pktEpoch(a.date, a.endTime) ?? start + 30 * 60_000;
        const stamp = Date.parse(String((a as unknown as Json)._updatedAt ?? ""));
        appointments.push({
          id: a.id, branchId: branch.id, staffId: a.staffId, clientId: a.clientId || `walkin:${a.id}`,
          clientName: a.clientName || "Walk-in", clientPhone: maskPhone(phoneOf.get(a.clientId)),
          serviceIds: a.serviceIds ?? [], serviceNames: a.serviceNames ?? [],
          start, end: Math.max(end, start + 5 * 60_000), status: a.status, source: a.source, price: a.totalAmount || 0,
          completedAt: a.completedAt ? Date.parse(a.completedAt) : undefined,
          // ponytail: the app doesn't record when a client arrived or sat down, so the last edit stands in for it.
          // Upgrade path: stamp arrivedAt/startedAt when the status changes in the appointments page.
          changedAt: Number.isFinite(stamp) ? stamp : undefined,
        });
      }

      let collected = 0, served = 0;
      for (const inv of data.invoices) {
        if (paidOn(inv, lastWeekDate) && Date.parse(inv.createdAt) <= lastWeekCutoff) collected += inv.total || 0;
        if (!paidOn(inv, today)) continue;
        const created = Date.parse(inv.createdAt);
        payments.push({
          id: inv.id, branchId: branch.id, appointmentId: inv.appointmentId ?? null, staffId: inv.staffId ?? null,
          clientId: inv.clientId ?? null, clientName: inv.clientName || "Walk-in", clientPhone: maskPhone(inv.clientPhone),
          description: (inv.items ?? []).map((i) => i.description).filter(Boolean).join(" + ") || "Sale",
          at: Number.isFinite(created) && pktDate(created) === today ? created : now,
          total: inv.total || 0, tax: inv.taxAmount || 0, method: inv.paymentMethod || "cash",
        });
      }
      for (const a of data.appointments) {
        if (a.date !== lastWeekDate || a.status !== "completed") continue;
        const done = a.completedAt ? Date.parse(a.completedAt) : pktEpoch(a.date, a.endTime);
        if (done != null && pktTimeOfDay(done) <= pktTimeOfDay(now)) served++;
      }
      byBranch[branch.id] = { collected, served };
    }

    return Response.json({
      now,
      salon: { id: actor.userId, name: salon.name || "Salon" },
      hours: Array.isArray(settings.hours) ? settings.hours : null,
      branches: branches.map((b) => ({ id: b.id, name: b.name, city: b.city ?? salon.city ?? null })),
      staff,
      services: [...services.values()],
      appointments,
      payments,
      lastWeek: { date: pktEpoch(lastWeekDate, "00:00"), byBranch },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[salonflow] GET error:", err);
    return Response.json({ error: "Could not read salon data" }, { status: 500 });
  }
}
