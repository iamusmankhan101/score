/**
 * lib/password-reset.ts
 *
 * Self-service "forgot password" flow. A request creates a single-use token
 * that is emailed to the account's address; only its SHA-256 is stored, so a
 * database read can't hand an attacker a working link. Tokens expire after 30
 * minutes, are claimed atomically, and resetting the password signs every
 * device out — if the password leaked, sessions opened with it must not live on.
 */

import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { brandLogo } from "@/lib/email-logo";
import { db } from "@/lib/db";
import { ensureAuthTables, getUserById, hashPassword, revokeAllSessionsForUser } from "@/lib/auth-db";
import { validatePasswordStrength } from "@/lib/password-policy";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const INVALID_TOKEN = "This reset link is invalid or has expired. Request a new one.";

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  tableReady ??= (async () => {
    await ensureAuthTables();
    await db.execute(`CREATE TABLE IF NOT EXISTS password_resets (
      token_hash TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      ip         TEXT
    )`);
    await db.execute("CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id)").catch(() => {});
    await db.execute("CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at)").catch(() => {});
  })().catch((error) => {
    tableReady = null;
    throw error;
  });
  return tableReady;
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Mints a fresh token, discarding any earlier unused links for the account. */
export async function createPasswordResetToken(
  userId: string,
  ip?: string | null,
): Promise<{ token: string; expiresAt: string }> {
  await ensureTable();

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS).toISOString();

  await db.execute({
    sql: "DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?",
    args: [userId, now.toISOString()],
  });
  await db.execute({
    sql: `INSERT INTO password_resets (token_hash, user_id, expires_at, used, created_at, ip)
          VALUES (?, ?, ?, 0, ?, ?)`,
    args: [hashResetToken(token), userId, expiresAt, now.toISOString(), ip ?? null],
  });

  return { token, expiresAt };
}

/**
 * Checks the token, sets the new password, signs the account out everywhere and
 * burns the token. Returns the account's email on success so the caller can log
 * the completion without another lookup.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true; userId: string; email: string } | { ok: false; error: string }> {
  if (typeof token !== "string" || token.length < 20 || token.length > 512) {
    return { ok: false, error: INVALID_TOKEN };
  }
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) return { ok: false, error: passwordError };

  await ensureTable();

  const tokenHash = hashResetToken(token);
  const now = new Date().toISOString();

  const found = await db.execute({
    sql: "SELECT user_id, expires_at, used FROM password_resets WHERE token_hash = ?",
    args: [tokenHash],
  });
  const row = found.rows[0];
  if (!row || Number(row.used) === 1 || String(row.expires_at) < now) {
    return { ok: false, error: INVALID_TOKEN };
  }

  const userId = String(row.user_id);
  const user = await getUserById(userId);
  if (!user) return { ok: false, error: INVALID_TOKEN };

  // Claim it in one statement: two requests racing on the same link can't both win.
  const claim = await db.execute({
    sql: "UPDATE password_resets SET used = 1 WHERE token_hash = ? AND used = 0 AND expires_at > ?",
    args: [tokenHash, now],
  });
  if (claim.rowsAffected !== 1) return { ok: false, error: INVALID_TOKEN };

  await db.execute({
    sql: "UPDATE users SET password = ? WHERE id = ?",
    args: [hashPassword(newPassword), userId],
  });
  await db.execute({ sql: "DELETE FROM password_resets WHERE user_id = ?", args: [userId] });
  await revokeAllSessionsForUser(userId);

  return { ok: true, userId, email: user.email };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

/** Sends the reset link. Returns false only when mail is configured but delivery failed. */
export async function sendPasswordResetEmail(
  user: { email: string; ownerName?: string },
  resetUrl: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[password-reset] RESEND_API_KEY is not set — no reset email was sent.");
      return false;
    }
    // Local development has no mail provider: print the link instead of failing.
    console.warn(`[password-reset] RESEND_API_KEY is not set. Reset link: ${resetUrl}`);
    return true;
  }

  const logo = await brandLogo("display:block;border:0;color:#7C3AED;font-weight:900");
  const name = escapeHtml((user.ownerName || "").trim() || "there");
  const safeUrl = escapeHtml(resetUrl);

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: "Salon Central <noreply@saloncentral.xyz>",
      replyTo: "support@saloncentral.xyz",
      to: [user.email],
      subject: "Reset your Salon Central password",
      attachments: logo.attachments,
      text: `Hi ${name},\n\nWe received a request to reset the password for your Salon Central account.\n\nChoose a new password here:\n${resetUrl}\n\nThis link expires in 30 minutes and can only be used once. If you didn't ask for this, you can ignore this email — your password hasn't changed.`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:24px 0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e8e8f0;overflow:hidden">
    <div style="padding:20px 32px;border-bottom:1px solid #ece9f5">${logo.img}</div>
    <div style="padding:28px 32px">
      <div style="font-size:18px;color:#1a1a2e;font-weight:800;margin-bottom:12px">Reset your password</div>
      <p style="font-size:14px;color:#6b6b8a;line-height:1.7;margin:0 0 22px">
        Hi ${name},<br>We received a request to reset the password for your Salon Central account.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px">
        <tr><td style="border-radius:10px;background:linear-gradient(135deg,#5B21B6,#9333EA)">
          <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px">Choose a new password</a>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#9898b0;line-height:1.6;margin:0 0 14px">
        This link expires in <strong>30 minutes</strong> and can only be used once.
        If you didn't ask for this, ignore this email — your password hasn't changed.
      </p>
      <div style="padding:12px 14px;background:#f8f8fc;border-radius:9px;border:1px solid #ebebf0">
        <div style="font-size:10px;font-weight:700;color:#b0b0c8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">Button not working? Copy this link:</div>
        <div style="font-size:11px;color:#7C3AED;word-break:break-all">${safeUrl}</div>
      </div>
    </div>
  </div></body></html>`,
    });

    if (error) {
      console.error("[password-reset] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[password-reset] Unexpected Resend error:", err);
    return false;
  }
}
