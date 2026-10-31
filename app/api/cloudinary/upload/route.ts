import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { cloudinaryConfig, CLOUDINARY_FORMATS, CLOUDINARY_IMAGE_VALIDATION, CLOUDINARY_UPLOAD_LEASE_MS, getCloudinaryImage, ownedCloudinaryPublicId, signedCloudinaryFields, validCloudinaryUploadResponse, verifyCloudinaryUploadPreset } from "@/lib/cloudinary";
import { failCloudinaryImage, finishCloudinaryImage, ImageStorageError, reserveCloudinaryImage, scheduleCloudinaryCleanup } from "@/lib/cloudinary-storage";

export const maxDuration = 30;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// These endpoints accept only small metadata, never the image or a data URL.
async function readPayload(request: Request) {
  const origin = request.headers.get("origin");
  const origins = [new URL(request.url).origin];
  if (process.env.APP_URL) origins.push(new URL(process.env.APP_URL).origin);
  if (!origin || !origins.includes(origin)) throw new ImageStorageError("Solicitud no permitida.", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ImageStorageError("Formato no válido.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ImageStorageError("Revisa los datos de la imagen.", 400);
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new ImageStorageError("Solicitud demasiado grande.", 413); }
      chunks.push(new Uint8Array(value));
    }
  } finally { reader.releaseLock(); }
  try {
    const payload = JSON.parse(await new Blob(chunks).text());
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error();
    return payload;
  } catch { throw new ImageStorageError("Revisa los datos de la imagen.", 400); }
}

function validEventId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
}

function failure(error: unknown) {
  if (error instanceof ImageStorageError) return json({ error: error.message }, error.status);
  console.error("Direct image upload could not complete");
  return json({ error: "No pudimos verificar la imagen. Intenta de nuevo más tarde." }, 503);
}

// Reserve storage and sign exactly one public ID in this owner's event namespace.
export async function POST(request: Request) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) return json({ error: "Inicia sesión para subir imágenes." }, 401);
  let reservation: Awaited<ReturnType<typeof reserveCloudinaryImage>> | undefined;
  try {
    const payload = await readPayload(request);
    if (!validEventId(payload.eventId) || !Number.isInteger(payload.size) || payload.size <= 0) throw new ImageStorageError("Selecciona una imagen válida.", 400);
    if (!acceptedTypes.has(payload.contentType)) throw new ImageStorageError("Usa una imagen JPG, PNG, WebP o AVIF.", 400);
    if (payload.size > ACCOUNT_LIMITS.imageSizeBytes) throw new ImageStorageError("Cada imagen debe pesar 5 MB o menos.", 413);
    let config: ReturnType<typeof cloudinaryConfig>;
    try { config = cloudinaryConfig(); }
    catch { throw new ImageStorageError("La carga de imágenes todavía no está configurada.", 503); }
    reservation = await reserveCloudinaryImage(ownerId, payload.eventId, new Date(Date.now() + CLOUDINARY_UPLOAD_LEASE_MS));
    try { await verifyCloudinaryUploadPreset(); }
    catch { throw new ImageStorageError("La carga de imágenes no está disponible. Revisa la configuración de Cloudinary.", 503); }
    const fields = signedCloudinaryFields({
      public_id: reservation.publicId, timestamp: String(Math.floor(Date.now() / 1000)),
      upload_preset: config.uploadPreset, overwrite: "false", allowed_formats: "jpg,png,webp,avif", type: "upload",
      eval: CLOUDINARY_IMAGE_VALIDATION,
    });
    return json({ publicId: reservation.publicId, uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, fields });
  } catch (error) {
    if (reservation) {
      // No signature was returned, so an unsuccessful authorization is safe to clean.
      try {
        await prisma.cloudinaryAsset.updateMany({ where: { publicId: reservation.publicId, ownerId, state: "UPLOADING" },
          data: { state: "DELETE_PENDING", nextAttemptAt: new Date() } });
      } catch { console.error("Image authorization cleanup deferred"); }
      scheduleCloudinaryCleanup(ownerId);
    }
    return failure(error);
  }
}

// Confirm with Cloudinary itself: the browser's URL, size and format are untrusted.
export async function PUT(request: Request) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) return json({ error: "Inicia sesión para confirmar la imagen." }, 401);
  try {
    const payload = await readPayload(request);
    const { eventId, publicId, version, signature } = payload;
    if (!validEventId(eventId) || typeof publicId !== "string" || !publicId.startsWith(`cheetahinvite/${ownerId}/${eventId}/`)
      || !/^[a-f0-9-]{36}$/.test(publicId.split("/").at(-1) ?? "")
      || !Number.isSafeInteger(version) || version <= 0 || typeof signature !== "string") throw new ImageStorageError("Revisa los datos de la imagen.", 400);
    const asset = await prisma.cloudinaryAsset.findFirst({ where: { publicId, ownerId, eventId } });
    const event = await prisma.event.findFirst({ where: { id: eventId, ownerId }, select: { id: true } });
    if (!asset || !event) throw new ImageStorageError("No encontramos esta carga.", 404);
    if (!validCloudinaryUploadResponse(publicId, version, signature)) throw new ImageStorageError("No pudimos verificar la respuesta de Cloudinary.", 400);
    if (asset.state === "READY" && asset.url) return json({ secureUrl: asset.url });
    if (asset.state !== "UPLOADING" || !asset.expiresAt || asset.expiresAt <= new Date()) throw new ImageStorageError("La carga venció. Vuelve a subir la imagen.", 409);
    const uploaded = await getCloudinaryImage(publicId);
    if (uploaded?.public_id !== publicId || uploaded?.version !== version || uploaded?.resource_type !== "image" || uploaded?.type !== "upload"
      || !CLOUDINARY_FORMATS.includes(uploaded?.format) || !Number.isInteger(uploaded?.bytes) || uploaded.bytes <= 0 || uploaded.bytes > ACCOUNT_LIMITS.imageSizeBytes
      || typeof uploaded?.secure_url !== "string" || ownedCloudinaryPublicId(uploaded.secure_url, ownerId, eventId) !== publicId) {
      await failCloudinaryImage(ownerId, publicId, true, uploaded?.public_id === publicId && uploaded?.resource_type === "image" && uploaded?.type === "upload" ? uploaded.bytes : undefined);
      scheduleCloudinaryCleanup(ownerId);
      throw new ImageStorageError("La imagen no cumple los formatos permitidos o el límite de 5 MB.", 400);
    }
    const secureUrl = uploaded.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
    await finishCloudinaryImage(ownerId, eventId, publicId, secureUrl, uploaded.bytes);
    scheduleCloudinaryCleanup(ownerId);
    return json({ secureUrl });
  } catch (error) { return failure(error); }
}
