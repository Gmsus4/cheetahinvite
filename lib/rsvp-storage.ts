import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { isInvitationPublished } from "@/lib/invitation-payment";
import { hasIntegratedRsvp, RSVP_LIMITS, type RsvpValues } from "@/lib/rsvp";
import { canAccessInvitation } from "@/lib/invitation-access";

export class RsvpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
function canRespond(event: { status: string; paidAt: Date | null; slug: string | null; expiresAt: Date | null; sections: unknown } | null) {
  if (!event || !isInvitationPublished(event) || !hasIntegratedRsvp(event.sections)) throw new RsvpError(404, "La confirmación de asistencia no está disponible para esta invitación.");
}
export async function readRsvp(eventId: string, token: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  canRespond(event);
  if (!await canAccessInvitation(event!)) throw new RsvpError(403, "Introduce el PIN de la invitación antes de consultar tu respuesta.");
  return prisma.rsvpResponse.findUnique({ where: { eventId_tokenHash: { eventId, tokenHash: tokenHash(token) } }, select: { name: true, attending: true, companions: true } });
}
export async function saveRsvp(eventId: string, values: RsvpValues & { token: string }) {
  return prisma.$transaction(async tx => {
    // Serializes admission, resource limits and simultaneous edits/deletion.
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE`);
    const event = await tx.event.findUnique({ where: { id: eventId } });
    canRespond(event);
    if (!await canAccessInvitation(event!, tx)) throw new RsvpError(403, "Introduce el PIN de la invitación antes de confirmar tu asistencia.");
    const hash = tokenHash(values.token);
    const now = new Date();
    const hour = Math.floor(now.getTime() / 3600000);
    const expiresAt = new Date((hour + 1) * 3600000);
    await tx.rsvpSubmissionBudget.deleteMany({ where: { eventId, expiresAt: { lte: now } } });
    for (const [key, limit] of [[`${eventId}:event:${hour}`, RSVP_LIMITS.submissionsPerHour], [`${eventId}:${hash}:${hour}`, RSVP_LIMITS.updatesPerHour]] as const) {
      const budget = await tx.rsvpSubmissionBudget.findUnique({ where: { key } });
      if (budget && budget.count >= limit) throw new RsvpError(429, "Se han enviado muchas respuestas. Inténtalo de nuevo más tarde.");
      await tx.rsvpSubmissionBudget.upsert({ where: { key }, create: { key, eventId, expiresAt }, update: { count: { increment: 1 } } });
    }
    const where = { eventId_tokenHash: { eventId, tokenHash: hash } };
    const previous = await tx.rsvpResponse.findUnique({ where });
    if (!previous && await tx.rsvpResponse.count({ where: { eventId } }) >= RSVP_LIMITS.responsesPerEvent) throw new RsvpError(429, "No se pueden registrar más respuestas. Contacta con el organizador.");
    const data = { name: values.name, attending: values.attending, companions: values.companions };
    await tx.rsvpResponse.upsert({ where, create: { eventId, tokenHash: hash, ...data }, update: data });
    return data;
  }, { timeout: 10000 });
}
