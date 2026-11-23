/**
 * Treatment-specific aftercare & follow-up messages (aesthetic clinics).
 *
 * A flow is a list of "day N after the treatment" WhatsApp messages for the
 * treatments it matches (linked ids, or name keywords — so the defaults work
 * before anything is linked). The daily cron app/api/cron/clinic-aftercare
 * queues each step once, plus two reminders: sessions left in a package after
 * one is used, and the next session of a treatment plan coming due.
 * Isomorphic: the cron and the settings page share it.
 */

import type { Service } from "./types";

export interface AftercareStep {
  /** Days after the treatment date. */
  day: number;
  /** {name}, {treatment} and {clinic} are filled in. */
  message: string;
}

export interface AftercareFlow {
  id: string;
  name: string;
  serviceIds: string[];
  keywords: string[];
  steps: AftercareStep[];
}

export interface RevisitSettings { enabled: boolean; days: number; message: string }

export const DEFAULT_REVISIT: RevisitSettings = {
  enabled: true, days: 25,
  message: "Hi {name}, it's been about a month since your {treatment} at {clinic} — it's time for your next visit! Reply here to book 💜",
};

export function revisitSettings(clinic: ClinicAutomationSettings | undefined): RevisitSettings {
  return { ...DEFAULT_REVISIT, ...(clinic?.revisit ?? {}) };
}

export interface ClinicAutomationSettings {
  autoAftercare?: boolean;
  /** Salons (not clinics): aftercare is opt-in — nothing is sent unless this is true. */
  salonAftercare?: boolean;
  aftercareFlows?: AftercareFlow[] | null;
  /** "You have N sessions left" the day after a package session is used. */
  packageReminders?: boolean;
  /** "Time to come back" for every aftercare-enabled service, `days` after the visit (on by default). */
  revisit?: RevisitSettings;
  /** "Your next session is due" a few days before a plan session falls due. */
  planReminders?: boolean;
}

const flow = (id: string, name: string, keywords: string[], steps: [number, string][]): AftercareFlow =>
  ({ id, name, keywords, serviceIds: [], steps: steps.map(([day, message]) => ({ day, message })) });

export const DEFAULT_AFTERCARE_FLOWS: AftercareFlow[] = [
  flow("af-botox", "Botox", ["botox", "botulinum", "anti-wrinkle", "dysport"], [
    [1, "Hi {name}, thank you for your {treatment} at {clinic} yesterday. For the first 24 hours: stay upright for 4 hours, avoid touching or massaging the area, and skip the gym, sauna and alcohol. Message us if anything worries you."],
    [7, "Hi {name}, it's been a week since your {treatment}. Results should be showing now — how are you finding it? Reply with any questions."],
    [14, "Hi {name}, your {treatment} should be at its full effect by now. If anything looks uneven, reply here and we'll book a quick review."],
    [90, "Hi {name}, it's been about 3 months since your {treatment} at {clinic} — the usual time for a top-up. Reply to book your next appointment."],
  ]),
  flow("af-filler", "Dermal filler", ["filler", "hyaluronic", "lip"], [
    [1, "Hi {name}, thank you for visiting {clinic}. Some swelling and bruising after {treatment} is normal. Use a cold compress, avoid pressure on the area, and skip exercise, heat and alcohol for 24–48 hours. Contact us straight away if you notice severe pain, skin colour changes or vision problems."],
    [7, "Hi {name}, how is your {treatment} settling? Swelling should be going down now. Reply with a photo if you'd like us to check."],
    [14, "Hi {name}, your {treatment} has now settled. If you'd like a review, reply and we'll book you in."],
  ]),
  flow("af-laser", "Laser", ["laser", "ipl", "hair removal"], [
    [1, "Hi {name}, after your {treatment}: keep the area cool and moisturised, avoid sun, hot showers and exfoliating for 48 hours, and use SPF 50 daily."],
    [7, "Hi {name}, how is your skin after your {treatment} at {clinic}? Any redness should have settled. Reply if you have concerns."],
    [28, "Hi {name}, your next {treatment} session is due soon — sessions work best spaced about 4 weeks apart. Reply to book."],
  ]),
  flow("af-peel", "Chemical peel", ["peel"], [
    [1, "Hi {name}, after your {treatment}: don't pick or peel flaking skin, use a gentle cleanser and moisturiser, and wear SPF 50 every day."],
    [3, "Hi {name}, peeling and tightness around now is normal after a {treatment}. Keep moisturising and stay out of the sun."],
    [21, "Hi {name}, your skin has renewed since your {treatment}. Ready for the next session? Reply to book."],
  ]),
  flow("af-micro", "Microneedling / PRP", ["microneedling", "dermapen", "prp", "platelet"], [
    [1, "Hi {name}, after your {treatment}: no makeup for 24 hours, avoid sun, exercise and active skincare for 48 hours, and keep your skin clean and moisturised."],
    [7, "Hi {name}, how is your skin a week after your {treatment}? Reply with any questions."],
    [30, "Hi {name}, it's time for your next {treatment} session at {clinic}. Reply to book."],
  ]),
  flow("af-facial", "Facial / Hydrafacial", ["hydrafacial", "facial"], [
    [3, "Hi {name}, how is your skin after your {treatment} at {clinic}? Remember SPF and plenty of water."],
    [30, "Hi {name}, it's been a month since your {treatment} — the ideal time for your next one. Reply to book."],
  ]),
];

/** Starter schedules for salons (hair, skin, nails, bridal). */
export const SALON_AFTERCARE_FLOWS: AftercareFlow[] = [
  flow("sf-colour", "Hair colour / highlights", ["colour", "color", "highlight", "balayage", "ombre", "toner"], [
    [2, "Hi {name}, thank you for visiting {clinic}! To keep your {treatment} looking fresh: wait 48 hours before washing, use sulphate-free shampoo and cool water, and avoid heat styling where you can."],
    [30, "Hi {name}, it's been a month since your {treatment} at {clinic}. Time for a gloss or root touch-up? Reply to book."],
  ]),
  flow("sf-keratin", "Keratin / smoothing / rebonding", ["keratin", "smoothing", "rebonding", "botox hair", "straightening"], [
    [1, "Hi {name}, after your {treatment}: keep your hair dry and loose for 72 hours (no tying, clips or tucking behind ears) and avoid water, gym and heat."],
    [4, "Hi {name}, you can wash your hair now. Please use only a sulphate-free shampoo and conditioner to make your {treatment} last."],
    [90, "Hi {name}, your {treatment} is due for a refresh around now. Reply to book at {clinic}."],
  ]),
  flow("sf-cut", "Haircut / styling", ["haircut", "hair cut", "trim", "blow dry", "layer"], [
    [30, "Hi {name}, it's been about a month since your {treatment} at {clinic}. Ready for a trim to keep the shape? Reply to book."],
  ]),
  flow("sf-treatment", "Hair spa / treatment", ["hair spa", "hair treatment", "protein", "scalp", "hair mask"], [
    [2, "Hi {name}, thank you for your {treatment} at {clinic}. Avoid washing for 24 hours and use a gentle shampoo to keep the benefits."],
    [21, "Hi {name}, how is your hair after your {treatment}? Reply to book your next session."],
  ]),
  flow("sf-facial", "Facial / skin", ["facial", "cleanup", "clean up", "hydrafacial", "whitening", "polish"], [
    [1, "Hi {name}, after your {treatment}: skip makeup, scrubs and the sun for 24 hours, drink plenty of water and use SPF."],
    [30, "Hi {name}, it's been a month since your {treatment} at {clinic} — the ideal time for your next one. Reply to book."],
  ]),
  flow("sf-wax", "Waxing / threading", ["wax", "threading", "bleach", "sugaring"], [
    [1, "Hi {name}, after your {treatment}: avoid hot showers, sun, gym and tight clothes for 24 hours, and don't scrub the area."],
    [21, "Hi {name}, your next {treatment} is due about now. Reply to book at {clinic}."],
  ]),
  flow("sf-nails", "Manicure / pedicure / nails", ["manicure", "pedicure", "nail", "gel", "acrylic"], [
    [2, "Hi {name}, thank you for visiting {clinic}! Moisturise your hands and cuticles daily and wear gloves for chores to keep your {treatment} lasting."],
    [18, "Hi {name}, it's nearly time for your next {treatment}. Reply to book at {clinic}."],
  ]),
  flow("sf-makeup", "Bridal / party makeup", ["bridal", "makeup", "make-up", "party"], [
    [1, "Hi {name}, thank you for choosing {clinic} for your {treatment}! Cleanse your skin gently tonight and keep it moisturised. We'd love to hear how it went — reply with a photo or feedback."],
  ]),
];

export function aftercareFlows(clinic: ClinicAutomationSettings | undefined, isClinic = true): AftercareFlow[] {
  return Array.isArray(clinic?.aftercareFlows) ? clinic!.aftercareFlows! : isClinic ? DEFAULT_AFTERCARE_FLOWS : SALON_AFTERCARE_FLOWS;
}

/** Flows that apply to a treatment — linked by id or matched on its name. */
export function flowsForService(service: Pick<Service, "id" | "name">, flows: AftercareFlow[]): AftercareFlow[] {
  const name = service.name.toLowerCase();
  return flows.filter((f) => f.serviceIds.includes(service.id) || f.keywords.some((k) => k.trim() && name.includes(k.trim().toLowerCase())));
}

export function fillAftercare(message: string, vars: { name: string; treatment: string; clinic: string }): string {
  return message.replace(/\{(name|treatment|clinic)\}/g, (_, k: keyof typeof vars) => vars[k]);
}
