/**
 * POST /api/billing/update-plan
 * Admin-only: updates a target user's plan in the database (e.g. when
 * approving a payment request from the admin dashboard).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { addDays, ensureBillingTables, getBillingUser, getCurrentCycleInvoice, invoiceDueDays, updateInvoiceAmount } from "@/lib/billing-db";
import { isLifetimeTerm } from "@/lib/billing-constants";
import { PLAN_CONFIGS } from "@/lib/plan-limits";
import { requireAdmin } from "@/lib/api-auth";

function getPlanPrice(planId: string): number {
  if (planId === "basic") return PLAN_CONFIGS.pro.price;
  return PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS]?.price ?? 0;
}

function getPlanName(planId: string): string {
  if (planId === "basic") return PLAN_CONFIGS.pro.name;
  return PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS]?.name ?? planId;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  let body: {
    userId: string;
    planId: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { userId, planId } = body;
  if (!userId || !planId) {
    return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const planPrice = getPlanPrice(planId);
  const planName  = getPlanName(planId);
  if (!PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS] && planId !== "basic") {
    return Response.json({ ok: false, error: `Unknown plan: ${planId}` }, { status: 400 });
  }

  try {
    await ensureBillingTables();
    const currentUser = await getBillingUser(userId);
    const billingTermMonths = currentUser?.billingTermMonths ?? 1;
    // A lifetime deal's price is whatever the admin set — a plan change keeps it.
    const termPrice = currentUser && isLifetimeTerm(billingTermMonths) ? currentUser.planPrice : planPrice * billingTermMonths;

    // Update the plan in the database
    await db.execute({
      sql: `UPDATE billing_users 
            SET plan_id = ?, plan_name = ?, plan_price = ? 
            WHERE id = ?`,
      args: [planId, planName, termPrice, userId],
    });

    const currentInvoice = await getCurrentCycleInvoice(userId);
    if (currentInvoice && currentInvoice.status !== "paid") {
      await updateInvoiceAmount(currentInvoice.id, termPrice, addDays(currentInvoice.periodStart, invoiceDueDays(billingTermMonths)));
    }

    console.log(`[billing/update-plan] Updated user ${userId} to ${planName} plan (${billingTermMonths} months)`);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[billing/update-plan] DB error:", err);
    return Response.json({ ok: false, error: "Failed to update plan." }, { status: 500 });
  }
}
