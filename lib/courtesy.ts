import "server-only";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { eventPublicationIssues } from "./guided-invitation";
import { invitationSlug } from "./stripe-payment";
import { reserveInvitationPath } from "./invitation-link-storage";

export class CourtesyError extends Error {}

export async function publishCourtesy(tx: Prisma.TransactionClient, eventId: string, ownerId: string) {
  const event = await tx.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event?.complimentaryAt || !event.expiresAt || event.expiresAt <= new Date() || event.isExample || event.paidAt) throw new CourtesyError("La cortesía no está disponible para esta invitación.");
  if (["ARCHIVED", "SUSPENDED", "REFUNDED"].includes(event.status)) throw new CourtesyError("Revisa el estado de esta invitación antes de publicarla.");
  if (event.privacy === "UNSET" || eventPublicationIssues(event).length) return false;
  let slug = event.slug || invitationSlug(event.name, event.id);
  const base = slug;
  let suffix = 2;
  while (!await reserveInvitationPath(tx, `/event/${slug}`, event.id)) slug = `${base}-${suffix++}`;
  if (event.customSlug && !await reserveInvitationPath(tx, `/event/${event.customSlug}`, event.id)) throw new CourtesyError("El enlace personalizado ya está reservado.");
  await tx.event.update({ where: { id: eventId }, data: { slug, status: "PUBLISHED" } });
  return true;
}

export async function grantCourtesy(actorId: string, eventId: string, ownerId: string, reason: string, expiresAt: Date) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE`);
    const event = await tx.event.findFirst({ where: { id: eventId, ownerId, isExample: false } });
    if (!event || event.paidAt || event.complimentaryAt || !["DRAFT", "PENDING_PAYMENT", "EXPIRED"].includes(event.status)) throw new CourtesyError("Elige una invitación sin pago ni cortesía vigente.");
    // Never issue a free grant over an ambiguous checkout that can still settle.
    const pending = await tx.invitationPayment.findFirst({ where: { eventId, status: { in: ["PENDING", "FAILED"] } } });
    if (pending) throw new CourtesyError("Hay un pago en proceso o un intento fallido sin cerrar. Revisa su estado antes de otorgar la cortesía.");
    const grant = await tx.courtesyGrant.create({ data: { actorId, eventId, ownerId, reason, expiresAt } });
    await tx.event.update({ where: { id: eventId }, data: { complimentaryAt: grant.grantedAt, expiresAt, status: "DRAFT" } });
    await publishCourtesy(tx, eventId, ownerId);
    await tx.adminAudit.create({ data: { actorId, action: "courtesy.grant", targetId: grant.id, detail: { eventId, reason, expiresAt: expiresAt.toISOString() } } });
    return grant;
  });
}

export async function revokeCourtesy(actorId: string, grantId: string, reason: string) {
  return prisma.$transaction(async tx => {
    const grant = await tx.courtesyGrant.findUnique({ where: { id: grantId } });
    if (!grant || grant.revokedAt) throw new CourtesyError("Esta cortesía ya no está activa.");
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${grant.eventId} FOR UPDATE`);
    const event = await tx.event.findUnique({ where: { id: grant.eventId } });
    const changed = await tx.courtesyGrant.updateMany({ where: { id: grantId, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!changed.count) throw new CourtesyError("Esta cortesía ya fue retirada.");
    if (event?.complimentaryAt?.getTime() === grant.grantedAt.getTime() && !event.paidAt) await tx.event.update({ where: { id: event.id }, data: { complimentaryAt: null, expiresAt: null, status: "DRAFT" } });
    await tx.adminAudit.create({ data: { actorId, action: "courtesy.revoke", targetId: grantId, detail: { reason } } });
  });
}
