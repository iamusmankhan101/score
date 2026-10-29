// ─── Service upsell ───────────────────────────────────────────────────────────
// What a stylist sold on top of what the client came in for — the facial added
// to a cut-and-blow-dry at the chair, not the cut itself.
//
// Two signals say a line was upsold, and either is enough:
//
//  1. It was added to an invoice that already existed. The bill is written when
//     the client arrives, so anything appended afterwards was sold during the
//     visit. The invoice editor stamps `upsell` on those lines, and it can be
//     toggled by hand for the cases that rule misses.
//
//  2. It isn't on the client's booking. Where an appointment exists, it records
//     what was agreed in advance, and POS never writes the cart back onto it, so
//     anything on the bill and not on the booking was sold during the visit.
//
// The second signal alone was the original design, and it is worthless to the
// many salons that take walk-ins and never book anything — there is no booking
// to compare against, so nothing is ever "extra" and the incentive never pays.
// The explicit flag is what makes this work for a counter-trade salon.

import type { Appointment, Service } from "./types";
import type { SalonInvoice, SalonInvoiceItem } from "./salon-invoices";
import { appointmentStaffIds } from "./appointment-staff";

export interface UpsellLine {
  invoiceNumber: string;
  date: string;
  serviceName: string;
  qty: number;
  /** The staff member's share of what the client paid for it, after discounts. */
  amount: number;
}

export interface UpsellSummary {
  /** Total upsold value credited to this staff member in the period. */
  value: number;
  /** The individual sales behind it, newest first. */
  lines: UpsellLine[];
}

/**
 * How many of each service the appointment booked.
 *
 * Keyed by id where the booking has one and by lower-cased name as well, since
 * an invoice line written before `sourceId` existed — or typed by hand at the
 * counter — can only be matched on its description.
 */
function bookedCounts(appt: Appointment): { byId: Map<string, number>; byName: Map<string, number> } {
  const byId = new Map<string, number>();
  const byName = new Map<string, number>();
  for (const id of appt.serviceIds) byId.set(id, (byId.get(id) ?? 0) + 1);
  for (const name of appt.serviceNames) {
    const key = name.trim().toLowerCase();
    if (key) byName.set(key, (byName.get(key) ?? 0) + 1);
  }
  return { byId, byName };
}

/**
 * How many units of one invoice line were sold beyond the booking.
 *
 * A booked service rung up twice is one booked and one upsold, so this works in
 * units rather than treating the whole line as booked or not. The count is
 * decremented as it is consumed, so two separate lines for the same booked
 * service don't each claim the same booking.
 */
function upsoldUnits(line: SalonInvoiceItem, booked: ReturnType<typeof bookedCounts>): number {
  const qty = Math.max(1, line.qty);
  const nameKey = line.description.trim().toLowerCase();

  let allowance = 0;
  if (line.sourceId && booked.byId.has(line.sourceId)) {
    allowance = booked.byId.get(line.sourceId)!;
    booked.byId.set(line.sourceId, Math.max(0, allowance - qty));
  } else if (booked.byName.has(nameKey)) {
    allowance = booked.byName.get(nameKey)!;
    booked.byName.set(nameKey, Math.max(0, allowance - qty));
  }
  return Math.max(0, qty - allowance);
}

/**
 * What the client actually paid per rupee of listed price.
 *
 * Invoice discounts are applied to the bill as a whole, not to any one line, so
 * an upsell's share of them has to be pro-rated. Without this an upsold service
 * would earn its incentive on a price the client never paid — and on a heavily
 * discounted bill that gap is the whole margin.
 */
function paidRatio(invoice: SalonInvoice): number {
  const listed = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  if (listed <= 0) return 1;
  return Math.min(1, invoice.total / listed);
}

/**
 * Who to credit an upsold line to, and what share each gets.
 *
 * Mirrors staffRevenueFromAppointment in lib/payouts.ts: a service flagged
 * multiStylist is worked by the whole assigned team, so its upsell is split
 * between them rather than going to whoever happened to be on the booking.
 */
function creditShare(
  line: SalonInvoiceItem,
  sellers: string[],
  staff: StaffRef,
  services: Service[],
): number {
  const service = line.sourceId
    ? services.find((s) => s.id === line.sourceId)
    : services.find((s) => s.name.trim().toLowerCase() === line.description.trim().toLowerCase());

  if (service?.multiStylist && service.assignedStaffIds.length >= 2) {
    return service.assignedStaffIds.includes(staff.id) ? 1 / service.assignedStaffIds.length : 0;
  }
  // Several staff on one sale share it evenly, like revenueInPeriod.
  return sellers.includes(staff.id) ? 1 / sellers.length : 0;
}

export interface StaffRef {
  id: string;
  name: string;
}

/**
 * Who made a sale, as staff ids — everyone on it when several worked it.
 *
 * Appointment-linked invoices name the stylists on the booking. A walk-in names
 * them only on the invoice, and older invoices carry just `staffName` — so the
 * name is matched against the roster when no id was recorded. Two staff sharing
 * a first name would collide, which is why the id is now stored at checkout.
 */
function sellersOf(invoice: SalonInvoice, appt: Appointment | undefined, staff: StaffRef): string[] {
  if (appt) return appointmentStaffIds(appt);
  if (invoice.staffIds?.length) return invoice.staffIds;
  if (invoice.staffId) return [invoice.staffId];
  const named = (invoice.staffName ?? "").trim().toLowerCase();
  const mine = (staff.name ?? "").trim().toLowerCase();
  return named && mine && named === mine ? [staff.id] : [];
}

/**
 * Services this staff member sold beyond the booking, across [start, end].
 *
 * Dated by the invoice rather than the appointment: the incentive is earned when
 * the sale is made, which is also the period the commission on it falls into.
 */
export function upsellInPeriod(
  staff: StaffRef,
  invoices: SalonInvoice[],
  appointments: Appointment[],
  services: Service[],
  start: string,
  end: string,
): UpsellSummary {
  const apptById = new Map(appointments.map((a) => [a.id, a]));
  const lines: UpsellLine[] = [];

  for (const invoice of invoices) {
    if (invoice.date < start || invoice.date > end) continue;
    const appt = invoice.appointmentId ? apptById.get(invoice.appointmentId) : undefined;
    const sellers = sellersOf(invoice, appt, staff);
    // Only a booking can be "gone beyond"; without one the explicit flag is the
    // only signal, and bookedCounts on an absent appointment would upsell
    // everything on the bill.
    const booked = appt ? bookedCounts(appt) : undefined;
    const ratio = paidRatio(invoice);

    for (const line of invoice.items) {
      if (line.type !== "service") continue;
      // Consumed for every line, upsold or not, so the booking allowance is
      // spent in order rather than being re-offered to a later line.
      const offBooking = booked ? upsoldUnits(line, booked) : 0;
      // A flagged line is upsold in full; an off-booking one only for the units
      // beyond what was booked.
      const units = line.upsell ? Math.max(1, line.qty) : offBooking;
      if (units <= 0) continue;

      const share = creditShare(line, sellers, staff, services);
      if (share <= 0) continue;

      const amount = (line.unitPrice || 0) * units * ratio * share;
      if (amount <= 0) continue;
      lines.push({
        invoiceNumber: invoice.number,
        date: invoice.date,
        serviceName: line.description,
        qty: units,
        amount: Math.round(amount),
      });
    }
  }

  lines.sort((a, b) => b.date.localeCompare(a.date));
  return { value: lines.reduce((sum, l) => sum + l.amount, 0), lines };
}

/**
 * Which lines of one invoice were sold beyond the booking, as a set of line ids.
 *
 * For showing the person editing an invoice what their additions are worth —
 * the same rule the payout uses, so the editor can't disagree with the payslip.
 * With no appointment to compare against, only explicitly flagged lines count;
 * treating the whole bill as upsold would be the obvious wrong answer.
 */
export function upsoldLineIds(invoice: SalonInvoice, appt: Appointment | undefined): Set<string> {
  const booked = appt ? bookedCounts(appt) : undefined;
  const ids = new Set<string>();
  for (const line of invoice.items) {
    if (line.type !== "service") continue;
    if (line.upsell || (booked && upsoldUnits(line, booked) > 0)) ids.add(line.id);
  }
  return ids;
}

/** The incentive itself: upsold value × the staff member's upsell rate. */
export function upsellIncentive(value: number, ratePercent?: number): number {
  const rate = Number(ratePercent);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(value * rate / 100);
}
