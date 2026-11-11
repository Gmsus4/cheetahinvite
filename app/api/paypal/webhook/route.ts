import { prisma } from "@/prisma";
import { paypalRequest, paymentProviderConfigured } from "@/lib/payment-providers";
import { reconcileExternalPayment } from "@/lib/external-payment-fulfillment";
import { invalidatePayment } from "@/lib/payment-invalidation";
import { paypalRefundCaptureId } from "@/lib/paypal-references";

export async function POST(request: Request) {
  if (!paymentProviderConfigured("paypal")) return Response.json({ error: "Unavailable" }, { status: 503 });
  let event;
  try { event = JSON.parse(await request.text()); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const headers = ["paypal-auth-algo", "paypal-cert-url", "paypal-transmission-id", "paypal-transmission-sig", "paypal-transmission-time"];
  if (headers.some(header => !request.headers.get(header))) return Response.json({ error: "Missing signature" }, { status: 400 });
  try {
    const verification = await paypalRequest("/v1/notifications/verify-webhook-signature", {
      auth_algo: request.headers.get("paypal-auth-algo"), cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"), transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"), webhook_id: process.env.PAYPAL_WEBHOOK_ID, webhook_event: event,
    });
    if (verification.verification_status !== "SUCCESS") return Response.json({ error: "Invalid signature" }, { status: 400 });
    let payment;
    let paypalRefundId: string | undefined;
    const paypalApprovalReversed = event.event_type === "CHECKOUT.PAYMENT-APPROVAL.REVERSED";
    if (event.event_type === "CHECKOUT.ORDER.APPROVED" || event.event_type === "CHECKOUT.ORDER.COMPLETED") {
      payment = await prisma.invitationPayment.findUnique({ where: { providerCheckoutId: `paypal:${event.resource?.id}` } });
    } else if (paypalApprovalReversed) {
      payment = await prisma.invitationPayment.findUnique({ where: { providerCheckoutId: `paypal:${event.resource?.order_id}` } });
    } else if (["PAYMENT.CAPTURE.REFUNDED", "PAYMENT.REFUND.PENDING", "PAYMENT.REFUND.FAILED"].includes(event.event_type)) {
      if (typeof event.resource?.id !== "string") return Response.json({ error: "Missing refund ID" }, { status: 400 });
      const refund = await paypalRequest(`/v2/payments/refunds/${encodeURIComponent(event.resource.id)}`);
      const captureId = paypalRefundCaptureId(refund);
      paypalRefundId = event.resource.id;
      payment = await prisma.invitationPayment.findUnique({ where: { providerPaymentId: `paypal:${captureId}` } });
      if (!payment) {
        // A refund can arrive before the capture completion notification.
        const capture = await paypalRequest(`/v2/payments/captures/${encodeURIComponent(captureId)}`);
        const orderId = capture.supplementary_data?.related_ids?.order_id;
        if (typeof orderId === "string") payment = await prisma.invitationPayment.findUnique({ where: { providerCheckoutId: `paypal:${orderId}` } });
      }
    } else if (String(event.event_type).startsWith("PAYMENT.CAPTURE.")) {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
      const captureId = event.resource?.supplementary_data?.related_ids?.capture_id ?? event.resource?.id;
      payment = orderId ? await prisma.invitationPayment.findUnique({ where: { providerCheckoutId: `paypal:${orderId}` } })
        : await prisma.invitationPayment.findUnique({ where: { providerPaymentId: `paypal:${captureId}` } });
    } else if (String(event.event_type).startsWith("CUSTOMER.DISPUTE.")) {
      const dispute = await paypalRequest(`/v1/customer/disputes/${encodeURIComponent(event.resource?.dispute_id)}`);
      for (const transaction of dispute.disputed_transactions ?? []) {
        const purchase = await prisma.invitationPayment.findUnique({ where: { providerPaymentId: `paypal:${transaction.seller_transaction_id}` } });
        if (!purchase || purchase.provider !== "paypal") continue;
        invalidatePayment(await reconcileExternalPayment(purchase.id, 0, { paypalDisputeId: dispute.dispute_id }));
      }
    }
    if (payment?.provider === "paypal") invalidatePayment(await reconcileExternalPayment(payment.id, 0, { paypalRefundId, paypalApprovalReversed }));
    return Response.json({ received: true });
  } catch {
    console.error("Unable to reconcile PayPal notification");
    return Response.json({ error: "Unable to verify payment" }, { status: 500 });
  }
}
