import "server-only";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentPrice } from "@/lib/site-pricing";
import { eventPublicationIssues } from "@/lib/guided-invitation";
import { canRenewInvitation, invitationLifecycle } from "@/lib/invitation-lifecycle";
import { mercadoPagoRequest, paypalRequest, providerLiveMode, type PaymentProvider } from "@/lib/payment-providers";

export async function prepareExternalCheckout(eventId: string, ownerId: string, provider: Exclude<PaymentProvider, "stripe">) {
  const price = await getCurrentPrice();
  // Serialize preference/order creation too: Mercado Pago preferences do not
  // promise create idempotency. A lost response is safe: no URL was delivered.
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} AND "ownerId" = ${ownerId} FOR UPDATE`);
    const event = await tx.event.findFirst({ where: { id: eventId, ownerId } });
    if (!event || event.isExample) return null;
    const renewal = canRenewInvitation(event);
    if ((event.paidAt || event.complimentaryAt) && !renewal) return null;
    if (eventPublicationIssues(event).length) throw new Error("Complete the invitation before checkout");
    const renewalOfPaymentIntentId = renewal ? event.stripePaymentIntentId : null;
    let payment = await tx.invitationPayment.findFirst({ where: { eventId, ownerId, provider, status: "PENDING", renewalOfPaymentIntentId }, orderBy: { createdAt: "desc" } });
    if (payment && payment.livemode !== providerLiveMode(provider)) throw new Error("Checkout environment mismatch");
    if (payment?.checkoutUrl && payment.checkoutExpiresAt > new Date()) return payment.checkoutUrl;
    if (payment) await tx.invitationPayment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
    const checkoutExpiresAt = new Date(Math.min(Date.now() + 60 * 60 * 1000, renewal ? invitationLifecycle(event)!.deletesAt.getTime() : Infinity));
    if (checkoutExpiresAt.getTime() < Date.now() + 31 * 60 * 1000) throw new Error("Renewal checkout window has closed");
    payment = await tx.invitationPayment.create({ data: { eventId, ownerId, provider, eventName: event.name, amount: price.amount, currency: price.currency, livemode: providerLiveMode(provider), renewalOfPaymentIntentId, checkoutExpiresAt } });
    const origin = new URL(process.env.APP_URL!).origin;
    const back = `${origin}/dashboard/eventos/${eventId}/pago`;
    let id: string, url: string;
    if (provider === "paypal") {
      const order = await paypalRequest("/v2/checkout/orders", {
        intent: "CAPTURE", purchase_units: [{ reference_id: payment.id, custom_id: payment.id, description: "Invitación digital · 12 meses", amount: { currency_code: payment.currency.toUpperCase(), value: (payment.amount / 100).toFixed(2) } }],
        payment_source: { paypal: { experience_context: { landing_page: "LOGIN", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: `${back}?payment=received&provider=paypal`, cancel_url: `${back}?payment=cancelled` } } },
      }, payment.id);
      id = String(order.id); url = order.links?.find((link: { rel: string }) => ["payer-action", "approve"].includes(link.rel))?.href;
    } else {
      const preference = await mercadoPagoRequest("/checkout/preferences", {
        external_reference: payment.id, metadata: { payment_id: payment.id },
        items: [{ id: payment.id, title: "Invitación digital · 12 meses", quantity: 1, currency_id: payment.currency.toUpperCase(), unit_price: payment.amount / 100 }],
        back_urls: { success: `${back}?payment=received&provider=mercadopago`, pending: `${back}?payment=received&provider=mercadopago`, failure: `${back}?payment=cancelled` },
        ...(origin.startsWith("https:") ? { auto_return: "approved" } : {}),
        notification_url: `${origin}/api/mercadopago/webhook`, expires: true, expiration_date_to: checkoutExpiresAt.toISOString(),
        // Cash vouchers are offered through Stripe so expiry and instructions
        // have one consistent flow.
        payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },
      });
      id = String(preference.id); url = payment.livemode ? preference.init_point : preference.sandbox_init_point;
    }
    const target = new URL(url);
    const validHost = provider === "paypal" ? /(^|\.)paypal\.com$/ : /(^|\.)mercadopago\.com(\.mx)?$/;
    if (target.protocol !== "https:" || !validHost.test(target.hostname) || !id || id === "undefined") throw new Error("Invalid checkout response");
    await tx.invitationPayment.update({ where: { id: payment.id }, data: { providerCheckoutId: `${provider}:${id}`, checkoutUrl: url } });
    if (!renewal) await tx.event.updateMany({ where: { id: eventId, ownerId, paidAt: null, complimentaryAt: null }, data: { status: "PENDING_PAYMENT" } });
    return url;
  }, { timeout: 45000, maxWait: 10000 });
}
