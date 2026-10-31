/**
 * POST /api/auth/reset-password
 *
 * Finishes the self-service reset: checks the emailed token, applies the new
 * password (same strength rule as sign-up) and signs every device out. Tokens
 * are single-use, expire in 30 minutes, and are stored only as a hash.
 */

import { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logSigninEvent } from "@/lib/signin-log";
import { hashResetToken, resetPasswordWithToken } from "@/lib/password-reset";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  const ipLimit = await rateLimit("reset-password", ip, {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  });
  if (ipLimit.blocked) {
    return Response.json(
      { ok: false, error: "Too many attempts. Please try again later.", retryAfter: ipLimit.retryAfter },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter ?? 0) } },
    );
  }

  let body: { token?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) {
    return Response.json({ ok: false, error: "This reset link is invalid. Request a new one." }, { status: 400 });
  }

  // One link shouldn't be usable to try passwords over and over if it was leaked.
  const tokenLimit = await rateLimit("reset-password-token", hashResetToken(token), {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  });
  if (tokenLimit.blocked) {
    return Response.json(
      { ok: false, error: "Too many attempts with this link. Request a new one." },
      { status: 429 },
    );
  }

  try {
    const result = await resetPasswordWithToken(token, password);
    if (!result.ok) {
      await logSigninEvent(req, "server", "password_reset_failed", undefined, result.error);
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    await logSigninEvent(req, "server", "password_reset_completed", result.email);
    return Response.json(
      { ok: true, message: "Password updated. Sign in with your new password." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[auth/reset-password] Error:", err);
    return Response.json(
      { ok: false, error: "Something went wrong. Please try again in a moment." },
      { status: 500 },
    );
  }
}
