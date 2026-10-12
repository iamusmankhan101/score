/**
 * The Salon Central logo for the header of our emails, attached to the email itself
 * and shown with cid:. A linked image (<img src="https://…">) shows as a broken
 * icon in mail apps that block remote images until the reader allows them —
 * Apple Mail, Outlook and Gmail's "ask before displaying" — which is most of them.
 *
 * Read from /public at send time (next.config.ts traces it into /api functions).
 * If the file is missing the link is used instead, so an email is never held up.
 */
import { readFile } from "fs/promises";
import path from "path";

const CONTENT_ID = "salon-central-logo";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://app.saloncentral.xyz").replace(/\/$/, "");

let logo: Promise<Buffer | null> | null = null;

/** `<img>` for the email header plus the attachment it points at (empty when the file can't be read). */
export async function brandLogo(style = "display:block;border:0;color:#7C3AED;font-size:18px;font-weight:900") {
  logo ??= readFile(path.join(process.cwd(), "public", "report-logo.png")).catch(() => null);
  const content = await logo;
  const src = content ? `cid:${CONTENT_ID}` : `${APP_URL}/report-logo.png`;
  return {
    img: `<img src="${src}" alt="Salon Central" width="74" height="36" style="${style}">`,
    attachments: content ? [{ filename: "salon-central.png", content, contentId: CONTENT_ID }] : [],
  };
}
