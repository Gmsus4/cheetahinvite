import "server-only";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getStripe } from "@/lib/stripe";
import { getCurrentPrice } from "@/lib/site-pricing";
import { stripeLiveMode } from "@/lib/payment-fulfillment";
import { eventPublicationIssues } from "@/lib/guided-invitation";
import { canRenewInvitation, invitationLifecycle } from "@/lib/invitation-lifecycle";

export async function prepareInvitationCheckout(eventId: string, ownerId: string): Promise<string | null> {
  const currentPrice = await getCurrentPrice();
  // Reserve a durable attempt before contacting Stripe. Concurrent tabs reuse
  // its ID as the idempotency key, even if the first HTTP response is lost.
  const payment = await prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} AND "ownerId" = ${ownerId} FOR UPDATE`);
    const event = await tx.event.findFirst({ where: { id: eventId, ownerId } });
    if (!event || event.isExample) return null;
    const renewal = canRenewInvitation(event);
    if ((event.paidAt || event.complimentaryAt) && !renewal) return null;
    if (eventPublicationIssues(event).length) throw new Error("Complete the invitation before checkout");
    const renewalOfPaymentIntentId = renewal ? event.stripePaymentIntentId : null;
    const pending = await tx.invitationPayment.findFirst({ where: { eventId, ownerId, status: "PENDING", renewalOfPaymentIntentId }, orderBy: { createdAt: "desc" } });
    if (pending) return pending;
    const checkoutExpiresAt = new Date(Math.floor(Math.min(Date.now() + 60 * 60 * 1000,
      renewal ? invitationLifecycle(event)!.deletesAt.getTime() : Infinity) / 1000) * 1000);
    if (checkoutExpiresAt.getTime() < Date.now() + 31 * 60 * 1000) throw new Error("Renewal checkout window has closed");
    return tx.invitationPayment.create({ data: { eventId, ownerId, eventName: event.name, amount: currentPrice.amount, currency: currentPrice.currency,
      // Explicit expiry prevents an ambiguous create retry after Stripe's
      // idempotency retention from opening another payable session.
      checkoutExpiresAt, renewalOfPaymentIntentId, livemode: stripeLiveMode(),
    } });
  });
  if (!payment) return null;
  if (payment.livemode !== stripeLiveMode() && !payment.id.startsWith("legacy:")) throw new Error("Checkout environment mismatch");
  const stripe = getStripe();
  const priceChanged = payment.amount !== currentPrice.amount || payment.currency !== currentPrice.currency;
  if (payment.stripeCheckoutSessionId) {
    const previous = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
    if (previous.livemode !== stripeLiveMode()) throw new Error("Checkout environment mismatch");
    if (previous.status === "complete") return `/dashboard/eventos/${eventId}/pago?payment=received`;
    if (previous.status === "open") {
      if (!priceChanged) {
        if (!previous.url) throw new Error("Checkout URL unavailable");
        return previous.url;
      }
      // Close the old unpaid quote before issuing the new price. Never replace
      // a completed checkout, including one paid during this request.
      try {
        await stripe.checkout.sessions.expire(previous.id, {}, { idempotencyKey: `replace-price:${payment.id}` });
      } catch (error) {
        const latest = await stripe.checkout.sessions.retrieve(previous.id);
        if (latest.status === "complete") return `/dashboard/eventos/${eventId}/pago?payment=received`;
        if (latest.status !== "expired") throw error;
      }
    }
    await prisma.invitationPayment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "EXPIRED" } });
    return prepareInvitationCheckout(eventId, ownerId);
  }
  // Stripe requires at least 30 minutes remaining when creating Checkout.
  if (payment.checkoutExpiresAt.getTime() < Date.now() + 31 * 60 * 1000) {
    if (payment.checkoutExpiresAt > new Date()) throw new Error("Checkout recovery pending until expiry");
    await prisma.invitationPayment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "EXPIRED" } });
    return prepareInvitationCheckout(eventId, ownerId);
  }
  const origin = new URL(process.env.APP_URL!).origin;
  const metadata = { eventId, ownerId, paymentId: payment.id, product: "invitation-12-months" };
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment", allowed_payment_method_types: ["card"], client_reference_id: eventId,
    metadata, payment_intent_data: { metadata }, expires_at: Math.floor(payment.checkoutExpiresAt.getTime() / 1000),
    line_items: [{ quantity: 1, price_data: { currency: payment.currency, unit_amount: payment.amount,
      product_data: { name: "Invitación digital · 12 meses", description: "Un pago por evento. Sin renovación automática." },
    } }],
    success_url: `${origin}/dashboard/eventos/${eventId}/pago?payment=received`,
    cancel_url: `${origin}/dashboard/eventos/${eventId}/pago?payment=cancelled`, locale: "es",
  }, { idempotencyKey: `invitation-payment:${payment.id}` });
  await prisma.invitationPayment.update({ where: { id: payment.id }, data: { stripeCheckoutSessionId: checkout.id } });
  await prisma.event.updateMany({ where: { id: eventId, ownerId, isExample: false,
    ...(payment.renewalOfPaymentIntentId ? { stripePaymentIntentId: payment.renewalOfPaymentIntentId } : { paidAt: null, complimentaryAt: null }) },
    data: { stripeCheckoutSessionId: checkout.id, ...(!payment.renewalOfPaymentIntentId ? { status: "PENDING_PAYMENT" as const } : {}) } });
  // Recover an ambiguous older create with its original idempotent parameters,
  // then retire that checkout before returning a link at the current price.
  if (priceChanged) return prepareInvitationCheckout(eventId, ownerId);
  return checkout.url;
}
