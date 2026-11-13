/** POST /api/clinic/portal-link { clientId, locationId } → a patient-portal link for that patient (lib/patient-portal.ts). */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { can, resolveActor } from "@/lib/api-auth";
import { PORTAL_LINK_DAYS, ensurePortalTable, newPortalToken } from "@/lib/patient-portal";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { clientId?: string; locationId?: string } | null;
  const actor = await resolveActor(req, typeof body?.locationId === "string" && body.locationId ? body.locationId : "main");
  if (!actor) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!can(actor, "medical")) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  if (!body?.clientId || body.clientId.length > 200) return Response.json({ ok: false, error: "Missing patient." }, { status: 400 });

  try {
    await ensurePortalTable();
    // One live link per patient: a new one retires the old.
    await db.execute({ sql: "DELETE FROM portal_links WHERE user_id = ? AND location_id = ? AND client_id = ?", args: [actor.userId, actor.locationId, body.clientId] });
    const token = newPortalToken();
    const now = Date.now();
    await db.execute({
      sql: "INSERT INTO portal_links (token, user_id, location_id, client_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [token, actor.userId, actor.locationId, body.clientId, new Date(now).toISOString(), new Date(now + PORTAL_LINK_DAYS * 86_400_000).toISOString()],
    });
    return Response.json({ ok: true, token });
  } catch (err) {
    console.error("[clinic/portal-link]", err);
    return Response.json({ ok: false, error: "Could not create the link." }, { status: 500 });
  }
}
