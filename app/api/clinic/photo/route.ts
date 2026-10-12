/**
 * GET /api/clinic/photo?id=<Cloudinary public id>&f=<format>
 *
 * Shows a private clinic photo (uploaded by /api/upload/image as "authenticated").
 * Only a signed-in user of the salon that owns it, with the Medical Records page,
 * gets the image; the file is fetched here and passed on, so no reusable link to it
 * ever reaches a browser.
 */

import { NextRequest } from "next/server";
import { can, resolveActor } from "@/lib/api-auth";
import { cloudinaryConfigured, privateDownloadUrl } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const actor = await resolveActor(req);
  if (!actor) return new Response("Unauthorized", { status: 401 });
  if (!can(actor, "medical")) return new Response("Forbidden", { status: 403 });

  const id = req.nextUrl.searchParams.get("id") ?? "";
  const format = req.nextUrl.searchParams.get("f") ?? "jpg";
  // Only this salon's own clinic photos.
  if (!id.startsWith(`salon-central/${actor.userId}/patients/`) || id.includes("..") || !/^[a-z0-9]{2,5}$/i.test(format)) {
    return new Response("Not found", { status: 404 });
  }
  if (!cloudinaryConfigured()) return new Response("Image hosting is not configured", { status: 503 });

  const res = await fetch(privateDownloadUrl(id, format));
  if (!res.ok || !res.body) return new Response("Not found", { status: res.status === 404 ? 404 : 502 });
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      // Kept in this browser only, never in a shared cache.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
