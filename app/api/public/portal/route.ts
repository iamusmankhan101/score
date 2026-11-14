/**
 * GET /api/public/portal?token=… — the patient's own read-only record.
 * Only what a patient should see: no clinical notes, no signatures, no private photos.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ensurePortalTable, readEntity } from "@/lib/patient-portal";
import { planProgress } from "@/lib/clinic-core";
import type { Appointment, Service } from "@/lib/types";
import type { SalonInvoice } from "@/lib/salon-invoices";
import type { ConsentRecord, Consultation, Prescription, TreatmentPlan } from "@/lib/clinic";

export async function GET(req: NextRequest) {
  const limit = await rateLimit("public-portal", clientIp(req), { maxAttempts: 60, windowMs: 10 * 60 * 1000, blockMs: 30 * 60 * 1000 });
  if (limit.blocked) return Response.json({ ok: false, error: "Too many attempts. Please try again later." }, { status: 429 });
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token || token.length > 100) return Response.json({ ok: false, error: "This link isn't valid." }, { status: 404 });

  try {
    await ensurePortalTable();
    const r = await db.execute({ sql: "SELECT * FROM portal_links WHERE token = ?", args: [token] });
    const row = r.rows[0];
    if (!row) return Response.json({ ok: false, error: "This link isn't valid." }, { status: 404 });
    if (String(row.expires_at) < new Date().toISOString()) return Response.json({ ok: false, error: "This link has expired. Ask the clinic for a new one." }, { status: 410 });

    const userId = String(row.user_id), loc = String(row.location_id), clientId = String(row.client_id);
    const read = <T,>(e: string) => readEntity<T>(userId, loc, e);
    const [appts, invoices, services, rxs, consultations, plans, consents, clients] = await Promise.all([
      read<Appointment>("appointments"), read<SalonInvoice>("salon_invoices"), read<Service>("services"), read<Prescription>("prescriptions"),
      read<Consultation>("consultations"), read<TreatmentPlan>("treatment_plans"), read<ConsentRecord>("consents"), read<{ id: string; name: string }>("clients"),
    ]);
    const settings = await db.execute({ sql: "SELECT data FROM salon_data WHERE entity = ?", args: [`${userId}_settings`] }).catch(() => null);
    let clinicName = "Clinic"; let phone = "";
    try { const s = settings?.rows.length ? JSON.parse(settings.rows[0].data as string)?.salon : null; clinicName = s?.name || clinicName; phone = s?.phone || ""; } catch {}

    const mine = <T extends { clientId?: string }>(l: T[]) => l.filter((x) => x.clientId === clientId);
    const myInvoices = mine(invoices);
    return Response.json({
      ok: true,
      clinicName, phone, bookUrl: `/client/${userId}`,
      patientName: clients.find((c) => c.id === clientId)?.name ?? "",
      appointments: mine(appts).map((a) => ({ id: a.id, date: a.date, startTime: a.startTime, services: a.serviceNames, doctor: a.staffName, status: a.status }))
        .sort((a, b) => b.date.localeCompare(a.date)),
      prescriptions: mine(rxs).map((p) => ({ id: p.id, date: p.date, doctor: p.practitionerName, diagnosis: p.diagnosis, treatment: p.treatment, items: p.items, notes: p.notes })).sort((a, b) => b.date.localeCompare(a.date)),
      records: mine(consultations).map((c) => ({ id: c.id, date: c.date, doctor: c.practitionerName, concerns: c.concerns, advice: c.recommendation?.notes })).sort((a, b) => b.date.localeCompare(a.date)),
      consents: mine(consents).map((c) => ({ id: c.id, title: c.title, signedAt: c.signedAt })).sort((a, b) => b.signedAt.localeCompare(a.signedAt)),
      plans: mine(plans).map((p) => ({ id: p.id, title: p.title, closed: !!p.closed, total: p.sessions, ...planProgress(p, myInvoices, mine(appts), services) }))
        .map(({ id, title, closed, total, done, sessions }) => ({ id, title, closed, total, done, next: sessions.find((s) => s.status !== "done")?.date })),
      invoices: myInvoices.map((i) => ({
        id: i.id, number: i.number, date: i.date, total: i.total, status: i.status,
        paid: i.status === "paid" ? i.total : i.status === "partial" ? (i.advanceAmount ?? 0) : 0,
        items: i.items.map((x) => (x as { description?: string }).description ?? ""),
      })).sort((a, b) => b.date.localeCompare(a.date)),
    });
  } catch (err) {
    console.error("[public/portal]", err);
    return Response.json({ ok: false, error: "Couldn't load your record." }, { status: 500 });
  }
}
