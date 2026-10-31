import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { ACCOUNT_LIMITS } from "@/lib/limits";

export const CLOUDINARY_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"] as const;
// The signature is valid for one hour; allow ten more minutes for in-flight uploads.
export const CLOUDINARY_UPLOAD_LEASE_MS = 70 * 60 * 1000;
// Signed along with the upload fields: the browser cannot remove or change it.
// This validates actual image bytes in Cloudinary, independently of client metadata.
export const CLOUDINARY_IMAGE_VALIDATION = `if(resource_info.bytes>${ACCOUNT_LIMITS.imageSizeBytes}||!resource_info.width||!resource_info.height){throw new Error("Unsupported image");}`;

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) throw new Error("Cloudinary is not configured");
  return { cloudName, apiKey, apiSecret, uploadPreset };
}

function cloudinarySignature(parameters: Record<string, string>) {
  const { apiSecret } = cloudinaryConfig();
  const toSign = Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

export function signedCloudinaryFields(parameters: Record<string, string>) {
  return { ...parameters, signature: cloudinarySignature(parameters), api_key: cloudinaryConfig().apiKey };
}

export function signedCloudinaryForm(parameters: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(signedCloudinaryFields(parameters))) form.set(key, value);
  return form;
}

export function validCloudinaryUploadResponse(publicId: string, version: number, signature: string) {
  if (!/^[a-f0-9]{40}$/.test(signature)) return false;
  const expected = cloudinarySignature({ public_id: publicId, version: String(version) });
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function cloudinaryAdminGet(path: string) {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  return fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` },
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
}

let verifiedPreset: { key: string; until: number } | undefined;

export async function verifyCloudinaryUploadPreset() {
  const { cloudName, apiKey, apiSecret, uploadPreset } = cloudinaryConfig();
  const key = JSON.stringify([cloudName, apiKey, apiSecret, uploadPreset]);
  if (verifiedPreset?.key === key && verifiedPreset.until > Date.now()) return;
  const response = await cloudinaryAdminGet(`upload_presets/${encodeURIComponent(uploadPreset)}`);
  const preset = await response.json();
  const settings = preset.settings ?? preset.options ?? preset;
  const formats = Array.isArray(settings.allowed_formats) ? settings.allowed_formats : String(settings.allowed_formats ?? "").split(",");
  if (!response.ok || preset.unsigned !== false
    || !formats.length || formats.some((format: string) => !CLOUDINARY_FORMATS.includes(format.trim() as typeof CLOUDINARY_FORMATS[number]))) {
    throw new Error("Cloudinary requires a signed preset restricted to supported images");
  }
  verifiedPreset = { key, until: Date.now() + 5 * 60 * 1000 };
}

export async function getCloudinaryImage(publicId: string) {
  const response = await cloudinaryAdminGet(`resources/image/upload/${encodeURIComponent(publicId)}`);
  if (!response.ok) throw new Error("Cloudinary image verification is unavailable");
  return response.json();
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

async function destroyCloudinaryAsset(publicId: string, resourceType: "image" | "raw" | "video") {
  const { cloudName } = cloudinaryConfig();
  const form = signedCloudinaryForm({ public_id: publicId, invalidate: "true", timestamp: String(Math.floor(Date.now() / 1000)) });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/destroy`, {
    method: "POST", body: form, signal: AbortSignal.timeout(8_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !["ok", "not found"].includes(body?.result)) throw new Error("Cloudinary deletion failed");
}

export function destroyCloudinaryImage(publicId: string) {
  return destroyCloudinaryAsset(publicId, "image");
}

// Cloudinary does not bind resource_type into its upload signature. A modified
// client could use the same reserved ID at a raw/video endpoint. Clean those
// variants once the signature expires, without touching the actual image.
export async function destroyCloudinaryUploadVariants(publicId: string) {
  await Promise.all([destroyCloudinaryAsset(publicId, "raw"), destroyCloudinaryAsset(publicId, "video")]);
}
