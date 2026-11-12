"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { authPageHref } from "@/lib/auth-destination";
import { withImageLock } from "@/lib/cloudinary-storage";
import { validCreationKey } from "@/lib/invitation-editor";
import { canEditInvitation } from "@/lib/invitation-lifecycle";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { getShowcaseInvitation } from "@/lib/showcase";
import { showcaseStyleData } from "@/lib/showcase-style";

class StyleApplicationError extends Error {}

export async function useExampleStyle(style: string, formData: FormData) {
  const destination = `/ejemplo-invitacion/${encodeURIComponent(style)}/utilizar`;
  const session = await auth();
  if (!session?.user?.id) redirect(authPageHref("/login", destination));
  const invitation = await getShowcaseInvitation(style);
  if (!invitation) redirect(`${destination}?error=unavailable`);
  const target = formData.get("eventId");
  const creationKey = String(formData.get("creationKey") ?? "");
  const rawVersion = formData.get("contentVersion");
  const version = typeof rawVersion === "string" && /^\d+$/.test(rawVersion) ? Number(rawVersion) : NaN;
  if (typeof target !== "string" || (target === "new" ? !validCreationKey(creationKey) : !/^[a-zA-Z0-9_-]{1,80}$/.test(target) || !Number.isSafeInteger(version) || version < 0 || version > 2147483646)) redirect(`${destination}?error=invalid`);

  let eventId: string;
  try {
    eventId = await withImageLock(session.user.id, async tx => {
      if (target === "new") {
        const existing = await tx.event.findFirst({ where: { id: creationKey, ownerId: session.user.id, isExample: false } });
        if (existing) return existing.id;
        const slot = await tx.user.updateMany({ where: { id: session.user.id, invitationCount: { lt: ACCOUNT_LIMITS.invitations } }, data: { invitationCount: { increment: 1 } } });
        if (!slot.count) throw new StyleApplicationError("limit");
        const design = showcaseStyleData(invitation);
        if (design.sections.length > 16) throw new StyleApplicationError("blocks");
        const date = invitation.eventDateKey ? new Date(`${invitation.eventDateKey}T12:00:00.000Z`) : null;
        const event = await tx.event.create({ data: {
          ...design, imagePalette: design.imagePalette ?? Prisma.DbNull, sections: JSON.parse(JSON.stringify(design.sections)),
          id: creationKey, ownerId: session.user.id, name: invitation.name, eventType: invitation.eventType,
          hostNames: invitation.hostNames, eventDate: date && Number.isFinite(date.getTime()) ? date : null,
          eventTime: date && Number.isFinite(date.getTime()) ? invitation.eventTime || null : null,
          venue: invitation.venue, address: invitation.address, message: invitation.message,
          status: "DRAFT", privacy: "UNSET",
        } });
        return event.id;
      }
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${target} FOR UPDATE`);
      const event = await tx.event.findFirst({ where: { id: target, ownerId: session.user.id, isExample: false } });
      if (!event || !canEditInvitation(event)) throw new StyleApplicationError("unavailable");
      if (event.contentVersion !== version) throw new StyleApplicationError("conflict");
      const design = showcaseStyleData(invitation, event);
      if (design.sections.length > 16) throw new StyleApplicationError("blocks");
      // All existing photos remain referenced. New shared references come only from the public snapshot.
      const changed = await tx.event.updateMany({ where: { id: event.id, ownerId: session.user.id, contentVersion: version, isExample: false }, data: {
        ...design, imagePalette: design.imagePalette ?? Prisma.DbNull, sections: JSON.parse(JSON.stringify(design.sections)), contentVersion: { increment: 1 },
      } });
      if (!changed.count) throw new StyleApplicationError("conflict");
      return event.id;
    });
  } catch (error) {
    redirect(`${destination}?error=${error instanceof StyleApplicationError ? error.message : "save"}`);
  }
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/eventos/${eventId}`);
  revalidatePath(`/dashboard/eventos/${eventId}/show`);
  revalidatePath("/dashboard/eventos");
  revalidatePath("/crear");
  revalidatePath("/event/[slug]", "page");
  revalidatePath("/invitacion/[slug]", "page");
  revalidatePath("/invitacion/[slug]/[customSlug]", "page");
  redirect(target === "new" ? `/crear?resume=${eventId}` : `/dashboard/eventos/${eventId}/show?from=dashboard`);
}
