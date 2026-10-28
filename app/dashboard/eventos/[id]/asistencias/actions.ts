"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";

export async function deleteRsvpResponse(eventId: string, responseId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Inicia sesión para eliminar respuestas." };
  if (typeof eventId !== "string" || typeof responseId !== "string" || !eventId || !responseId || eventId.length > 100 || responseId.length > 100) {
    return { error: "Respuesta no válida." };
  }
  try {
    const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, select: { id: true } });
    if (!event) return { error: "Invitación no encontrada." };
    await prisma.rsvpResponse.deleteMany({ where: { id: responseId, eventId } });
  } catch {
    return { error: "No se pudo eliminar la respuesta. Inténtalo de nuevo." };
  }
  revalidatePath(`/dashboard/eventos/${eventId}/asistencias`);
  return { error: null };
}
