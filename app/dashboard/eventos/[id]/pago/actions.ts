"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";
import { INVITATION_PRICE } from "@/lib/invitation-payment";
import { redirect } from "next/navigation";

export async function startCheckout(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id } });
  if (!event) redirect("/dashboard?error=evento");
  if (event.paidAt) redirect(`/dashboard/eventos/${eventId}/pago`);
  if (!stripeIsConfigured()) redirect(`/dashboard/eventos/${eventId}/pago?error=disponibilidad`);

  const stripe = getStripe();
  let checkoutUrl: string | null = null;
  try {
    const previous = event.stripeCheckoutSessionId
      ? await stripe.checkout.sessions.retrieve(event.stripeCheckoutSessionId)
      : null;
    if (previous?.status === "complete") {
      checkoutUrl = `/dashboard/eventos/${eventId}/pago?payment=received`;
    } else if (previous?.status === "open" && previous.url) {
      checkoutUrl = previous.url;
    } else {
      const origin = new URL(process.env.APP_URL!).origin;
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        allowed_payment_method_types: ["card"],
        client_reference_id: event.id,
        metadata: { eventId: event.id, ownerId: event.ownerId, product: "invitation-12-months" },
        line_items: [{ quantity: 1, price_data: {
          currency: INVITATION_PRICE.currency, unit_amount: INVITATION_PRICE.amount,
          product_data: { name: "Invitación digital · 12 meses", description: "Un pago por evento. Sin renovación automática." },
        } }],
        success_url: `${origin}/dashboard/eventos/${event.id}/pago?payment=received`,
        cancel_url: `${origin}/dashboard/eventos/${event.id}/pago?payment=cancelled`,
        locale: "es",
      }, { idempotencyKey: `invitation:${event.id}:${previous?.id ?? "initial"}` });
      await prisma.event.updateMany({ where: { id: event.id, ownerId: session.user.id, paidAt: null }, data: { stripeCheckoutSessionId: checkout.id, status: "PENDING_PAYMENT" } });
      checkoutUrl = checkout.url;
    }
  } catch {
    console.error("Unable to prepare invitation checkout");
    redirect(`/dashboard/eventos/${eventId}/pago?error=checkout`);
  }
  if (!checkoutUrl) redirect(`/dashboard/eventos/${eventId}/pago?error=checkout`);
  redirect(checkoutUrl);
}
