/**
 * /api/cron/backup
 *
 * Creates one backup bundle per salon (all its data as a single restore
 * point) plus a complete database archive, then prunes anything past its
 * retention window (see RETENTION_DAYS in lib/data-backup.ts) so these
 * tables don't grow forever. Manual snapshots are never pruned;
 * before-account-delete backups go after 30 days. The old one-row-per-entity snapshotAllSalonData()
 * still runs implicitly via backupExistingSalonData() on every write
 * elsewhere in the app (the "before-write" safety net) — this cron no longer
 * duplicates that per entity, since a bundle already captures the same data
 * as one clean row per salon.
 */

import { NextRequest } from "next/server";
import { encryptPlaintextRows, pruneOldBackups, snapshotAllSalonBundles, snapshotFullDatabase } from "@/lib/data-backup";
import { pruneRateLimits } from "@/lib/rate-limit";
import { db } from "@/lib/db";

// The first prune after a long gap can have thousands of expired rows to clear.
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Prune first and on its own: when it ran after the snapshot, a failing
    // snapshot also stopped expired backups from ever being cleared, so the
    // backup tables kept growing — which is what made the snapshot fail.
    const pruned = await pruneOldBackups();
    // Finished invoice-receipt queue rows still carry a full copy of the salon (logo included) that is never
    // read again. They had grown to ~130 MB, which is what stopped the full-database backup from being stored.
    // Idempotent: only rows that still hold a snapshot are touched.
    await db.execute("UPDATE wa_pos_receipt_queue SET salon_json = '{}' WHERE status != 'pending' AND length(salon_json) > 2").catch(() => {});
    await pruneRateLimits();
    // Rows from before encryption was switched on, a batch a night.
    const encrypted = await encryptPlaintextRows();
    const [salonBundles, database] = await Promise.all([
      snapshotAllSalonBundles("scheduled-snapshot"),
      snapshotFullDatabase("scheduled-snapshot"),
    ]);
    console.log("[backup] scheduled backup complete:", { salonBundles, database, pruned, encrypted });
    return Response.json({ ok: true, salonBundles, database, pruned, encrypted });
  } catch (err) {
    console.error("[backup] scheduled snapshot error:", err);
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Backup failed." }, { status: 500 });
  }
}
