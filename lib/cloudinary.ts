/**
 * Cloudinary credentials and request signing, shared by the image upload route and
 * the private clinic-photo route.
 */
import { createHash } from "crypto";

export const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
export const API_KEY    = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET        = process.env.CLOUDINARY_API_SECRET ?? "";
export const cloudinaryConfigured = () => !!(CLOUD_NAME && API_KEY && API_SECRET);

/**
 * Cloudinary signs the alphabetically-sorted params that are actually sent,
 * excluding `file`, `api_key` and `resource_type`, with the secret appended.
 */
export function sign(params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + API_SECRET).digest("hex");
}

/**
 * Short-lived link to a private ("authenticated") image's original file, for the server
 * to fetch and pass on. It is never sent to a browser.
 */
export function privateDownloadUrl(publicId: string, format: string): string {
  const params = { public_id: publicId, format, type: "authenticated", timestamp: String(Math.floor(Date.now() / 1000)) };
  const qs = new URLSearchParams({ ...params, api_key: API_KEY, signature: sign(params) });
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/download?${qs}`;
}
