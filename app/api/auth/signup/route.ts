/**
 * POST /api/auth/signup
 * Create a new user account
 */

import { NextRequest } from "next/server";
import { createUser } from "@/lib/auth-db";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/password-policy";
import { ensureBillingTables, upsertBillingUser } from "@/lib/billing-db";
import { applyPendingPaddleOrders } from "@/lib/paddle";
import { PLAN_CONFIGS } from "@/lib/plan-limits";
import { sendWelcomeEmail } from "@/lib/welcome-email";

// Billing registration happens here, server-side, for the account this request
// just created. It used to be a separate public endpoint taking any userId,
// which let anyone overwrite an existing salon's plan and price.
function planFor(requested: string | undefined) {
  // "demo" is the 7-day trial — priced as Starter, flagged so billing can tell
  // it apart from a direct Starter signup. "basic" is a legacy alias for Pro.
  const isDemoSignup = requested === "demo";
  const id = requested === "demo" ? "starter" : requested === "basic" ? "pro" : requested;
  const config = id ? PLAN_CONFIGS[id as keyof typeof PLAN_CONFIGS] : undefined;
  return config && id ? { id, name: config.name, price: config.price, isDemoSignup } : null;
}

// Admin accounts are never created here: only an existing admin can create one
// (POST /api/admin/users). Any adminCode sent to this public route is ignored.

export async function POST(req: NextRequest) {
  const limit = await rateLimit("signup", clientIp(req), { maxAttempts: 8, windowMs: 15 * 60 * 1000, blockMs: 30 * 60 * 1000 });
  if (limit.blocked) {
    return Response.json(
      { ok: false, error: "Too many signup attempts. Please try again later.", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 0) } },
    );
  }

  let body: {
    email: string;
    password: string;
    ownerName: string;
    salonName: string;
    phone: string;
    planId?: string;
    businessType?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { email, password, ownerName, salonName, phone } = body;

  if (!email || !password || !ownerName) {
    return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return Response.json({ ok: false, error: passwordError }, { status: 400 });
  }

  const plan = planFor(body.planId);
  if (!plan) {
    return Response.json({ ok: false, error: "Please choose a valid plan." }, { status: 400 });
  }

  try {
    const user = await createUser({
      email,
      password,
      ownerName,
      salonName: salonName || ownerName,
      phone: phone || "",
      role: "owner",
      emailVerified: true,
      approvalStatus: "pending",
    });

    // Clinic mode lives in the salon's settings (lib/clinic.ts), so a clinic
    // account starts with a settings row saying so. The browser merges it with
    // the defaults on first load; a salon needs nothing.
    if (body.businessType === "clinic") {
      try {
        await db.execute(`CREATE TABLE IF NOT EXISTS salon_data (entity TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`);
        await db.execute({
          sql: "INSERT OR IGNORE INTO salon_data (entity, data, updated_at) VALUES (?, ?, ?)",
          args: [`${user.id}_settings`, JSON.stringify({ salon: { name: user.salonName, businessType: "clinic" } }), new Date().toISOString()],
        });
      } catch (err) {
        console.error("[auth/signup] clinic settings failed:", err);
      }
    }

    if (plan) {
      // Don't fail the signup over this — the account exists either way, and
      // an admin can set the plan when approving it.
      try {
        await ensureBillingTables();
        await upsertBillingUser({
          id: user.id,
          email: user.email,
          ownerName: user.ownerName,
          salonName: user.salonName,
          phone: user.phone,
          planId: plan.id,
          planName: plan.name,
          planPrice: plan.price,
          trialStart: user.createdAt,
          isDemoSignup: plan.isDemoSignup,
        });
      } catch (err) {
        console.error("[auth/signup] billing registration failed:", err);
      }
    }

    // Paid on the website before creating an account? Apply that purchase now.
    try {
      await applyPendingPaddleOrders(user.id, user.email);
    } catch (err) {
      console.error("[auth/signup] pending Paddle order failed:", err);
    }

    if (user.role === "owner") {
      await sendWelcomeEmail(user, { pending: user.approvalStatus !== "approved" });
    }

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        ownerName: user.ownerName,
        salonName: user.salonName,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        approvalStatus: user.approvalStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("[auth/signup] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to create account.";

    // User-facing errors (email taken, etc.) → 400; server/DB errors → 500
    const isUserError = message.includes("already exists") || message.includes("Invalid admin");
    return Response.json({ ok: false, error: isUserError ? message : "Failed to create account. Please try again." }, { status: isUserError ? 400 : 500 });
  }
}
