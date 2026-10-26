import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "@/prisma";
import { isValidInvitationSlug } from "@/lib/invitation-url";

// Share the lookup between page rendering and metadata within each request.
export const getPublicInvitation = cache(async (slug: string, customSlug?: string) => {
  await connection();
  if (customSlug !== undefined && !isValidInvitationSlug(customSlug)) return null;
  return prisma.event.findFirst({
    where: {
      ...(customSlug === undefined ? { slug } : { ownerId: slug, customSlug }),
      status: "PUBLISHED",
      paidAt: { not: null },
      expiresAt: { gt: new Date() },
    },
  });
});
