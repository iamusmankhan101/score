/**
 * POST /api/billing/delete-account
 * Admin-only: permanently deletes a salon's entire account and all its
 * data. Irreversible. Body: { userId, confirmSalonName }. The caller must
 * echo back the exact salon name as a confirmation guard against
 * fat-fingered deletes from the admin panel.
 */

import { NextRequest } from "next/server";
import { ensureBillingTables, getBillingUser } from "@/lib/billing-db";
import { deleteSalonAccount } from "@/lib/account-deletion";
import { requireAdmin } from "@/lib/api-auth";
import { getUserById } from "@/lib/auth-db";

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  let body: { userId: string; confirmSalonName: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { userId, confirmSalonName } = body;
  if (!userId || !confirmSalonName) {
    return Response.json({ ok: false, error: "Missing userId or confirmSalonName." }, { status: 400 });
  }

  try {
    await ensureBillingTables();

    // Owners still pending approval may have no billing row yet — fall back to their login.
    const login = await getUserById(userId);
    const user = (await getBillingUser(userId)) ?? (login?.role === "owner" ? login : null);
    if (!user) {
      return Response.json({ ok: false, error: "Salon account not found." }, { status: 404 });
    }

    if (confirmSalonName.trim() !== user.salonName) {
      return Response.json({ ok: false, error: "Salon name confirmation did not match." }, { status: 400 });
    }

    const result = await deleteSalonAccount(userId);

    console.log(`[billing/delete-account] Deleted salon ${userId} (${user.email}, "${user.salonName}") + ${result.deletedStaffIds.length} staff logins`);
    return Response.json({ ok: true, deletedStaffCount: result.deletedStaffIds.length });
  } catch (err) {
    console.error("[billing/delete-account] DB error:", err);
    return Response.json({ ok: false, error: "Failed to delete account." }, { status: 500 });
  }
}
