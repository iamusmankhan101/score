/**
 * POST /api/auth/forgot-password
 *
 * Starts the self-service reset. The response is deliberately identical whether
 * or not the address belongs to an account, so this can't be used to discover
 * which emails are registered. Requests are capped per IP and per address so it
 * also can't be used to flood someone's inbox.
 */

import { NextRequest } from "next/server";
import { getUserByEmail } from "@/lib/auth-db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logSigninEvent } from "@/lib/signin-log";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/password-reset";

const GENERIC_MESSAGE = "If an account exists for that email, a reset link is on its way.";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  const ipLimit = await rateLimit("forgot-password", ip, {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  });
  if (ipLimit.blocked) {
    return Response.json(
      { ok: false, error: "Too many reset requests. Please try again later.", retryAfter: ipLimit.retryAfter },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter ?? 0) } },
    );
  }

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const emailLimit = await rateLimit("forgot-password-email", email, {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  });
  if (emailLimit.blocked) {
    return Response.json(
      { ok: false, error: "Too many reset emails requested for this address. Try again later.", retryAfter: emailLimit.retryAfter },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter ?? 0) } },
    );
  }

  try {
    const user = await getUserByEmail(email);
    if (user) {
      const { token } = await createPasswordResetToken(user.id, ip);
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin).replace(/\/$/, "");
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      const delivered = await sendPasswordResetEmail(user, resetUrl);
      await logSigninEvent(req, "server", delivered ? "password_reset_sent" : "password_reset_send_failed", user.email);
    } else {
      await logSigninEvent(req, "server", "password_reset_unknown", email);
    }

    return Response.json(
      { ok: true, message: GENERIC_MESSAGE },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    // Never say whether the account exists — only that the send failed.
    console.error("[auth/forgot-password] Error:", err);
    return Response.json(
      { ok: false, error: "Couldn't send the email right now. Please try again in a moment." },
      { status: 500 },
    );
  }
}
