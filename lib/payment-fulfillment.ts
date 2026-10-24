import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/prisma";
import { invitationSlug, isPaidInvitationSession } from "@/lib/stripe-payment";
import { invitationPath } from "@/lib/invitation-url";

export async function fulfillInvitationPayment(session: Stripe.Checkout.Session, paidAt: Date) {
  const liveKey = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");
  if (session.livemode !== liveKey || !isPaidInvitationSession(session)) return null;
  const invitation = await prisma.event.findFirst({ where: { id: session.metadata!.eventId, ownerId: session.metadata!.ownerId } });
  if (!invitation) return null;
  const expiresAt = new Date(paidAt);
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  const slug = invitation.slug || invitationSlug(invitation.name, invitation.id);
  // Both webhook delivery and authenticated payment recovery share this guard.
  await prisma.event.updateMany({
    where: { id: invitation.id, ownerId: invitation.ownerId, paidAt: null },
    data: { paidAt, expiresAt, slug, status: "PUBLISHED", stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null },
  });
  return { id: invitation.id, slug, path: invitationPath({ ...invitation, slug })! };
}
