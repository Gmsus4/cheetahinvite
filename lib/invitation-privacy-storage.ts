import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { isInvitationPublished } from "@/lib/invitation-payment";
import { ACCESS_SECONDS, accessTokenHash, createAccessToken, verifyInvitationPin } from "@/lib/invitation-pin";

export async function unlockPrivateInvitation(eventId: string, pin: string, address: string) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE`);
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event || !isInvitationPublished(event) || event.privacy !== "PRIVATE" || !event.pinHash) return { status: 404, error: "Invitación no disponible." } as const;
    const now = new Date();
    const window = Math.floor(now.getTime() / 900_000);
    const expiresAt = new Date((window + 1) * 900_000);
    await tx.invitationPinBudget.deleteMany({ where: { eventId, expiresAt: { lte: now } } });
    const visitor = createHash("sha256").update(`${eventId}:${address}`).digest("hex");
    for (const [key, limit] of [[`${eventId}:all:${window}`, 500], [`${eventId}:${visitor}:${window}`, 20]] as const) {
      const budget = await tx.invitationPinBudget.findUnique({ where: { key } });
      if (budget && budget.count >= limit) return { status: 429, error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." } as const;
    }
    for (const key of [`${eventId}:all:${window}`, `${eventId}:${visitor}:${window}`]) {
      await tx.invitationPinBudget.upsert({ where: { key }, create: { key, eventId, expiresAt }, update: { count: { increment: 1 } } });
    }
    // Return failures so PostgreSQL commits the attempt counters.
    if (!await verifyInvitationPin(pin, event.pinHash)) return { status: 401, error: "El PIN no es correcto. Inténtalo de nuevo." } as const;
    const token = createAccessToken();
    await tx.invitationAccessSession.deleteMany({ where: { eventId, expiresAt: { lte: now } } });
    await tx.invitationAccessSession.create({ data: { tokenHash: accessTokenHash(token), eventId, version: event.privacyVersion, expiresAt: new Date(now.getTime() + ACCESS_SECONDS * 1000) } });
    return { status: 200, token } as const;
  }, { timeout: 10000 });
}
