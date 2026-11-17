/**
 * POST /api/webhooks/paddle
 * Receives Paddle notifications. Only `transaction.completed` matters: it upgrades the salon account
 * that matches the customer's checkout email (see lib/paddle.ts). Signature-verified; no session.
 */

import { NextRequest } from "next/server";
import { handlePaddleTransaction, verifyPaddleSignature } from "@/lib/paddle";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const raw = await req.text(); // signature is over the exact raw body
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks/paddle] PADDLE_WEBHOOK_SECRET is not set");
    return Response.json({ ok: false }, { status: 500 });
  }
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"), secret)) {
    return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: { event_type?: string; data?: Parameters<typeof handlePaddleTransaction>[0] };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event_type !== "transaction.completed" || !event.data) {
    return Response.json({ ok: true, ignored: event.event_type });
  }

  try {
    const result = await handlePaddleTransaction(event.data);
    console.log(`[webhooks/paddle] ${event.data.id}: ${result}`);
    return Response.json({ ok: true, result });
  } catch (err) {
    // 500 makes Paddle retry, so a temporary DB problem doesn't lose a payment.
    console.error("[webhooks/paddle] failed:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
