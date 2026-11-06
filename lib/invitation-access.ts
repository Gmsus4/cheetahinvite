import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { accessCookieName, accessTokenHash } from "@/lib/invitation-pin";

type AccessEvent = { id: string; privacy?: string; privacyVersion?: number };
export async function canAccessInvitation(event: AccessEvent, db: Pick<Prisma.TransactionClient, "invitationAccessSession"> = prisma) {
  if (!event.privacy || event.privacy === "PUBLIC") return true;
  if (event.privacy !== "PRIVATE") return false;
  const token = (await cookies()).get(accessCookieName(event.id))?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const session = await db.invitationAccessSession.findUnique({ where: { tokenHash: accessTokenHash(token) } });
  return Boolean(session && session.eventId === event.id && session.version === event.privacyVersion && session.expiresAt > new Date());
}
