import "server-only";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/prisma";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { destroyCloudinaryImage, isOwnCloudinaryUrl, ownedCloudinaryPublicId } from "@/lib/cloudinary";
import { invitationImageUrls } from "@/lib/invitation-images";

type Transaction = Prisma.TransactionClient;
type Images = { imageUrl?: string | null; sections?: unknown };
const HOUR = 60 * 60 * 1000;
const UPLOAD_LEASE = 10 * 60 * 1000;

export class ImageStorageError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}

// All upload reservations, image saves, deletes and cleanup claims serialize per account.
// This includes separate processes/instances; no browser counters or in-memory limits.
export async function withImageLock<T>(ownerId: string, work: (tx: Transaction) => Promise<T>, allowDeletedAccount = false) {
  return prisma.$transaction(async tx => {
    const owners = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${ownerId} FOR UPDATE`);
    if (!owners.length && !allowDeletedAccount) throw new ImageStorageError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
    return work(tx);
  }, { timeout: 10_000 });
}

// Older saved images are adopted conservatively at the maximum size, without listing
// or deleting any unreferenced historical files in the provider account.
async function adoptSavedImages(tx: Transaction, ownerId: string, eventId: string, event: Images) {
  const images = invitationImageUrls(event).flatMap(url => {
    const publicId = ownedCloudinaryPublicId(url, ownerId, eventId);
    return publicId ? [{ publicId, ownerId, eventId, url, bytes: ACCOUNT_LIMITS.imageSizeBytes, state: "READY" as const }] : [];
  });
  if (images.length) await tx.cloudinaryAsset.createMany({ data: images, skipDuplicates: true });
}

export async function reserveCloudinaryImage(ownerId: string, eventId: string) {
  return withImageLock(ownerId, async tx => {
    const event = await tx.event.findFirst({ where: { id: eventId, ownerId }, select: { imageUrl: true, sections: true } });
    if (!event) throw new ImageStorageError("No encontramos este evento.", 404);
    await adoptSavedImages(tx, ownerId, eventId, event);
    const usage = await tx.cloudinaryAsset.aggregate({ where: { eventId, ownerId }, _count: true, _sum: { bytes: true } });
    if (usage._count >= ACCOUNT_LIMITS.storedImagesPerEvent || (usage._sum.bytes ?? 0) + ACCOUNT_LIMITS.imageSizeBytes > ACCOUNT_LIMITS.imageStorageBytesPerEvent) {
      throw new ImageStorageError("Esta invitación alcanzó su límite de imágenes almacenadas. Quita las que no uses, guarda los cambios e intenta de nuevo.");
    }
    // Deleted events retain cleanup debt. Recreating events must not bypass storage
    // budgets when provider deletion is failing or still in progress.
    const accountUsage = await tx.cloudinaryAsset.aggregate({ where: { ownerId }, _count: true, _sum: { bytes: true } });
    if (accountUsage._count >= ACCOUNT_LIMITS.invitations * ACCOUNT_LIMITS.storedImagesPerEvent
      || (accountUsage._sum.bytes ?? 0) + ACCOUNT_LIMITS.imageSizeBytes > ACCOUNT_LIMITS.invitations * ACCOUNT_LIMITS.imageStorageBytesPerEvent) {
      throw new ImageStorageError("Tu cuenta alcanzó el límite de imágenes almacenadas. Guarda las fotos que quieras conservar y espera a que termine la limpieza antes de subir más.");
    }
    const now = new Date();
    await tx.imageUploadBudget.deleteMany({ where: { ownerId, expiresAt: { lte: now } } });
    for (const [name, duration, maximum] of [["hour", HOUR, ACCOUNT_LIMITS.imageUploadsPerHour], ["day", 24 * HOUR, ACCOUNT_LIMITS.imageUploadsPerDay]] as const) {
      const bucket = Math.floor(now.getTime() / duration);
      const budget = await tx.imageUploadBudget.upsert({
        where: { key: `${ownerId}:${name}:${bucket}` },
        create: { key: `${ownerId}:${name}:${bucket}`, ownerId, expiresAt: new Date((bucket + 1) * duration) },
        update: { count: { increment: 1 } },
      });
      if (budget.count > maximum) throw new ImageStorageError(name === "hour"
        ? `Alcanzaste el límite de ${maximum} cargas por hora. Intenta más tarde.`
        : `Alcanzaste el límite de ${maximum} cargas por día. Intenta mañana.`, 429);
    }
    return tx.cloudinaryAsset.create({ data: {
      publicId: `cheetahinvite/${ownerId}/${eventId}/${randomUUID()}`, ownerId, eventId,
      bytes: ACCOUNT_LIMITS.imageSizeBytes, expiresAt: new Date(now.getTime() + UPLOAD_LEASE),
    } });
  });
}

export async function finishCloudinaryImage(ownerId: string, eventId: string, publicId: string, url: string, bytes: number) {
  const accepted = await withImageLock(ownerId, async tx => {
    const event = await tx.event.findFirst({ where: { id: eventId, ownerId }, select: { id: true } });
    if (!event) {
      await tx.cloudinaryAsset.updateMany({ where: { publicId, ownerId }, data: { state: "DELETE_PENDING", nextAttemptAt: new Date() } });
      return false;
    }
    const changed = await tx.cloudinaryAsset.updateMany({ where: { publicId, ownerId, state: "UPLOADING" }, data: {
      state: "READY", url, bytes, expiresAt: new Date(Date.now() + ACCOUNT_LIMITS.temporaryImageHours * HOUR),
    } });
    return changed.count === 1;
  });
  if (!accepted) throw new ImageStorageError("La invitación cambió durante la carga. Recarga el editor antes de continuar.");
}

export async function failCloudinaryImage(ownerId: string, publicId: string, uncertain: boolean) {
  await withImageLock(ownerId, async tx => {
    const asset = await tx.cloudinaryAsset.findUnique({ where: { publicId } });
    if (asset?.state === "UPLOADING") await tx.cloudinaryAsset.update({ where: { publicId }, data: {
      state: "DELETE_PENDING", nextAttemptAt: uncertain ? asset.expiresAt : new Date(),
    } });
  }, true);
}

export async function syncCloudinaryImages(tx: Transaction, ownerId: string, eventId: string, previous: Images, next: Images) {
  await adoptSavedImages(tx, ownerId, eventId, previous);
  const previousUrls = new Set(invitationImageUrls(previous));
  const managed: { publicId: string; url: string }[] = [];
  for (const url of invitationImageUrls(next)) {
    if (!isOwnCloudinaryUrl(url)) continue;
    const publicId = ownedCloudinaryPublicId(url, ownerId, eventId);
    // Preserve existing external/shared legacy references without claiming ownership.
    if (!publicId && previousUrls.has(url)) continue;
    if (!publicId) throw new ImageStorageError("Usa fotos subidas desde esta invitación.", 400);
    managed.push({ publicId, url });
  }
  const ids = [...new Set(managed.map(image => image.publicId))];
  const assets = await tx.cloudinaryAsset.findMany({ where: { publicId: { in: ids }, ownerId, eventId } });
  for (const image of managed) {
    const asset = assets.find(candidate => candidate.publicId === image.publicId);
    if (!asset || asset.state !== "READY" || (asset.url !== image.url && !previousUrls.has(image.url))) {
      throw new ImageStorageError("Una de las fotos ya no está disponible. Recarga el editor y vuelve a subirla.", 400);
    }
  }
  if (ids.length) await tx.cloudinaryAsset.updateMany({ where: { publicId: { in: ids }, ownerId, eventId, state: "READY" }, data: { expiresAt: null } });
  await tx.cloudinaryAsset.updateMany({ where: { ownerId, eventId, state: "READY", expiresAt: null, publicId: { notIn: ids } }, data: {
    state: "DELETE_PENDING", nextAttemptAt: new Date(),
  } });
}

export async function queueEventImages(tx: Transaction, ownerId: string, eventId: string, event: Images) {
  await adoptSavedImages(tx, ownerId, eventId, event);
  await tx.cloudinaryAsset.updateMany({ where: { ownerId, eventId, state: "READY" }, data: { state: "DELETE_PENDING", nextAttemptAt: new Date() } });
  const assets = await tx.cloudinaryAsset.findMany({ where: { ownerId, eventId, state: "UPLOADING" } });
  for (const asset of assets) await tx.cloudinaryAsset.update({ where: { publicId: asset.publicId }, data: {
    state: "DELETE_PENDING",
    // An upload may still be in flight. Do not destroy before it can arrive.
    nextAttemptAt: asset.expiresAt,
  } });
}

export async function runCloudinaryCleanup(ownerId?: string, limit = 5) {
  const now = new Date();
  const candidates = await prisma.cloudinaryAsset.findMany({
    where: { ...(ownerId ? { ownerId } : {}), OR: [
      { state: "DELETE_PENDING", nextAttemptAt: { lte: now } },
      { state: { in: ["READY", "UPLOADING"] }, expiresAt: { lte: now } },
    ] }, orderBy: { updatedAt: "asc" }, take: limit,
  });
  const result = { deleted: 0, retained: 0, failed: 0 };
  for (const candidate of candidates) {
    const claim = await withImageLock(candidate.ownerId, async tx => {
      const asset = await tx.cloudinaryAsset.findUnique({ where: { publicId: candidate.publicId } });
      if (!asset || (asset.state === "DELETE_PENDING" ? !asset.nextAttemptAt || asset.nextAttemptAt > now : !asset.expiresAt || asset.expiresAt > now)) return null;
      // Includes legacy sharing across events/accounts. A matching reference anywhere
      // prevents destruction, including references in disabled sections.
      const references = await tx.$queryRaw<{ used: boolean }[]>(Prisma.sql`SELECT EXISTS (
        SELECT 1 FROM "Event" WHERE position(${asset.publicId} in COALESCE("imageUrl", '')) > 0
          OR position(${asset.publicId} in jsonb_path_query_array("sections", '$[*].imageUrl')::text) > 0
          OR position(${asset.publicId} in jsonb_path_query_array("sections", '$[*].imageUrls[*]')::text) > 0
      ) AS "used"`);
      if (references[0]?.used) {
        await tx.cloudinaryAsset.update({ where: { publicId: asset.publicId }, data: asset.state === "READY"
          ? { expiresAt: null }
          : { nextAttemptAt: new Date(now.getTime() + 24 * HOUR) } });
        result.retained++;
        return null;
      }
      const lease = new Date(now.getTime() + 2 * 60 * 1000);
      await tx.cloudinaryAsset.update({ where: { publicId: asset.publicId }, data: { state: "DELETE_PENDING", nextAttemptAt: lease, attempts: { increment: 1 } } });
      return { ...asset, lease };
    }, true);
    if (!claim) continue;
    try {
      await destroyCloudinaryImage(claim.publicId);
      await prisma.cloudinaryAsset.deleteMany({ where: { publicId: claim.publicId, state: "DELETE_PENDING", nextAttemptAt: claim.lease } });
      result.deleted++;
    } catch {
      await prisma.cloudinaryAsset.updateMany({ where: { publicId: claim.publicId, state: "DELETE_PENDING", nextAttemptAt: claim.lease }, data: {
        nextAttemptAt: new Date(Date.now() + Math.min(24 * HOUR, 5 * 60 * 1000 * 2 ** Math.min(claim.attempts, 8))),
      } });
      result.failed++;
      console.error("Cloudinary cleanup deferred; retry remains queued");
    }
  }
  return result;
}

export function scheduleCloudinaryCleanup(ownerId: string) {
  after(async () => {
    try { await runCloudinaryCleanup(ownerId, 2); }
    catch { console.error("Cloudinary cleanup could not run; retry remains queued"); }
  });
}
