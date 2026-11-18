import "server-only";
import { createHash } from "node:crypto";
import { cloudflareEnv } from "@/lib/cloudflare";
import { ACCOUNT_LIMITS } from "@/lib/limits";

const keyPattern = /^cheetahinvite\/[a-zA-Z0-9_-]{1,80}\/[a-zA-Z0-9_-]{1,80}\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function imageUrl(key: string) {
  if (!keyPattern.test(key)) throw new Error("Invalid image key");
  return new URL(`/api/media/${key}`, process.env.APP_URL || "http://localhost:3000").href;
}

export function isOwnImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.origin === new URL(process.env.APP_URL || "http://localhost:3000").origin && url.pathname.startsWith("/api/media/");
  } catch { return false; }
}

export function ownedImageKey(value: string, ownerId: string, eventId: string) {
  if (!isOwnImageUrl(value)) return null;
  const url = new URL(value);
  const key = url.pathname.slice("/api/media/".length);
  return !url.username && !url.password && !url.search && !url.hash && keyPattern.test(key)
    && key.startsWith(`cheetahinvite/${ownerId}/${eventId}/`) ? key : null;
}

export function legacyImageKey(value: string, ownerId: string, eventId: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.username || url.password) return null;
    const match = url.pathname.match(/\/image\/upload\/(?:.*\/)?v\d+\/(cheetahinvite\/.*)\.(?:jpe?g|png|webp|avif)$/i);
    const key = match?.[1];
    return key && keyPattern.test(key) && key.startsWith(`cheetahinvite/${ownerId}/${eventId}/`) ? key : null;
  } catch { return null; }
}

export class InvalidImageError extends Error {}

export async function validateImage(bytes: Uint8Array) {
  const { IMAGES } = await cloudflareEnv();
  if (!IMAGES) throw new Error("Images binding is not configured");
  // Decode and recode actual bytes. Neither browser MIME nor extension is trusted.
  const stream = () => new Blob([new Uint8Array(bytes)]).stream();
  const info = await IMAGES.info(stream());
  if (!("width" in info) || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(info.format)
    || info.width <= 0 || info.height <= 0 || info.width * info.height > 40_000_000) throw new InvalidImageError("Invalid image");
  const output = await IMAGES.input(stream()).transform({ width: 2560, height: 2560, fit: "scale-down" }).output({ format: "image/webp", quality: 85 });
  const result = new Uint8Array(await output.response().arrayBuffer());
  if (!result.length || result.length > ACCOUNT_LIMITS.imageSizeBytes) throw new InvalidImageError("Invalid image size");
  return result;
}

export async function putImage(key: string, bytes: Uint8Array) {
  if (!keyPattern.test(key)) throw new Error("Invalid image key");
  const { INVITATION_IMAGES } = await cloudflareEnv();
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const result = await INVITATION_IMAGES.put(key, bytes, {
    onlyIf: { etagDoesNotMatch: "*" },
    httpMetadata: { contentType: "image/webp" }, customMetadata: { sha256 },
  });
  // A retried request may reuse the first immutable object, never overwrite it.
  if (!result) {
    const existing = await INVITATION_IMAGES.head(key);
    if (existing?.customMetadata?.sha256 !== sha256) throw new InvalidImageError("Upload already contains another image");
  }
}

export async function deleteImage(key: string) {
  if (!keyPattern.test(key)) throw new Error("Refusing to delete a legacy image");
  await (await cloudflareEnv()).INVITATION_IMAGES.delete(key);
}
