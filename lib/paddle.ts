/**
 * lib/paddle.ts
 *
 * Turns a paid Paddle transaction into a plan on a salon account.
 *  - The pricing page (website/) sells Starter / Pro / Premium through Paddle.
 *  - Paddle calls /api/webhooks/paddle on `transaction.completed`.
 *  - If an account with the customer's checkout email exists, its plan is upgraded and the
 *    current invoice is marked paid. If not, the order is stored and applied when that email signs up.
 */

import crypto from "crypto";
import { db } from "./db";
import { PLAN_CONFIGS, type PlanId } from "./plan-limits";
import { getUserByEmail, getUserById } from "./auth-db";
import {
  ensureBillingTables,
  getBillingUser,
  getOrCreate30DayInvoice,
  markInvoicePaidDB,
  resetBillingAnchor,
  unsuspendUser,
  upsertBillingUser,
} from "./billing-db";

// Live Paddle price IDs -> plan + term. Keep in sync with website/components/Pricing.tsx.
const PRICE_MAP: Record<string, { planId: PlanId; termMonths: number }> = {
  pri_01m7nntbj8da1rtj081e2zwr7e: { planId: "starter", termMonths: 1 },
  pri_01m7nntbwyc2hy6fsnrwtz00sj: { planId: "starter", termMonths: 12 },
  pri_01m7nntch1zcw6faepzyaeqajx: { planId: "pro", termMonths: 1 },
  pri_01m7nntcs6890kg16b6n10fve8: { planId: "pro", termMonths: 12 },
  pri_01m7nntdbkmp3c0s4rybkbpen5: { planId: "premium", termMonths: 1 },
  pri_01m7nntdkzyxtyqgrprf94kqx7: { planId: "premium", termMonths: 12 },
};

/** Verifies the `Paddle-Signature` header (`ts=...;h1=...`) against the raw request body. */
export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(";").map((p) => p.split("=") as [string, string]));
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // replay window: 5 minutes
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(h1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function ensurePaddleTables(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS paddle_orders (
      transaction_id  TEXT PRIMARY KEY,
      email           TEXT NOT NULL,
      plan_id         TEXT NOT NULL,
      term_months     INTEGER NOT NULL,
      first_purchase  INTEGER NOT NULL,
      customer_id     TEXT,
      subscription_id TEXT,
      amount          TEXT,
      currency        TEXT,
      applied_user_id TEXT,
      created_at      TEXT NOT NULL
    )
  `);
}

async function fetchCustomerEmail(customerId: string): Promise<string> {
  const res = await fetch(`https://api.paddle.com/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Paddle customer lookup failed (${res.status})`);
  const json = await res.json();
  return String(json.data.email).trim().toLowerCase();
}

async function applyOrderToUser(
  userId: string,
  order: { planId: PlanId; termMonths: number; firstPurchase: boolean },
): Promise<void> {
  await ensureBillingTables();
  // Accounts created without picking a plan have no billing row yet.
  if (!(await getBillingUser(userId))) {
    const u = await getUserById(userId);
    if (!u) throw new Error(`User ${userId} not found`);
    const plan = PLAN_CONFIGS[order.planId];
    await upsertBillingUser({
      id: u.id, email: u.email, ownerName: u.ownerName, salonName: u.salonName, phone: u.phone,
      planId: plan.id, planName: plan.name, planPrice: plan.price, trialStart: u.createdAt, isDemoSignup: false,
    });
  }

  const plan = PLAN_CONFIGS[order.planId];
  const today = new Date().toISOString().slice(0, 10);
  await db.execute({
    sql: `UPDATE billing_users
          SET plan_id = ?, plan_name = ?, plan_price = ?, billing_term_months = ?, is_demo_signup = 0
          WHERE id = ?`,
    args: [plan.id, plan.name, plan.price * order.termMonths, order.termMonths, userId],
  });
  // A new purchase starts the paid term today; a renewal keeps the existing schedule.
  if (order.firstPurchase) await resetBillingAnchor(userId, today);
  await unsuspendUser(userId);

  const user = await getBillingUser(userId);
  const current = user ? await getOrCreate30DayInvoice(user) : null;
  if (current) await markInvoicePaidDB(current.invoice.id);
}

/** Handles one `transaction.completed` event. Safe to call twice for the same transaction (Paddle retries). */
export async function handlePaddleTransaction(data: {
  id: string;
  customer_id: string;
  origin?: string;
  subscription_id?: string | null;
  currency_code?: string;
  items: { price: { id: string } }[];
  details?: { totals?: { total?: string } };
}): Promise<"applied" | "stored" | "duplicate" | "ignored"> {
  const item = data.items.map((i) => PRICE_MAP[i.price.id]).find(Boolean);
  if (!item) return "ignored"; // not one of our plans

  await ensurePaddleTables();
  const email = await fetchCustomerEmail(data.customer_id);
  const firstPurchase = data.origin !== "subscription_recurring";

  const ins = await db.execute({
    sql: `INSERT OR IGNORE INTO paddle_orders
            (transaction_id, email, plan_id, term_months, first_purchase, customer_id, subscription_id, amount, currency, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [data.id, email, item.planId, item.termMonths, firstPurchase ? 1 : 0, data.customer_id,
      data.subscription_id ?? null, data.details?.totals?.total ?? null, data.currency_code ?? null, new Date().toISOString()],
  });
  if (ins.rowsAffected === 0) return "duplicate";

  const user = await getUserByEmail(email);
  if (!user) return "stored"; // applied later by applyPendingPaddleOrders() when they sign up
  await applyOrderToUser(user.id, { ...item, firstPurchase });
  await db.execute({ sql: "UPDATE paddle_orders SET applied_user_id = ? WHERE transaction_id = ?", args: [user.id, data.id] });
  return "applied";
}

/** Called at sign-up: applies the newest unapplied purchase made with this email. */
export async function applyPendingPaddleOrders(userId: string, email: string): Promise<void> {
  await ensurePaddleTables();
  const res = await db.execute({
    sql: "SELECT * FROM paddle_orders WHERE email = ? AND applied_user_id IS NULL ORDER BY created_at DESC",
    args: [email.trim().toLowerCase()],
  });
  if (!res.rows.length) return;
  const o = res.rows[0];
  await applyOrderToUser(userId, { planId: o.plan_id as PlanId, termMonths: Number(o.term_months), firstPurchase: true });
  await db.execute({
    sql: "UPDATE paddle_orders SET applied_user_id = ? WHERE email = ? AND applied_user_id IS NULL",
    args: [userId, email.trim().toLowerCase()],
  });
}
