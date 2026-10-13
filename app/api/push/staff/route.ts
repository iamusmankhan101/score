/**
 * POST /api/push/staff — turn on new-booking alerts on this phone for the signed-in login.
 * Turning them off reuses DELETE /api/subscribe (the endpoint alone is proof enough).
 */

import { NextRequest } from "next/server";
import { can, resolveActor } from "@/lib/api-auth";
import { isValidSubscription, savePushSubscription, staffPushKey } from "@/lib/push";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const actor = await resolveActor(req);
  if (!actor) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  // Alerts carry client names, so only people who can see the bookings get them.
  if (!can(actor, "appointments", "calendar")) {
    return Response.json({ ok: false, error: "Booking alerts need access to Appointments or Calendar." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { subscription?: unknown } | null;
  if (!isValidSubscription(body?.subscription)) {
    return Response.json({ ok: false, error: "Invalid push subscription" }, { status: 400 });
  }

  try {
    await savePushSubscription({
      userId: staffPushKey(actor.userId),
      clientId: actor.role === "owner" || actor.role === "admin" ? "all" : actor.locationId,
      subscription: body.subscription,
      userAgent: req.headers.get("user-agent"),
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[push/staff] failed to save subscription:", err);
    return Response.json({ ok: false, error: "Couldn't turn on booking alerts." }, { status: 500 });
  }
}
