/**
 * /dashboard/salonflow — the Salonflow live screen (lib/salonflow.html, a standalone page).
 *
 * Middleware has already sent signed-out visitors to sign-in, and the page's
 * data request (/api/salonflow) checks the session itself. The page's two
 * inline scripts get this request's CSP nonce so the policy lets them run.
 * Add ?demo to watch the simulation instead of live data.
 */

import { readFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const nonce = req.headers.get("x-nonce") ?? "";
  const html = await readFile(path.join(process.cwd(), "lib/salonflow.html"), "utf8");
  return new Response(html.replaceAll("<script", `<script nonce="${nonce}"`), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
