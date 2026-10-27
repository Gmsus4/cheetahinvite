"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { reconcileInvitationPayment } from "@/lib/payment-fulfillment";
import { stripeIsConfigured } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function refreshPurchase(paymentId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard%2Fcompras");
  const payment = await prisma.invitationPayment.findFirst({ where: { id: paymentId, ownerId: session.user.id } });
  if (!payment) redirect("/dashboard/compras");
  if (!stripeIsConfigured()) redirect("/dashboard/compras?error=disponibilidad");
  let result;
  try {
    result = await reconcileInvitationPayment(payment.id, 30000);
  } catch {
    console.error("Unable to refresh purchase");
    redirect("/dashboard/compras?error=verificacion");
  }
  revalidatePath("/dashboard/compras");
  revalidatePath("/dashboard");
  if (result?.invitation) {
    revalidatePath(`/dashboard/eventos/${result.invitation.id}`);
    revalidatePath(`/dashboard/eventos/${result.invitation.id}/pago`);
    revalidatePath(`/invitacion/${result.invitation.slug}`);
    revalidatePath(result.invitation.path);
  }
}
