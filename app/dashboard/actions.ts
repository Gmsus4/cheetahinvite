"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";

export async function acknowledgeCourtesyNotice(grantId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo para cerrar el aviso." } as const;
  if (typeof grantId !== "string" || !grantId || grantId.length > 128) return { ok: false, error: "No encontramos este aviso." } as const;
  try {
    // Repeated acknowledgements are harmless; the recipient is the only person
    // who can mark their grant as read. This never changes invitation access.
    await prisma.courtesyGrant.updateMany({ where: { id: grantId, ownerId: session.user.id, readAt: null }, data: { readAt: new Date() } });
    revalidatePath("/dashboard");
    return { ok: true } as const;
  } catch {
    return { ok: false, error: "No pudimos cerrar el aviso. Inténtalo de nuevo." } as const;
  }
}
