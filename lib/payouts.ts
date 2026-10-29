import { appointmentStaffIds } from "@/lib/appointment-staff";
import { locationUserKey } from "./locations";
import { persistEntity } from "./turso-sync";
import type { Appointment, Service, StaffPayType } from "./types";
import type { SalonInvoice } from "./salon-invoices";
import type { StaffRef } from "./upsell";

export type PayoutStatus = "pending" | "paid";

export interface Payout {
  id: string;
  staffId: string;
  staffName: string;
  periodStart: string;   // YYYY-MM-DD
  periodEnd: string;     // YYYY-MM-DD
  payType: StaffPayType;
  /** Revenue the staff member generated in the period (commission basis; informational for salary). */
  revenueGenerated: number;
  /** Commission % snapshot at the time this payout was processed (commission only). */
  commissionRate?: number;
  /** Computed pay before adjustments — revenue × rate for commission, or baseSalary for salary, plus any upsell incentive. */
  baseAmount: number;
  /** Value of services sold beyond what clients booked, in the period. */
  upsellValue?: number;
  /** Upsell incentive % snapshot at the time this payout was processed. */
  upsellRate?: number;
  /** upsellValue × upsellRate, already included in baseAmount. */
  upsellAmount?: number;
  /** Manual bonus (positive) or deduction (negative). */
  adjustment: number;
  adjustmentNote?: string;
  /** baseAmount + adjustment. */
  totalAmount: number;
  status: PayoutStatus;
  paymentMethod?: string;
  paidDate?: string;     // YYYY-MM-DD, set when marked paid
  notes?: string;
  createdAt: string;     // ISO timestamp
}

const KEY = "werzio_payouts";

export function getPayouts(): Payout[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(locationUserKey(KEY)) ?? "[]"); } catch { return []; }
}

/**
 * Saves locally (always) and returns the Turso write's outcome so a caller
 * can await it and warn the user instead of payout records staying invisible
 * on every device but the one they were processed on.
 */
export function savePayouts(list: Payout[]): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return persistEntity("payouts", list);
}

export async function addPayout(data: Omit<Payout, "id" | "createdAt">): Promise<{ payout: Payout; dbSaved: boolean }> {
  const entry: Payout = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const list = getPayouts();
  list.push(entry);
  const dbSaved = await savePayouts(list);
  return { payout: entry, dbSaved };
}

export async function updatePayout(id: string, patch: Partial<Omit<Payout, "id" | "createdAt">>): Promise<boolean> {
  return savePayouts(getPayouts().map((p) => p.id === id ? { ...p, ...patch } : p));
}

export function deletePayout(id: string): void {
  savePayouts(getPayouts().filter((p) => p.id !== id));
}

/** The most recent paid-through date for a staff member, or null if they've never been paid out. */
export function lastPayoutEnd(staffId: string, payouts: Payout[]): string | null {
  const mine = payouts.filter((p) => p.staffId === staffId).sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
  return mine[0]?.periodEnd ?? null;
}

/**
 * Revenue a staff member is credited with from one appointment. Ordinary services credit the
 * appointment's assigned staff in full; team services (Service.multiStylist) split their
 * price-weighted portion of the appointment total evenly across that service's assigned team,
 * regardless of which one staff was picked when booking.
 */
export function staffRevenueFromAppointment(appt: Appointment, staffId: string, services: Service[]): number {
  const total = appt.totalAmount ?? 0;
  // Weighted by the price charged on this booking when it was priced by hand,
  // otherwise by the catalog price.
  // Guests billed on the same appointment are part of the work done, and their
  // money is inside totalAmount, so their services weigh the split too.
  const bookedLines = [
    ...appt.serviceIds.map((id, idx) => ({ id, price: appt.servicePrices?.[idx] })),
    ...(appt.guests ?? []).flatMap((g) => g.serviceIds.map((id, idx) => ({ id, price: g.servicePrices?.[idx] }))),
  ];
  const apptServices = bookedLines
    .map(({ id, price }) => {
      const s = services.find((sv) => sv.id === id);
      return s ? { s, price: price ?? s.price ?? 0 } : null;
    })
    .filter((x): x is { s: Service; price: number } => Boolean(x));
  // Ordinary services are shared evenly by everyone booked on the appointment.
  const apptStaff = appointmentStaffIds(appt);
  const ownShare = apptStaff.includes(staffId) ? 1 / apptStaff.length : 0;
  if (apptServices.length === 0) return total * ownShare;

  const priceSum = apptServices.reduce((sum, x) => sum + (x.price || 0), 0);
  return apptServices.reduce((credited, { s, price }) => {
    const weight = priceSum > 0 ? (price || 0) / priceSum : 1 / apptServices.length;
    const portion = total * weight;
    if (s.multiStylist && s.assignedStaffIds.length >= 2) {
      return s.assignedStaffIds.includes(staffId) ? credited + portion / s.assignedStaffIds.length : credited;
    }
    return credited + portion * ownShare;
  }, 0);
}

/**
 * Dates wide enough to mean "all time" for the YYYY-MM-DD string comparisons
 * revenueInPeriod does. Cheaper and clearer than a second code path.
 */
/**
 * Whether a walk-in sale belongs to this staff member.
 *
 * Exported so the pages that count sales use the same rule as the one that
 * counts the money — a stylist's sale count and revenue disagreeing is worse
 * than either being slightly off. Invoices written before `staffId` existed
 * carry only a name, so that is matched as a fallback; an invoice naming nobody
 * belongs to nobody rather than to everybody.
 */
export function invoiceBelongsTo(invoice: SalonInvoice, staff: StaffRef): boolean {
  if (invoice.staffIds?.length) return invoice.staffIds.includes(staff.id);
  if (invoice.staffId) return invoice.staffId === staff.id;
  const named = (invoice.staffName ?? "").trim().toLowerCase();
  const mine = (staff.name ?? "").trim().toLowerCase();
  return !!named && !!mine && named === mine;
}

export const ALL_TIME_START = "0000-01-01";
export const ALL_TIME_END = "9999-12-31";

/**
 * Revenue a staff member generated within [start, end] inclusive.
 *
 * Two sources, because a salon's work reaches the books by two routes and only
 * one of them used to be counted:
 *
 *  - Completed appointments, which carry the sale total once POS has closed
 *    them out. Team-service revenue is split evenly among the assigned stylists.
 *  - Walk-in invoices with no appointment behind them. Counting these is what
 *    makes the figure right for a salon that books nothing and rings everything
 *    up at the counter — previously every stylist in such a salon showed zero
 *    revenue, and so zero commission, however much they had taken.
 *
 * Appointment-linked invoices are deliberately skipped: their money is already
 * counted through the appointment, and adding the invoice as well would pay
 * commission twice on one sale.
 */
export function revenueInPeriod(
  staff: StaffRef,
  appointments: Appointment[],
  services: Service[],
  start: string,
  end: string,
  invoices: SalonInvoice[] = [],
): number {
  const fromAppointments = appointments
    .filter((a) => a.status === "completed" && a.date >= start && a.date <= end)
    .reduce((sum, a) => sum + staffRevenueFromAppointment(a, staff.id, services), 0);

  const fromWalkIns = invoices
    .filter((inv) => !inv.appointmentId && inv.date >= start && inv.date <= end)
    .filter((inv) => invoiceBelongsTo(inv, staff))
    // Shared walk-ins split evenly, like team-service appointments.
    .reduce((sum, inv) => sum + (inv.total || 0) / (inv.staffIds?.length || 1), 0);

  return fromAppointments + fromWalkIns;
}
