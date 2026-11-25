/**
 * GET /api/billing/status
 * Returns the signed-in salon's suspension status from Turso.
 * Called by the dashboard layout on every load. The salon comes from the
 * session; a ?userId= is only honored for platform admins.
 */

import { NextRequest } from "next/server";
import { ensureBillingTables, getBillingUser } from "@/lib/billing-db";
import { resolveActor } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req);
  if (!actor) {
    return Response.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }
  const requested = req.nextUrl.searchParams.get("userId");
  const userId = actor.role === "admin" && requested ? requested : actor.userId;

  try {
    await ensureBillingTables();
    const user = await getBillingUser(userId);

    if (!user) {
      return Response.json({ ok: true, suspended: false });
    }

    return Response.json({
      ok: true,
      suspended: user.suspended,
      reason: user.suspensionReason ?? null,
      paymentNotice: user.paymentNotice,
    });
  } catch (err) {
    console.error("[billing/status] error:", err);
    return Response.json({ ok: true, suspended: false });
  }
}