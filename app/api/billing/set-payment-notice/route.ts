/**
 * POST /api/billing/set-payment-notice
 * Admin-only: turns the "payment pending" banner on (with an optional amount
 * and due date) or off for one salon. The salon's dashboard reads it from
 * /api/billing/status.
 */

import { NextRequest } from "next/server";
import { ensureBillingTables, getBillingUser, setPaymentNotice } from "@/lib/billing-db";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  let body: { userId?: string; show?: boolean; amount?: number; dueDate?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
  if (!body.userId) return Response.json({ ok: false, error: "Missing userId." }, { status: 400 });
  const dueDate = (body.dueDate ?? "").trim();
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return Response.json({ ok: false, error: "Due date must be YYYY-MM-DD." }, { status: 400 });
  }
  const amount = Math.max(0, Math.round(Number(body.amount) || 0));

  try {
    await ensureBillingTables();
    if (!(await getBillingUser(body.userId))) {
      return Response.json({ ok: false, error: "Salon account not found." }, { status: 404 });
    }
    await setPaymentNotice(body.userId, body.show ? { amount, dueDate } : null);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[billing/set-payment-notice] DB error:", err);
    return Response.json({ ok: false, error: "Failed to save." }, { status: 500 });
  }
}
