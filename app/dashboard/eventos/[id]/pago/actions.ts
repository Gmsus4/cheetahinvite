"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { stripeIsConfigured } from "@/lib/stripe";
import { prepareInvitationCheckout } from "@/lib/payment-checkout";
import { redirect } from "next/navigation";
import { eventPublicationIssues } from "@/lib/guided-invitation";

export async function startCheckout(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id } });
  if (!event) redirect("/dashboard?error=evento");
  if (event.paidAt) redirect(`/dashboard/eventos/${eventId}/pago`);
  if (eventPublicationIssues(event).length) redirect(`/dashboard/eventos/${eventId}?error=pendientes`);
  if (!stripeIsConfigured()) redirect(`/dashboard/eventos/${eventId}/pago?error=disponibilidad`);

  let checkoutUrl: string | null = null;
  try {
    checkoutUrl = await prepareInvitationCheckout(event.id, session.user.id);
  } catch {
    console.error("Unable to prepare invitation checkout");
    redirect(`/dashboard/eventos/${eventId}/pago?error=checkout`);
  }
  if (!checkoutUrl) redirect(`/dashboard/eventos/${eventId}/pago?error=checkout`);
  redirect(checkoutUrl);
}
