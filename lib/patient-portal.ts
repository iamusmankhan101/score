/**
 * Patient portal: a private link a clinic sends so a patient can see their own
 * appointments, prescriptions, plan progress and bills (/portal/[token]) and book
 * again. Same trust model as remote consent (lib/consent-requests.ts): the token is
 * 24 random bytes and the only key. Clinics can revoke by creating a new link,
 * which retires the old ones for that patient.
 */

import { randomBytes } from "crypto";
import { db } from "./db";

export const PORTAL_LINK_DAYS = 30;

export async function ensurePortalTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS portal_links (
      token       TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      location_id TEXT NOT NULL,
      client_id   TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      expires_at  TEXT NOT NULL
    )
  `);
}

export const newPortalToken = () => randomBytes(24).toString("base64url");

/** Reads one synced list the way the app stores it (see appendSignedConsent). */
export async function readEntity<T>(userId: string, locationId: string, entity: string): Promise<T[]> {
  const key = locationId === "main" ? `${userId}_${entity}` : `${userId}_${locationId}_${entity}`;
  const r = await db.execute({ sql: "SELECT data FROM salon_data WHERE entity = ?", args: [key] }).catch(() => null);
  try { const list = r?.rows.length ? JSON.parse(r.rows[0].data as string) : []; return Array.isArray(list) ? list : []; } catch { return []; }
}
