import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentPrice } from "@/lib/site-pricing";
import { eventPublicationIssues } from "@/lib/guided-invitation";
import { canRenewInvitation, invitationLifecycle } from "@/lib/invitation-lifecycle";
import { mercadoPagoRequest, paypalRequest, providerLiveMode, paymentCheckoutOrigin, type PaymentProvider } from "@/lib/payment-providers";
import { isMercadoPagoOrderId, validateMercadoPagoOrder, mercadoPagoOrderPaidAmount } from "@/lib/mercadopago-orders";

export async function prepareExternalCheckout(eventId: string, ownerId: string, provider: Exclude<PaymentProvider, "stripe">) {
  const price = await getCurrentPrice();
  const origin = paymentCheckoutOrigin();
  // Serialize checkout reservations across tabs before contacting the provider.
  return prisma.$transaction(async tx => {
    // Keep lock order consistent with reconciliation: purchase first, Event
    // second. Serialize reservations per event before discovering the attempt.
    const reservationKey = `checkout:${eventId}`;
    await tx.$queryRaw(Prisma.sql`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${reservationKey}, 0))`);
    const preview = await tx.event.findFirst({ where: { id: eventId, ownerId } });
    if (!preview) return null;
    const previousRenewal = canRenewInvitation(preview) ? preview.stripePaymentIntentId : null;
    let payment = await tx.invitationPayment.findFirst({ where: { eventId, ownerId, provider, status: "PENDING", renewalOfPaymentIntentId: previousRenewal }, orderBy: { createdAt: "desc" } });
    if (payment) {
      await tx.$queryRaw(Prisma.sql`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${payment.id}, 0))`);
      payment = await tx.invitationPayment.findUnique({ where: { id: payment.id } });
      if (payment?.status !== "PENDING") payment = null;
    }
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${eventId} AND "ownerId" = ${ownerId} FOR UPDATE`);
    const event = await tx.event.findFirst({ where: { id: eventId, ownerId } });
    if (!event || event.isExample) return null;
    const renewal = canRenewInvitation(event);
    if ((event.paidAt || event.complimentaryAt) && !renewal) return null;
    if (eventPublicationIssues(event).length) throw new Error("Complete the invitation before checkout");
    const renewalOfPaymentIntentId = renewal ? event.stripePaymentIntentId : null;
    if (payment?.renewalOfPaymentIntentId !== renewalOfPaymentIntentId) payment = null;
    if (payment && payment.livemode !== providerLiveMode(provider)) throw new Error("Checkout environment mismatch");
    if (payment?.checkoutUrl && payment.checkoutOrigin === origin && payment.checkoutExpiresAt > new Date()) return payment.checkoutUrl;
    if (payment?.providerCheckoutId) {
      const remoteId = payment.providerCheckoutId.slice(provider.length + 1);
      const received = `/dashboard/eventos/${eventId}/pago?payment=received`;
      if (provider === "paypal") {
        const order = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(remoteId)}`);
        const unit = order.purchase_units?.[0];
        if (order.id !== remoteId || unit?.custom_id !== payment.id || unit?.reference_id !== payment.id) throw new Error("PayPal purchase mismatch");
        if (order.status === "COMPLETED" || (order.status === "APPROVED" && payment.checkoutExpiresAt > new Date())
          || order.purchase_units?.some((item: { payments?: { captures?: unknown[] } }) => item.payments?.captures?.length)) return received;
        if (!["CREATED", "SAVED", "PAYER_ACTION_REQUIRED", "VOIDED", "APPROVED"].includes(order.status)) throw new Error("PayPal checkout state unavailable");
      } else if (isMercadoPagoOrderId(remoteId)) {
        let order = await mercadoPagoRequest(`/v1/orders/${encodeURIComponent(remoteId)}`);
        validateMercadoPagoOrder(order, remoteId, payment);
        if (!["created", "canceled"].includes(order.status) || mercadoPagoOrderPaidAmount(order) > 0) return received;
        if (order.status === "created") {
          // A concurrent payment may win the cancellation race. Never issue a
          // replacement unless a fresh provider read proves the old one closed.
          await mercadoPagoRequest(`/v1/orders/${encodeURIComponent(remoteId)}/cancel`, {}, undefined, randomUUID());
          order = await mercadoPagoRequest(`/v1/orders/${encodeURIComponent(remoteId)}`);
          validateMercadoPagoOrder(order, remoteId, payment);
          if (order.status !== "canceled" || mercadoPagoOrderPaidAmount(order) > 0) return received;
        }
      } else {
        const hasPaymentInProgress = async () => {
          const result = await mercadoPagoRequest(`/v1/payments/search?external_reference=${encodeURIComponent(payment!.id)}&limit=100`);
          if (!Array.isArray(result.results) || result.paging?.total > 100) throw new Error("Mercado Pago payment state unavailable");
          return result.results.some((item: { status: string }) => !["rejected", "cancelled"].includes(item.status));
        };
        if (await hasPaymentInProgress()) return received;
        // Close the preference before replacing a quote with another return URL.
        const closed = await mercadoPagoRequest(`/checkout/preferences/${encodeURIComponent(remoteId)}`, { expires: true, expiration_date_to: new Date().toISOString() }, "PUT");
        const expiresAt = Date.parse(closed.expiration_date_to);
        if (closed.expires !== true || !Number.isFinite(expiresAt) || expiresAt > Date.now()) throw new Error("Mercado Pago preference is still payable");
        if (await hasPaymentInProgress()) return received;
      }
    }
    if (payment) await tx.invitationPayment.update({ where: { id: payment.id }, data: { status: "EXPIRED", checkoutExpiresAt: new Date() } });
    const checkoutExpiresAt = new Date(Math.min(Date.now() + 60 * 60 * 1000, renewal ? invitationLifecycle(event)!.deletesAt.getTime() : Infinity));
    if (checkoutExpiresAt.getTime() < Date.now() + 31 * 60 * 1000) throw new Error("Renewal checkout window has closed");
    payment = await tx.invitationPayment.create({ data: { eventId, ownerId, provider, eventName: event.name, amount: price.amount, currency: price.currency, livemode: providerLiveMode(provider), renewalOfPaymentIntentId, checkoutExpiresAt, checkoutOrigin: origin } });
    const back = `${origin}/dashboard/eventos/${eventId}/pago`;
    let id: string, url: string;
    if (provider === "paypal") {
      const order = await paypalRequest("/v2/checkout/orders", {
        intent: "CAPTURE", purchase_units: [{ reference_id: payment.id, custom_id: payment.id, description: "Invitación digital · 12 meses", amount: { currency_code: payment.currency.toUpperCase(), value: (payment.amount / 100).toFixed(2) } }],
        payment_source: { paypal: { experience_context: { landing_page: "LOGIN", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: `${back}?payment=received&provider=paypal`, cancel_url: `${back}?payment=cancelled` } } },
      }, payment.id);
      id = String(order.id); url = order.links?.find((link: { rel: string }) => ["payer-action", "approve"].includes(link.rel))?.href;
    } else {
      const order = await mercadoPagoRequest("/v1/orders", {
        type: "online", processing_mode: "manual", capture_mode: "automatic",
        external_reference: payment.id, total_amount: (payment.amount / 100).toFixed(2),
        expiration_time: `PT${Math.floor((checkoutExpiresAt.getTime() - Date.now()) / 1000)}S`,
        items: [{ title: "Invitación digital · 12 meses", quantity: 1, unit_price: (payment.amount / 100).toFixed(2) }],
        config: {
          online: {
            success_url: `${back}?payment=received&provider=mercadopago`, pending_url: `${back}?payment=received&provider=mercadopago`, failure_url: `${back}?payment=cancelled`,
            ...(origin.startsWith("https:") ? { auto_return: "approved" } : {}), retries: { allowed: false },
          },
          // Cash vouchers use the OXXO flow in Stripe.
          payment_method: { not_allowed_types: ["ticket", "atm"] },
        },
      }, undefined, payment.id);
      id = String(order.id); url = order.checkout_url;
      validateMercadoPagoOrder(order, id, payment);
    }
    const target = new URL(url);
    const validHost = provider === "paypal" ? /(^|\.)paypal\.com$/ : /(^|\.)mercadopago\.com(\.mx)?$/;
    if (target.protocol !== "https:" || !validHost.test(target.hostname) || !id || id === "undefined") throw new Error("Invalid checkout response");
    await tx.invitationPayment.update({ where: { id: payment.id }, data: { providerCheckoutId: `${provider}:${id}`, checkoutUrl: url } });
    if (!renewal) await tx.event.updateMany({ where: { id: eventId, ownerId, paidAt: null, complimentaryAt: null }, data: { status: "PENDING_PAYMENT" } });
    return url;
  }, { timeout: 45000, maxWait: 10000 });
}
