// Self-check for lib/rebook.ts — run: npx tsx lib/rebook.check.ts
import assert from "node:assert/strict";
import { findRebookDue } from "./rebook";

const services = [{ id: "color", name: "Hair Color", rebookAfterDays: 28 }, { id: "cut", name: "Haircut" }];
const client = { id: "c1", name: "Nawal", phone: "03001234567" };
const visit = (date: string) => ({ clientId: "c1", date, status: "paid", items: [{ type: "service", sourceId: "color" }] });

// exactly 28 days after → due, with the right numbers
const [d] = findRebookDue([client], services, [], [visit("2026-10-31")], "2026-11-28");
assert.equal(d.service.name, "Hair Color"); assert.equal(d.days, 28);
// too early, or past the catch-up window → nothing
assert.equal(findRebookDue([client], services, [], [visit("2026-11-05")], "2026-11-28").length, 0);
assert.equal(findRebookDue([client], services, [], [visit("2026-10-01")], "2026-11-28").length, 0);
// already has an upcoming booking → nothing
assert.equal(findRebookDue([client], services, [{ clientId: "c1", date: "2026-12-02", status: "booked" }], [visit("2026-10-31")], "2026-11-28").length, 0);
// opted out → nothing; service without a reminder → nothing
assert.equal(findRebookDue([{ ...client, whatsappOptedOut: true }], services, [], [visit("2026-10-31")], "2026-11-28").length, 0);
assert.equal(findRebookDue([client], services, [], [{ ...visit("2026-10-31"), items: [{ type: "service", sourceId: "cut" }] }], "2026-11-28").length, 0);
// an advance payment isn't a visit
assert.equal(findRebookDue([client], services, [], [{ ...visit("2026-10-31"), status: "partial", advanceAmount: 500 }], "2026-11-28").length, 0);
// completed appointment counts as a visit
assert.equal(findRebookDue([client], services, [{ clientId: "c1", date: "2026-10-31", status: "completed", serviceIds: ["color"] }], [], "2026-11-28").length, 1);
console.log("rebook checks passed");
