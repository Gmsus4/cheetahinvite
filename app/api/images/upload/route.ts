import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { acceptedImageTypes, imageUrl, InvalidImageError, ownedImageKey, putImage, validateImage } from "@/lib/r2";
import { finishImage, ImageStorageError, reserveImage, scheduleImageCleanup } from "@/lib/image-storage";
import { assertImageOrigin, readImageBody } from "@/lib/image-request";
import { cloudflareEnv } from "@/lib/cloudflare";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const validEventId = (id: unknown): id is string => typeof id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
function failure(error: unknown) {
  if (error instanceof ImageStorageError) return json({ error: error.message }, error.status);
  if (error instanceof InvalidImageError) return json({ error: "Usa una imagen JPG, PNG, WebP o AVIF válida de hasta 5 MB." }, 400);
  console.error("R2 image upload could not complete");
  return json({ error: "No pudimos subir la imagen. Intenta de nuevo más tarde." }, 503);
}

export async function POST(request: Request) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return json({ error: "Inicia sesión para subir imágenes." }, 401);
  try {
    assertImageOrigin(request);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ImageStorageError("Formato no válido.", 415);
    let payload;
    try { payload = JSON.parse(new TextDecoder().decode(await readImageBody(request, 4096))); }
    catch (error) { if (error instanceof ImageStorageError) throw error; throw new ImageStorageError("Revisa los datos de la imagen.", 400); }
    if (!payload || !validEventId(payload.eventId) || !Number.isInteger(payload.size) || payload.size <= 0) throw new ImageStorageError("Selecciona una imagen válida.", 400);
    if (!acceptedImageTypes.has(payload.contentType)) throw new ImageStorageError("Formato no válido.", 400);
    if (payload.size > ACCOUNT_LIMITS.imageSizeBytes) throw new ImageStorageError("Cada imagen debe pesar 5 MB o menos.", 413);
    const env = await cloudflareEnv();
    if (!env.INVITATION_IMAGES || !env.IMAGES) throw new Error("Image bindings are not configured");
    const reservation = await reserveImage(ownerId, payload.eventId);
    return json({ publicId: reservation.publicId });
  } catch (error) { return failure(error); }
}

export async function PUT(request: Request) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return json({ error: "Inicia sesión para subir imágenes." }, 401);
  try {
    assertImageOrigin(request);
    const query = new URL(request.url).searchParams;
    const eventId = query.get("eventId"), publicId = query.get("publicId");
    if (!validEventId(eventId) || !publicId) throw new ImageStorageError("Carga no válida.", 400);
    let secureUrl: string;
    try { secureUrl = imageUrl(publicId); }
    catch { throw new ImageStorageError("Carga no válida.", 400); }
    if (ownedImageKey(secureUrl, ownerId, eventId) !== publicId) throw new ImageStorageError("Carga no válida.", 400);
    const asset = await prisma.cloudinaryAsset.findFirst({ where: { publicId, ownerId, eventId, provider: "R2" } });
    if (!asset) throw new ImageStorageError("No encontramos esta carga.", 404);
    if (asset.state !== "READY" && (asset.state !== "UPLOADING" || !asset.expiresAt || asset.expiresAt <= new Date())) throw new ImageStorageError("La carga venció.", 409);
    if (asset.state === "READY" && asset.url === secureUrl) {
      await finishImage(ownerId, eventId, publicId, secureUrl, asset.bytes);
      return json({ secureUrl });
    }
    if (!acceptedImageTypes.has(request.headers.get("content-type") || "")) throw new ImageStorageError("Formato no válido.", 415);
    const input = await readImageBody(request, ACCOUNT_LIMITS.imageSizeBytes);
    const bytes = await validateImage(input);
    // Serialize R2 writes with saves/deletions: a late upload cannot recreate a
    // cleaned object. Failed commits leave the reservation charged for cleanup.
    await finishImage(ownerId, eventId, publicId, secureUrl, bytes.length, () => putImage(publicId, bytes));
    scheduleImageCleanup(ownerId);
    return json({ secureUrl });
  } catch (error) { return failure(error); }
}
