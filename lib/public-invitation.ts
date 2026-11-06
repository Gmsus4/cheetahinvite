import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "@/prisma";
import type { Event } from "@/generated/prisma/client";
import { canAccessInvitation } from "@/lib/invitation-access";
import { isValidInvitationSlug } from "@/lib/invitation-url";

export const getPublicInvitation = cache(async (slug: string, customSlug?: string, global = false) => {
  await connection();
  if (customSlug !== undefined && !isValidInvitationSlug(customSlug)) return null;
  const path = global ? `/event/${slug}` : customSlug === undefined ? `/invitacion/${slug}` : `/invitacion/${slug}/${customSlug}`;
  let link: { eventId: string } | null = null;
  let registryReady = true;
  try {
    link = await prisma.invitationLink.findUnique({ where: { path } });
  } catch (error) {
    // During rollout the generated client may precede the database migration.
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2021") throw error;
    registryReady = false;
  }
  if (global && registryReady && !link) return null;
  if (global && !registryReady) {
    const matches = await prisma.event.findMany({ where: {
      OR: [{ customSlug: slug }, { slug }],
      status: "PUBLISHED", paidAt: { not: null }, expiresAt: { gt: new Date() },
    }, take: 2, omit: { pinHash: true } });
    // Never choose an arbitrary organizer when old account-scoped names collide.
    return matches.length === 1 ? visibleInvitation(matches[0]) : null;
  }
  const event = await prisma.event.findFirst({
    where: {
      ...(link ? { id: link.eventId } : customSlug === undefined ? { slug } : { ownerId: slug, customSlug }),
      status: "PUBLISHED", paidAt: { not: null }, expiresAt: { gt: new Date() },
    }, omit: { pinHash: true },
  });
  return visibleInvitation(event);
});

async function visibleInvitation(event: Omit<Event, "pinHash"> | null) {
  if (!event || event.privacy === "UNSET") return null;
  if (await canAccessInvitation(event)) return { ...event, pinHash: undefined };
  // Locked responses never carry personal content into rendering or metadata.
  return { ...event, pinHash: undefined, ownerId: "", name: "Invitación protegida", hostNames: null,
    venue: null, address: null, message: null, imageUrl: null, backgroundImageUrl: null,
    eventDate: null, eventTime: null, sections: [], paidAt: null, expiresAt: null,
    stripeCheckoutSessionId: null, stripePaymentIntentId: null };
}
