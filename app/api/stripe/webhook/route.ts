import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { getStripe } from "@/lib/stripe";
import { fulfillInvitationPayment, reconcileStripeObject, stripeLiveMode } from "@/lib/payment-fulfillment";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Payment service unavailable" }, { status: 503 });
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.livemode !== stripeLiveMode()) return Response.json({ received: true });
  try {
    let result: Awaited<ReturnType<typeof fulfillInvitationPayment>> = null;
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.livemode === event.livemode) result = await fulfillInvitationPayment(session);
    } else if (["charge.refunded", "refund.created", "refund.updated", "refund.failed", "charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed", "charge.dispute.funds_withdrawn", "charge.dispute.funds_reinstated"].includes(event.type)) {
      result = await reconcileStripeObject(event.data.object as Stripe.Charge | Stripe.Refund | Stripe.Dispute);
    }
    if (!result) return Response.json({ received: true });
    revalidatePath("/dashboard/compras");
    const invitation = result.invitation;
    if (!invitation) return Response.json({ received: true });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/eventos");
    revalidatePath(`/dashboard/eventos/${invitation.id}`);
    revalidatePath(`/dashboard/eventos/${invitation.id}/pago`);
    revalidatePath(`/invitacion/${invitation.slug}`);
    revalidatePath(invitation.path);
    return Response.json({ received: true });
  } catch {
    console.error("Unable to fulfill invitation payment");
    return Response.json({ error: "Unable to fulfill payment" }, { status: 500 });
  }
}
