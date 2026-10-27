// ─── Deletion tombstones ──────────────────────────────────────────────────────
// Deleting a record used to mean nothing more than "drop it from this browser's
// localStorage and push the shorter list to Turso". That is not enough to make a
// delete stick, because every read path in this app *merges* rather than
// overwrites:
//
//   • syncFromDB() unions DB + localStorage, so any other device or tab still
//     holding the record pushes it straight back up on its next page load.
//   • GET /api/db?entity=salon_invoices re-injects invoices from the WhatsApp
//     receipt queue (wa_pos_receipt_queue), which keeps its row long after the
//     receipt has been sent.
//
// A tombstone records "this id was deleted" so every merge point can drop the
// record again instead of resurrecting it. Tombstones sync between devices like
// any other entity (see ENTITIES in lib/turso-sync.ts) and are enforced
// server-side in app/api/db/route.ts, so a device that has been offline since
// before the delete cannot bring the record back either.

import { locationUserKey } from "@/lib/locations";

export interface DeletedRecord {
  id: string;        // id of the deleted record
  entity: string;    // which entity it belonged to, e.g. "salon_invoices"
  deletedAt: string; // ISO timestamp
  restoredAt?: string; // set when an admin restores the record (Admin → Backups)
  _updatedAt?: string; // last change — devices keep the newest copy, so a restore beats a stale tombstone
}

/** A restored tombstone stays in the list (so stale devices adopt the restore) but no longer hides anything. */
export const isActiveDeletion = (r: Pick<DeletedRecord, "restoredAt">) => !r.restoredAt;

export const DELETED_RECORDS_ENTITY = "deleted_records";

const BASE_KEY = `werzio_${DELETED_RECORDS_ENTITY}`;

// Tombstones are tiny (~80 bytes) but they sync on every page load, so keep the
// list bounded. Newest are kept — an id old enough to fall off the end has long
// since been pruned from every device's localStorage and from Turso.
const MAX_TOMBSTONES = 5000;

export function getDeletedRecords(locationId?: string): DeletedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(locationUserKey(BASE_KEY, locationId));
    const parsed = JSON.parse(raw || "[]") as DeletedRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r.id === "string" && r.id);
  } catch {
    return [];
  }
}

export function getDeletedIds(entity?: string, locationId?: string): Set<string> {
  return new Set(
    getDeletedRecords(locationId)
      .filter((r) => isActiveDeletion(r) && (!entity || r.entity === entity))
      .map((r) => r.id),
  );
}

/** Drops any record whose id has been tombstoned for `entity`. */
export function pruneDeleted<T extends { id: string }>(entity: string, list: T[]): T[] {
  const ids = getDeletedIds(entity);
  if (ids.size === 0) return list;
  return list.filter((item) => !ids.has(item.id));
}

/**
 * Appends tombstones locally and returns the full updated list, ready to be
 * pushed to Turso. Most callers should use recordDeletions() in lib/turso-sync.ts
 * instead, which does both in one call.
 */
export function appendDeletions(entity: string, ids: string[]): DeletedRecord[] {
  const existing = getDeletedRecords();
  if (typeof window === "undefined") return existing;

  const known = new Set(existing.filter(isActiveDeletion).map((r) => r.id));
  const deletedAt = new Date().toISOString();
  const added = ids
    .filter((id) => id && !known.has(id))
    .map((id) => ({ id, entity, deletedAt, _updatedAt: deletedAt }));
  if (added.length === 0) return existing;

  // A fresh tombstone replaces a restored one for the same id (deleted again after a restore).
  const addedIds = new Set(added.map((r) => r.id));
  const list = [...added, ...existing.filter((r) => !addedIds.has(r.id))].slice(0, MAX_TOMBSTONES);
  localStorage.setItem(locationUserKey(BASE_KEY), JSON.stringify(list));
  return list;
}
