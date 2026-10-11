/**
 * /dashboard/salonflow — the Salonflow live screen (lib/salonflow.html, a standalone page).
 *
 * Salon admins only (owner, or a manager for their branch): anyone else is
 * sent back to the dashboard, demo mode included. /api/salonflow checks the
 * same thing. The page's two inline scripts get this request's CSP nonce so
 * the policy lets them run.
 * Add ?demo to watch the simulation instead of live data.
 */

import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { isSalonAdmin, resolveActor } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req);
  if (!actor || !isSalonAdmin(actor)) return NextResponse.redirect(new URL(actor ? "/dashboard" : "/sign-in", req.url));
  const nonce = req.headers.get("x-nonce") ?? "";
  const html = await readFile(path.join(process.cwd(), "lib/salonflow.html"), "utf8");
  return new Response(html.replaceAll("<script", `<script nonce="${nonce}"`), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
