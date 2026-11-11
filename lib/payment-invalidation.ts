import "server-only";
import { revalidatePath } from "next/cache";

export function invalidatePayment(result: { invitation: { id: string; slug: string; path: string } | null } | null) {
  revalidatePath("/dashboard/compras");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eventos");
  if (result?.invitation) {
    revalidatePath(`/dashboard/eventos/${result.invitation.id}`);
    revalidatePath(`/dashboard/eventos/${result.invitation.id}/pago`);
    revalidatePath(`/invitacion/${result.invitation.slug}`);
    revalidatePath(result.invitation.path);
  }
}
