import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export async function invitationLinkRegistryReady(db: Pick<Prisma.TransactionClient, "invitationLink">) {
  try {
    await db.invitationLink.findUnique({ where: { path: "/event/" } });
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") return false;
    throw error;
  }
}

export async function reserveInvitationPath(tx: Prisma.TransactionClient, path: string, eventId: string) {
  // The unique primary key arbitrates simultaneous claims from different accounts.
  await tx.invitationLink.createMany({ data: [{ path, eventId }], skipDuplicates: true });
  const link = await tx.invitationLink.findUnique({ where: { path } });
  return link?.eventId === eventId;
}
