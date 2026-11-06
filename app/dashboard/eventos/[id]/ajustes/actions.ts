"use server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { hashInvitationPin, validInvitationPin } from "@/lib/invitation-pin";
import { revalidatePath } from "next/cache";

export async function saveInvitationPrivacy(eventId: string, privacy: string, pin: string, version: number) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Inicia sesión de nuevo para guardar los ajustes." } as const;
  if (!["PUBLIC", "PRIVATE"].includes(privacy) || !Number.isInteger(version) || version < 0 || typeof pin !== "string" || (privacy === "PRIVATE" && pin && !validInvitationPin(pin))) return { ok: false, error: "Elige la privacidad y, si cambias el PIN, escribe seis dígitos." } as const;
  try {
    const newHash = privacy === "PRIVATE" && pin ? await hashInvitationPin(pin) : null;
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} AND "ownerId" = ${session.user.id} FOR UPDATE`);
      const event = await tx.event.findFirst({ where: { id: eventId, ownerId: session.user.id } });
      if (!event) return { ok: false, error: "No encontramos esta invitación." } as const;
      if (event.privacyVersion !== version) return { ok: false, error: "Los ajustes cambiaron en otra pestaña. Vuelve a abrir Ajustes para consultar la versión actual." } as const;
      const pinHash = privacy === "PRIVATE" ? newHash || event.pinHash : null;
      if (privacy === "PRIVATE" && !pinHash) return { ok: false, error: "Elige un PIN de seis dígitos para proteger la invitación." } as const;
      if (privacy === event.privacy && !newHash) return { ok: true, privacy, version, hasPin: Boolean(pinHash) } as const;
      await tx.event.update({ where: { id: eventId }, data: { privacy, pinHash, privacyVersion: { increment: 1 } } });
      await tx.invitationAccessSession.deleteMany({ where: { eventId } });
      return { ok: true, privacy, version: version + 1, hasPin: Boolean(pinHash) } as const;
    });
    if (result.ok) {
      revalidatePath("/dashboard");
      revalidatePath(`/dashboard/eventos/${eventId}/ajustes`);
      revalidatePath(`/dashboard/eventos/${eventId}`);
      revalidatePath("/event/[slug]", "page");
      revalidatePath("/invitacion/[slug]", "page");
      revalidatePath("/invitacion/[slug]/[customSlug]", "page");
    }
    return result;
  } catch {
    return { ok: false, error: "No pudimos guardar la privacidad. Conservamos tus ajustes anteriores; inténtalo de nuevo." } as const;
  }
}
