import "server-only";
import { createHash } from "node:crypto";

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) throw new Error("Cloudinary is not configured");
  return { cloudName, apiKey, apiSecret, uploadPreset };
}

export function signedCloudinaryForm(parameters: Record<string, string>) {
  const { apiKey, apiSecret } = cloudinaryConfig();
  const form = new FormData();
  for (const [key, value] of Object.entries(parameters)) form.set(key, value);
  const toSign = Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  form.set("signature", createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex"));
  form.set("api_key", apiKey);
  return form;
}

export function isOwnCloudinaryUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "res.cloudinary.com" && url.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`);
  } catch { return false; }
}

// Accept only this application's server-generated UUID namespace, never arbitrary IDs.
export function ownedCloudinaryPublicId(value: string, ownerId: string, eventId: string) {
  if (!isOwnCloudinaryUrl(value)) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const prefix = `cheetahinvite/${ownerId}/${eventId}/`;
  const marker = `/image/upload/`;
  const delivery = url.pathname.slice(url.pathname.indexOf(marker) + marker.length);
  const version = delivery.match(/(?:^|\/)v\d+\/(.*)$/);
  if (!version) return null;
  const path = version[1];
  if (!path.startsWith(prefix)) return null;
  const filename = path.slice(prefix.length);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpe?g|png|webp|avif)$/i.test(filename)) return null;
  return prefix + filename.replace(/\.[^.]+$/, "");
}

export async function destroyCloudinaryImage(publicId: string) {
  const { cloudName } = cloudinaryConfig();
  const form = signedCloudinaryForm({ public_id: publicId, invalidate: "true", timestamp: String(Math.floor(Date.now() / 1000)) });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`, {
    method: "POST", body: form, signal: AbortSignal.timeout(8_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !["ok", "not found"].includes(body?.result)) throw new Error("Cloudinary deletion failed");
}
