"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { isPaymentProvider, paymentProviderConfigured } from "@/lib/payment-providers";
import { prepareExternalCheckout } from "@/lib/external-payment-checkout";
import { prepareInvitationCheckout } from "@/lib/payment-checkout";
import { redirect } from "next/navigation";
import { eventPublicationIssues } from "@/lib/guided-invitation";
import { canRenewInvitation } from "@/lib/invitation-lifecycle";
import { authPageHref } from "@/lib/auth-destination";

export async function startCheckout(eventId: string, formData?: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect(authPageHref("/login", `/dashboard/eventos/${eventId}/pago`));
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id } });
  if (!event) redirect("/dashboard?error=evento");
  if (event.isExample || ((event.paidAt || event.complimentaryAt) && !canRenewInvitation(event))) redirect(`/dashboard/eventos/${eventId}/pago`);
  if (event.privacy === "UNSET") redirect(`/dashboard/eventos/${eventId}/ajustes`);
  if (eventPublicationIssues(event).length) redirect(`/dashboard/eventos/${eventId}?error=pendientes`);
  const provider = formData?.get("provider") ?? "stripe";
  if (!isPaymentProvider(provider)) redirect(`/dashboard/eventos/${eventId}/pago?error=checkout`);
  if (!paymentProviderConfigured(provider)) redirect(`/dashboard/eventos/${eventId}/pago?error=disponibilidad`);

  let checkoutUrl: string | null = null;
  try {
    checkoutUrl = provider === "stripe" ? await prepareInvitationCheckout(event.id, session.user.id)
      : await prepareExternalCheckout(event.id, session.user.id, provider);
  } catch {
    console.error("Unable to prepare invitation checkout");
    redirect(`/dashboard/eventos/${eventId}/pago?error=checkout`);
  }
  if (!checkoutUrl) redirect(`/dashboard/eventos/${eventId}/pago?error=checkout`);
  redirect(checkoutUrl);
}
