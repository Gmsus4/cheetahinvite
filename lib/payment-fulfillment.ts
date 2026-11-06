import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getStripe } from "@/lib/stripe";
import { invitationSlug, isPaidInvitationSession } from "@/lib/stripe-payment";
import { invitationLinkRegistryReady, reserveInvitationPath } from "@/lib/invitation-link-storage";
import { invitationPath, legacyInvitationPath } from "@/lib/invitation-url";
import { paymentAccess } from "@/lib/payment-status";

export function stripeLiveMode() {
  return /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");
}
const objectId = (object: string | { id: string } | null) => typeof object === "string" ? object : object?.id;

// Serialize the Stripe read AND write per purchase: a slow older webhook must
// not overwrite a newer reconciliation with stale data.
export async function reconcileInvitationPayment(paymentId: string, minimumAgeMs = 0) {
  const registryReady = await invitationLinkRegistryReady(prisma);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${paymentId}, 0))`);
    const payment = await tx.invitationPayment.findUnique({ where: { id: paymentId } });
    if (!payment?.stripeCheckoutSessionId) return null;
    if (minimumAgeMs && payment.lastSyncedAt && Date.now() - payment.lastSyncedAt.getTime() < minimumAgeMs) return null;
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
    if (checkout.livemode !== stripeLiveMode() || (payment.livemode !== checkout.livemode && !payment.id.startsWith("legacy:"))) return null;
    if (checkout.metadata?.eventId !== payment.eventId || checkout.metadata?.ownerId !== payment.ownerId
      || (checkout.metadata.paymentId && checkout.metadata.paymentId !== payment.id)) return null;
    if (!isPaidInvitationSession(checkout, payment)) {
      if (checkout.payment_status === "paid") throw new Error("Purchase amount or product mismatch");
      const intentId = objectId(checkout.payment_intent);
      const intent = intentId ? await stripe.paymentIntents.retrieve(intentId) : null;
      const failed = intent && ["canceled", "requires_payment_method"].includes(intent.status);
      if (!payment.paidAt) await tx.invitationPayment.update({ where: { id: payment.id }, data: {
        status: checkout.status === "expired" ? "EXPIRED" : failed ? "FAILED" : "PENDING",
        livemode: checkout.livemode, lastSyncedAt: new Date(),
      } });
      return { paymentId: payment.id, invitation: null };
    }
    const intentId = objectId(checkout.payment_intent)!;
    if (payment.stripePaymentIntentId && payment.stripePaymentIntentId !== intentId) throw new Error("Payment identity mismatch");
    const intent = await stripe.paymentIntents.retrieve(intentId, { expand: ["latest_charge"] });
    const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
    if (intent.livemode !== checkout.livemode || intent.status !== "succeeded" || intent.amount_received !== payment.amount
      || intent.currency !== payment.currency || !charge?.paid || !charge.captured || charge.currency !== payment.currency
      || charge.amount !== payment.amount || objectId(charge.payment_intent) !== intent.id) throw new Error("Unverified invitation charge");
    // Charge.refunds contains only a page. Count successful refunds from the
    // complete list; pending/failed/canceled refunds do not revoke access.
    const refunds: { id: string; amount: number; status: string }[] = [];
    for await (const refund of stripe.refunds.list({ charge: charge.id, limit: 100 })) {
      if (refunds.length >= 1000) throw new Error("Refund reconciliation limit exceeded");
      refunds.push({ id: refund.id, amount: refund.amount, status: refund.status ?? "pending" });
    }
    const disputes: { id: string; status: string }[] = [];
    for await (const dispute of stripe.disputes.list({ charge: charge.id, limit: 100 })) {
      if (disputes.length >= 1000) throw new Error("Dispute reconciliation limit exceeded");
      disputes.push({ id: dispute.id, status: dispute.status });
    }
    const refundedAmount = refunds.filter(r => r.status === "succeeded").reduce((sum, r) => sum + r.amount, 0);
    const refundPendingAmount = refunds.filter(r => ["pending", "requires_action"].includes(r.status)).reduce((sum, r) => sum + r.amount, 0);
    const disputeStatus = disputes.find(d => d.status === "lost")?.status
      ?? disputes.find(d => !["won", "warning_closed"].includes(d.status))?.status ?? disputes[0]?.status ?? null;
    const paidAt = payment.paidAt ?? new Date(charge.created * 1000);
    const expiresAt = payment.expiresAt ?? new Date(new Date(paidAt).setUTCFullYear(paidAt.getUTCFullYear() + 1));
    const updated = await tx.invitationPayment.update({ where: { id: payment.id }, data: {
      status: "PAID", livemode: checkout.livemode, stripePaymentIntentId: intent.id, stripeChargeId: charge.id,
      paidAt, expiresAt, refundedAmount, refundPendingAmount, refunds, disputes, disputeStatus, lastSyncedAt: new Date(),
    } });
    const invitation = await tx.event.findFirst({ where: { id: payment.eventId, ownerId: payment.ownerId } });
    if (!invitation) return { paymentId: payment.id, invitation: null };
    let slug = invitation.slug || invitationSlug(invitation.name, invitation.id);
    const baseSlug = slug;
    let suffix = 2;
    if (registryReady) {
      while (!await reserveInvitationPath(tx, `/event/${slug}`, invitation.id)) slug = `${baseSlug}-${suffix++}`;
      if (invitation.customSlug && !await reserveInvitationPath(tx, `/event/${invitation.customSlug}`, invitation.id)) throw new Error("Invitation URL is already reserved");
    }
    // A second charge is retained for support; it cannot replace the purchase
    // that controls access or extend its original term.
    if ((!invitation.paidAt || invitation.stripePaymentIntentId === intent.id)
      && !["ARCHIVED", "EXPIRED"].includes(invitation.status)) {
      const access = paymentAccess(updated);
      await tx.event.updateMany({ where: { id: invitation.id, ownerId: invitation.ownerId,
        status: { notIn: ["ARCHIVED", "EXPIRED"] }, OR: [{ paidAt: null }, { stripePaymentIntentId: intent.id }] }, data: {
        paidAt, expiresAt, slug, status: access === "PUBLISHED" && expiresAt <= new Date() ? "EXPIRED" : access,
        stripeCheckoutSessionId: checkout.id, stripePaymentIntentId: intent.id,
      } });
    }
    const publicPath = registryReady ? invitationPath : legacyInvitationPath;
    return { paymentId: payment.id, invitation: { id: invitation.id, slug, path: publicPath({ ...invitation, slug })! } };
  }, { timeout: 45000, maxWait: 10000 });
}

export async function fulfillInvitationPayment(session: Stripe.Checkout.Session) {
  if (session.livemode !== stripeLiveMode()) return null;
  let payment = await prisma.invitationPayment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
  if (!payment && session.metadata?.paymentId) {
    const reserved = await prisma.invitationPayment.findUnique({ where: { id: session.metadata.paymentId } });
    if (!reserved || reserved.eventId !== session.metadata.eventId || reserved.ownerId !== session.metadata.ownerId
      || reserved.livemode !== session.livemode || (reserved.stripeCheckoutSessionId && reserved.stripeCheckoutSessionId !== session.id)
      || session.mode !== "payment" || session.client_reference_id !== reserved.eventId
      || session.amount_total !== reserved.amount || session.currency !== reserved.currency
      || session.metadata.product !== "invitation-12-months") return null;
    payment = await prisma.invitationPayment.update({ where: { id: reserved.id }, data: { stripeCheckoutSessionId: session.id } });
  }
  if (!payment) return null;
  return reconcileInvitationPayment(payment.id);
}

export async function reconcileStripeObject(object: Stripe.Charge | Stripe.Refund | Stripe.Dispute) {
  if ("livemode" in object && object.livemode !== stripeLiveMode()) return null;
  const intentId = objectId(object.payment_intent);
  if (!intentId) return null;
  const payment = await prisma.invitationPayment.findUnique({ where: { stripePaymentIntentId: intentId } });
  if (!payment) {
    // Refund/dispute notifications can arrive before Checkout completion.
    const sessions = await getStripe().checkout.sessions.list({ payment_intent: intentId, limit: 2 });
    for (const session of sessions.data) {
      const result = await fulfillInvitationPayment(session);
      if (result) return result;
    }
    return null;
  }
  return reconcileInvitationPayment(payment.id);
}
