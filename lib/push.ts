/**
 * lib/push.ts
 *
 * Web Push (VAPID) helper for the client-facing PWA.
 *
 * Subscriptions are stored per-tenant: every row carries the salon-owner id
 * that `resolveActor` resolves to, so a broadcast can only ever reach devices
 * that scanned *that* salon's QR code. `client_id` is optional — a customer who
 * enables notifications before we know who they are still gets a row, and it
 * is upgraded in place once they identify themselves by phone.
 *
 * VAPID keys are read lazily rather than at module load: `next build`
 * imports this file while pre-rendering and must not throw when the keys are
 * absent from the build environment.
 */

import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The JSON shape a browser's PushSubscription.toJSON() produces. */
export interface BrowserSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface StoredSubscription {
  id: string;
  userId: string;
  clientId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Payload delivered to the `push` handler in public/sw.js. */
export interface PushPayload {
  title: string;
  body: string;
  /** Path or absolute URL opened on notificationclick. */
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
  /** Collapse key — a later push with the same tag replaces the earlier one. */
  tag?: string;
  requireInteraction?: boolean;
  sentAt?: number;
}

export interface SendResult {
  sent: number;
  failed: number;
  pruned: number;
}

// ─── VAPID configuration ──────────────────────────────────────────────────────

let vapidReady = false;

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

/** True when both keys are present, i.e. push can actually be sent. */
export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

/**
 * Initialises web-push with the VAPID details on first use.
 * Throws a readable error instead of web-push's opaque one when unconfigured.
 */
export function initWebPush(): typeof webpush {
  if (vapidReady) return webpush;

  const publicKey  = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) {
    throw new Error(
      "Web Push is not configured — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
      "(generate a pair with `npx web-push generate-vapid-keys`).",
    );
  }

  // The VAPID "subject" must be a mailto: or https: URL identifying the sender;
  // push services reject anything else.
  const raw = process.env.VAPID_MAILTO?.trim() || "support@saloncentral.xyz";
  const subject = /^(mailto:|https?:\/\/)/.test(raw) ? raw : `mailto:${raw}`;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return webpush;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

/**
 * Created on demand, mirroring the `ensureTable()` pattern the loyalty-card and
 * booking routes already use, so a fresh database works without a migration step.
 */
export async function ensurePushTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      client_id       TEXT,
      endpoint        TEXT NOT NULL UNIQUE,
      p256dh          TEXT NOT NULL,
      auth            TEXT NOT NULL,
      user_agent      TEXT,
      created_at      TEXT NOT NULL,
      last_success_at TEXT,
      failure_count   INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id)`,
  ).catch(() => {});
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_push_subs_client ON push_subscriptions (user_id, client_id)`,
  ).catch(() => {});
}

/** Rejects anything that isn't a well-formed browser PushSubscription. */
export function isValidSubscription(value: unknown): value is BrowserSubscription {
  if (!value || typeof value !== "object") return false;
  const sub = value as Partial<BrowserSubscription>;
  if (typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint)) return false;
  if (sub.endpoint.length > 2000) return false;
  if (!sub.keys || typeof sub.keys !== "object") return false;
  return typeof sub.keys.p256dh === "string" && typeof sub.keys.auth === "string";
}

/**
 * Inserts or refreshes a subscription. The endpoint is the natural key: a
 * browser that re-subscribes returns the same endpoint, and re-registering
 * must update the owning client rather than create a duplicate row.
 */
export async function savePushSubscription(params: {
  userId: string;
  clientId?: string | null;
  subscription: BrowserSubscription;
  userAgent?: string | null;
  previousEndpoint?: string | null;
}): Promise<void> {
  const { userId, clientId = null, subscription, userAgent = null, previousEndpoint = null } = params;
  await ensurePushTable();

  // A rotated endpoint (pushsubscriptionchange) supersedes the old row.
  if (previousEndpoint && previousEndpoint !== subscription.endpoint) {
    await db.execute({
      sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
      args: [previousEndpoint],
    });
  }

  await db.execute({
    sql: `
      INSERT INTO push_subscriptions
        (id, user_id, client_id, endpoint, p256dh, auth, user_agent, created_at, failure_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(endpoint) DO UPDATE SET
        user_id       = excluded.user_id,
        -- Keep a previously-identified client when the new payload has none.
        client_id     = COALESCE(excluded.client_id, push_subscriptions.client_id),
        p256dh        = excluded.p256dh,
        auth          = excluded.auth,
        user_agent    = excluded.user_agent,
        failure_count = 0
    `,
    args: [
      `push_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      userId,
      clientId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      userAgent?.slice(0, 300) ?? null,
      new Date().toISOString(),
    ],
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await ensurePushTable();
  await db.execute({ sql: "DELETE FROM push_subscriptions WHERE endpoint = ?", args: [endpoint] });
}

/** All devices for one salon, optionally narrowed to a single customer. */
export async function listSubscriptions(
  userId: string,
  clientId?: string | null,
): Promise<StoredSubscription[]> {
  await ensurePushTable();

  const res = clientId
    ? await db.execute({
        sql: "SELECT id, user_id, client_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? AND client_id = ?",
        args: [userId, clientId],
      })
    : await db.execute({
        sql: "SELECT id, user_id, client_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
        args: [userId],
      });

  return res.rows.map((r) => ({
    id:       r.id as string,
    userId:   r.user_id as string,
    clientId: (r.client_id as string | null) ?? null,
    endpoint: r.endpoint as string,
    p256dh:   r.p256dh as string,
    auth:     r.auth as string,
  }));
}

export async function countSubscriptions(userId: string): Promise<number> {
  await ensurePushTable();
  const res = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?",
    args: [userId],
  });
  return Number(res.rows[0]?.n ?? 0);
}

// ─── Sending ──────────────────────────────────────────────────────────────────

function toWebPushSubscription(sub: StoredSubscription): WebPushSubscription {
  return { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
}

/**
 * Fans a payload out to every given subscription.
 *
 * Sends are chunked rather than fired all at once: a salon with a few thousand
 * subscribers would otherwise open that many simultaneous TLS connections and
 * exhaust the serverless function's socket budget mid-broadcast.
 *
 * 404/410 means the browser has permanently discarded the subscription, so the
 * row is deleted — the only way the table stays clean without a cron job.
 */
export async function sendPushToSubscriptions(
  subs: StoredSubscription[],
  payload: PushPayload,
  options: { ttl?: number; urgency?: "very-low" | "low" | "normal" | "high" } = {},
): Promise<SendResult> {
  if (subs.length === 0) return { sent: 0, failed: 0, pruned: 0 };

  const push = initWebPush();
  const body = JSON.stringify({ ...payload, sentAt: payload.sentAt ?? Date.now() });
  const now  = new Date().toISOString();

  let sent = 0;
  let failed = 0;
  const dead: string[] = [];

  const CHUNK = 50;
  for (let i = 0; i < subs.length; i += CHUNK) {
    const chunk = subs.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map(async (sub) => {
        try {
          await push.sendNotification(toWebPushSubscription(sub), body, {
            TTL: options.ttl ?? 60 * 60 * 24, // hold for a day if the device is offline
            urgency: options.urgency ?? "normal",
          });
          sent++;
          await db.execute({
            sql: "UPDATE push_subscriptions SET last_success_at = ?, failure_count = 0 WHERE endpoint = ?",
            args: [now, sub.endpoint],
          }).catch(() => {});
        } catch (err) {
          failed++;
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            dead.push(sub.endpoint);
          } else {
            console.error(`[push] send failed (${status ?? "network"}):`, (err as Error).message);
            await db.execute({
              sql: "UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE endpoint = ?",
              args: [sub.endpoint],
            }).catch(() => {});
          }
        }
      }),
    );
  }

  for (const endpoint of dead) {
    await db.execute({
      sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
      args: [endpoint],
    }).catch(() => {});
  }

  return { sent, failed, pruned: dead.length };
}

/** Convenience wrapper: broadcast to a whole salon (or one of its customers). */
export async function broadcastToSalon(
  userId: string,
  payload: PushPayload,
  clientId?: string | null,
): Promise<SendResult> {
  const subs = await listSubscriptions(userId, clientId);
  return sendPushToSubscriptions(subs, payload);
}

// ─── Staff booking alerts ─────────────────────────────────────────────────────

/**
 * Staff phones share the table but sit under "staff:<ownerId>", so a customer
 * broadcast (listSubscriptions(ownerId)) can never reach them. client_id holds the
 * branch the login works at, or "all" for the owner.
 */
export const staffPushKey = (ownerId: string) => `staff:${ownerId}`;

/** "New booking" on the phones of everyone at that branch who turned alerts on. */
export async function notifyStaffOfBooking(
  ownerId: string,
  appt: { id: string; clientName: string; serviceNames: string[]; date: string; startTime: string },
  locationId = "main",
): Promise<void> {
  if (!isPushConfigured()) return;
  const subs = (await listSubscriptions(staffPushKey(ownerId)))
    .filter((s) => s.clientId === "all" || s.clientId === locationId);
  if (subs.length === 0) return;
  const [h, m] = appt.startTime.split(":").map(Number);
  const time = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  const date = new Date(`${appt.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  await sendPushToSubscriptions(subs, {
    title: "New booking",
    body: `${appt.clientName} · ${appt.serviceNames.join(", ")} · ${date}, ${time}`,
    url: "/dashboard/appointments",
    tag: `booking-${appt.id}`,
  }, { urgency: "high" });
}
