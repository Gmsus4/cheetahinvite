import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { transferSavedImages, withImageLock } from "@/lib/image-storage";
import { invitationLifecycle } from "@/lib/invitation-lifecycle";

export class ReuseInvitationError extends Error {}

// An allowlist prevents billing, guest access and publication fields leaking into a new draft.
const contentKeys = ["name", "eventType", "hostNames", "venue", "address", "message", "imageUrl", "backgroundImageUrl",
  "accent", "buttonShape", "buttonFilled", "buttonIcons", "buttonBold", "buttonBorder", "heroHorizontal", "heroVertical",
  "typography", "bodyTypography", "panelStyle", "coverLayout", "glassBorder", "showSectionIcons", "sectionCorners",
  "sectionColor", "textColorMode", "textColor", "blurIntensity", "backgroundBlurIntensity", "backgroundDimIntensity",
  "templateId", "texture", "eventDate", "eventTime"] as const;

export async function reuseRefundedInvitation(ownerId: string, eventId: string) {
  // Stable destination makes concurrent submissions and retries after a lost response idempotent.
  const id = `reuse_${createHash("sha256").update(`${ownerId}:${eventId}`).digest("hex").slice(0, 40)}`;
  return withImageLock(ownerId, async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} AND "ownerId" = ${ownerId} FOR UPDATE`);
    const event = await tx.event.findFirst({ where: { id: eventId, ownerId } });
    if (!event) {
      const replacement = await tx.event.findFirst({ where: { id, ownerId } });
      if (replacement) return replacement.id;
      throw new ReuseInvitationError("Esta invitación ya no está disponible. Revisa tus invitaciones en el panel.");
    }
    if (event.isExample || event.status !== "REFUNDED" || !event.paidAt || invitationLifecycle(event)?.phase === "deletion_due") {
      throw new ReuseInvitationError("Solo puedes reutilizar una invitación reembolsada cuyo contenido siga en conservación.");
    }
    const pending = await tx.invitationPayment.findFirst({ where: { eventId, ownerId, status: { in: ["PENDING", "FAILED"] } } });
    if (pending) throw new ReuseInvitationError("Hay un intento de pago pendiente de verificar. Actualiza su estado en Mis compras antes de reutilizar la invitación.");
    const content = Object.fromEntries(contentKeys.map(key => [key, event[key]])) as Pick<typeof event, typeof contentKeys[number]>;
    const now = new Date();
    await tx.event.create({ data: { ...content, id, ownerId, status: "DRAFT", privacy: "UNSET",
      sections: event.sections === null ? [] : event.sections as Prisma.InputJsonValue,
      imagePalette: event.imagePalette === null ? Prisma.DbNull : event.imagePalette as Prisma.InputJsonValue,
      createdAt: now, draftLastSavedAt: now,
    } });
    await transferSavedImages(tx, ownerId, eventId, id, event);
    await tx.event.delete({ where: { id: eventId } });
    // One invitation replaces another: account slots and purchase history are untouched.
    return id;
  });
}
