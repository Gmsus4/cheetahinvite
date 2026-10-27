"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { validCreationKey, type EditorSaveResult } from "@/lib/invitation-editor";

const eventTypes = new Set([
  "wedding",
  "birthday",
  "graduation",
  "baby_shower",
  "anniversary",
  "other",
]);

export async function prepareEvent(formData: FormData): Promise<EditorSaveResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: "auth", message: "Tu sesión expiró. Tu borrador local sigue disponible; inicia sesión de nuevo." };

  const name = String(formData.get("name") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "");
  const dateValue = String(formData.get("eventDate") ?? "");
  const creationKey = String(formData.get("creationKey") ?? "");

  if (name.length < 2 || name.length > 100 || !eventTypes.has(eventType) || !validCreationKey(creationKey)) {
    return { ok: false, code: "validation", message: "Revisa el nombre y el tipo de evento antes de continuar." };
  }

  const eventDate = dateValue ? new Date(`${dateValue}T12:00:00.000Z`) : null;
  if (eventDate && Number.isNaN(eventDate.getTime())) return { ok: false, code: "validation", message: "Revisa la fecha del evento." };

  try {
    const existing = await prisma.event.findFirst({ where: { id: creationKey, ownerId: session.user.id }, select: { id: true, contentVersion: true } });
    if (existing) return { ok: true, eventId: existing.id, version: existing.contentVersion };
    const created = await prisma.$transaction(async (tx) => {
    const slot = await tx.user.updateMany({
      where: { id: session.user.id, invitationCount: { lt: ACCOUNT_LIMITS.invitations } },
      data: { invitationCount: { increment: 1 } },
    });
    if (!slot.count) return false;

    const event = await tx.event.create({ data: { id: creationKey, ownerId: session.user.id, name, eventType, eventDate, sections: [] } });
    return event.id;
    });
    if (!created) {
      // A simultaneous retry may have used the last slot. It must return that
      // same draft instead of consuming another slot or reporting a false limit.
      const retry = await prisma.event.findFirst({ where: { id: creationKey, ownerId: session.user.id }, select: { id: true, contentVersion: true } });
      if (retry) return { ok: true, eventId: retry.id, version: retry.contentVersion };
      return { ok: false, code: "validation", message: "Ya usaste tus tres espacios de invitación. Tu borrador se conserva en este dispositivo." };
    }
    return { ok: true, eventId: created, version: 0 };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const retry = await prisma.event.findFirst({ where: { id: creationKey, ownerId: session.user.id }, select: { id: true, contentVersion: true } });
      if (retry) return { ok: true, eventId: retry.id, version: retry.contentVersion };
    }
    console.error("Invitation draft could not be prepared");
    return { ok: false, code: "unavailable", message: "No pudimos crear el borrador en el servidor. Tu copia local sigue disponible; intenta de nuevo." };
  }
}
