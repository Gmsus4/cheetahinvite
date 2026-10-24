import type Stripe from "stripe";
import { INVITATION_PRICE } from "./invitation-payment";

export function isPaidInvitationSession(session: Stripe.Checkout.Session) {
  return session.mode === "payment" && session.payment_status === "paid"
    && session.amount_total === INVITATION_PRICE.amount && session.currency === INVITATION_PRICE.currency
    && session.metadata?.product === "invitation-12-months"
    && Boolean(session.metadata.eventId && session.metadata.ownerId)
    && session.client_reference_id === session.metadata.eventId;
}

export function invitationSlug(name: string, id: string) {
  const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return `${base || "evento"}-${id}`;
}
