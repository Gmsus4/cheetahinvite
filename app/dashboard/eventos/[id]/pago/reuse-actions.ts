"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ReuseInvitationError, reuseRefundedInvitation } from "@/lib/refunded-invitation";
import { scheduleImageCleanup } from "@/lib/image-storage";

export async function reuseRefundedEvent(eventId: string, confirmed: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };
  if (confirmed !== true || !/^[a-zA-Z0-9_-]{1,80}$/.test(eventId)) return { error: "Confirma el reemplazo antes de continuar." };
  let id: string;
  try { id = await reuseRefundedInvitation(session.user.id, eventId); }
  catch (error) {
    return { error: error instanceof ReuseInvitationError ? error.message : "No pudimos crear el borrador. La operación no se completó; vuelve a intentarlo." };
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath("/crear");
  revalidatePath("/event/[slug]", "page");
  revalidatePath("/invitacion/[slug]", "page");
  revalidatePath("/invitacion/[slug]/[customSlug]", "page");
  scheduleImageCleanup(session.user.id);
  return { error: null, eventId: id };
}
