import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { getStripe } from "@/lib/stripe";
import { fulfillInvitationPayment } from "@/lib/payment-fulfillment";

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
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return Response.json({ received: true });
  const session = event.data.object as Stripe.Checkout.Session;
  if (event.livemode !== session.livemode) return Response.json({ received: true });
  try {
    const invitation = await fulfillInvitationPayment(session, new Date(event.created * 1000));
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
