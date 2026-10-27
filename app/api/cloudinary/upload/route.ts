import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { cloudinaryConfig, ownedCloudinaryPublicId, signedCloudinaryForm } from "@/lib/cloudinary";
import { failCloudinaryImage, finishCloudinaryImage, ImageStorageError, reserveCloudinaryImage, scheduleCloudinaryCleanup } from "@/lib/cloudinary-storage";

export const maxDuration = 60;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

// Content-Length may be absent or forged. Bound the stream before parsing multipart.
async function readUploadForm(request: Request) {
  const maximum = ACCOUNT_LIMITS.imageSizeBytes + 128 * 1024;
  if (Number(request.headers.get("content-length")) > maximum) throw new ImageStorageError("Cada imagen debe pesar 5 MB o menos.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ImageStorageError("Selecciona una imagen válida.", 400);
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new ImageStorageError("Cada imagen debe pesar 5 MB o menos.", 413);
      }
      chunks.push(new Uint8Array(value));
    }
  } finally { reader.releaseLock(); }
  try {
    return await new Response(new Blob(chunks), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
  } catch { throw new ImageStorageError("Selecciona una imagen válida.", 400); }
}

export async function POST(request: Request) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) return NextResponse.json({ error: "Inicia sesión para subir imágenes." }, { status: 401 });
  let reservation: Awaited<ReturnType<typeof reserveCloudinaryImage>> | undefined;
  let uncertain = true;
  try {
    const body = await readUploadForm(request);
    const eventId = body.get("eventId");
    const file = body.get("file");
    if (typeof eventId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(eventId) || !(file instanceof File) || !file.size) {
      throw new ImageStorageError("Selecciona una imagen válida.", 400);
    }
    if (!acceptedTypes.has(file.type)) throw new ImageStorageError("Usa una imagen JPG, PNG, WebP o AVIF.", 400);
    if (file.size > ACCOUNT_LIMITS.imageSizeBytes) throw new ImageStorageError("Cada imagen debe pesar 5 MB o menos.", 413);
    let config: ReturnType<typeof cloudinaryConfig>;
    try { config = cloudinaryConfig(); }
    catch { throw new ImageStorageError("La carga de imágenes todavía no está configurada.", 503); }
    reservation = await reserveCloudinaryImage(ownerId, eventId);
    const form = signedCloudinaryForm({
      public_id: reservation.publicId, timestamp: String(Math.floor(Date.now() / 1000)),
      upload_preset: config.uploadPreset, overwrite: "false", allowed_formats: "jpg,png,webp,avif",
    });
    form.set("file", file, file.name);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
      method: "POST", body: form, signal: AbortSignal.timeout(40_000),
    });
    const uploaded = await response.json().catch(() => null);
    if (!response.ok) {
      uncertain = false;
      throw new ImageStorageError("Cloudinary no pudo subir esta imagen. Intenta de nuevo.", 502);
    }
    if (uploaded?.public_id !== reservation.publicId || uploaded?.resource_type !== "image" || uploaded?.type !== "upload"
      || !Number.isInteger(uploaded?.bytes) || uploaded.bytes <= 0 || uploaded.bytes > ACCOUNT_LIMITS.imageSizeBytes
      || typeof uploaded?.secure_url !== "string" || ownedCloudinaryPublicId(uploaded.secure_url, ownerId, eventId) !== reservation.publicId) {
      throw new ImageStorageError("No pudimos verificar la imagen subida. Intenta de nuevo.", 502);
    }
    const secureUrl = uploaded.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
    await finishCloudinaryImage(ownerId, eventId, reservation.publicId, secureUrl, uploaded.bytes);
    scheduleCloudinaryCleanup(ownerId);
    return NextResponse.json({ secureUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (reservation) {
      try { await failCloudinaryImage(ownerId, reservation.publicId, uncertain); }
      catch { console.error("Image upload recovery deferred to scheduled cleanup"); }
      scheduleCloudinaryCleanup(ownerId);
    }
    if (error instanceof ImageStorageError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Image upload could not complete");
    return NextResponse.json({ error: "No pudimos completar la carga. Intenta de nuevo más tarde." }, { status: 502 });
  }
}
