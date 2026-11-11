import "server-only";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { applyPaymentToInvitation } from "@/lib/payment-fulfillment";
import { invitationLinkRegistryReady } from "@/lib/invitation-link-storage";
import { addCalendarMonths } from "@/lib/invitation-lifecycle";
import { mercadoPagoRequest, mercadoPagoPaymentEnvironmentMatches, paypalRequest, providerLiveMode, isPaymentProvider } from "@/lib/payment-providers";
import { paypalRefundCaptureId } from "@/lib/paypal-references";
import { minorUnits } from "@/lib/payment-amount";
import { isMercadoPagoOrderId, validateMercadoPagoOrder, mercadoPagoOrderSettlement } from "@/lib/mercadopago-orders";

export async function reconcileExternalPayment(paymentId: string, minimumAgeMs = 0, notification: {
  paypalDisputeId?: string; paypalRefundId?: string; paypalApprovalReversed?: boolean; mercadoPagoPaymentId?: string;
} = {}) {
  const registryReady = await invitationLinkRegistryReady(prisma);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${paymentId}, 0))`);
    const payment = await tx.invitationPayment.findUnique({ where: { id: paymentId } });
    if (!payment || !isPaymentProvider(payment.provider) || payment.provider === "stripe" || !payment.providerCheckoutId) return null;
    if (payment.livemode !== providerLiveMode(payment.provider)) throw new Error("Payment environment mismatch");
    if (minimumAgeMs && payment.lastSyncedAt && Date.now() - payment.lastSyncedAt.getTime() < minimumAgeMs) return null;
    const checkoutId = payment.providerCheckoutId.slice(payment.provider.length + 1);
    let paid = false, failed = false, identity: string | null = null, paidAt: Date | null = null;
    let refundedAmount = 0, refundPendingAmount = 0;
    let disputeStatus = payment.disputeStatus;
    const disputes: { id: string; status: string }[] = [];
    const refunds: { id: string; amount: number; status: string }[] = [];
    if (payment.provider === "paypal") {
      let order = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(checkoutId)}`);
      const unit = order.purchase_units?.[0];
      if (order.id !== checkoutId || order.purchase_units?.length !== 1 || unit?.custom_id !== payment.id || unit?.reference_id !== payment.id
        || minorUnits(unit?.amount?.value) !== payment.amount || unit?.amount?.currency_code?.toLowerCase() !== payment.currency) throw new Error("PayPal purchase mismatch");
      // Approval is not settlement. Capture only the server-stored order.
      if (order.status === "APPROVED" && payment.checkoutExpiresAt > new Date()
        && payment.status !== "FAILED" && !notification.paypalApprovalReversed) {
        await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(checkoutId)}/capture`, {}, `capture-${payment.id}`);
        order = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(checkoutId)}`);
      }
      const captures = order.purchase_units?.[0]?.payments?.captures ?? [];
      if (captures.length > 1) throw new Error("Unexpected multiple captures");
      if (captures.length === 1) {
        const capture = await paypalRequest(`/v2/payments/captures/${encodeURIComponent(captures[0].id)}`);
        if (minorUnits(capture.amount?.value) !== payment.amount || capture.amount?.currency_code?.toLowerCase() !== payment.currency
          || capture.supplementary_data?.related_ids?.order_id !== checkoutId) throw new Error("PayPal capture mismatch");
        paid = ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(capture.status);
        identity = `paypal:${capture.id}`;
        paidAt = new Date(capture.create_time);
        refundedAmount = capture.status === "REFUNDED" ? payment.amount : 0;
        // Refund notifications carry a refund ID, not a capture ID. Retain
        // references so later reconciliations can recover pending/failed changes
        // even when the order response omits its refund collection.
        const refundIds = new Set<string>();
        if (Array.isArray(payment.refunds)) for (const entry of payment.refunds) {
          if (entry && typeof entry === "object" && !Array.isArray(entry) && typeof entry.id === "string") refundIds.add(entry.id);
        }
        for (const refund of order.purchase_units?.[0]?.payments?.refunds ?? []) {
          if (typeof refund.id !== "string") throw new Error("Refund identity missing");
          refundIds.add(refund.id);
        }
        if (notification.paypalRefundId) refundIds.add(notification.paypalRefundId);
        if (refundIds.size > 1000) throw new Error("Refund reconciliation limit exceeded");
        for (const id of refundIds) {
          const refund = await paypalRequest(`/v2/payments/refunds/${encodeURIComponent(id)}`);
          if (refund.id !== id || paypalRefundCaptureId(refund) !== capture.id
            || refund.amount?.currency_code?.toLowerCase() !== payment.currency) throw new Error("PayPal refund purchase mismatch");
          const amount = minorUnits(refund.amount.value);
          refunds.push({ id, amount, status: refund.status });
          if (refund.status === "COMPLETED" && capture.status !== "REFUNDED") refundedAmount += amount;
          if (refund.status === "PENDING") refundPendingAmount += amount;
        }
        if (refundedAmount + refundPendingAmount > payment.amount) throw new Error("PayPal refund amount mismatch");
        // A partial refund must never appear as no refund if the order API
        // omits its details. Retry the notification rather than lose history.
        if (capture.status === "PARTIALLY_REFUNDED" && !refundedAmount) throw new Error("PayPal refund details unavailable");
        failed = ["DECLINED", "FAILED"].includes(capture.status);
      }
      failed ||= order.status === "VOIDED";
      // A verified reversal cancels an uncaptured approval. Persist FAILED so
      // an older approval notification or a manual refresh cannot capture it.
      failed ||= !captures.length && (notification.paypalApprovalReversed === true || payment.status === "FAILED");
      const ids = new Set<string>();
      if (Array.isArray(payment.disputes)) for (const entry of payment.disputes) {
        if (entry && typeof entry === "object" && !Array.isArray(entry) && typeof entry.id === "string") ids.add(entry.id);
      }
      if (notification.paypalDisputeId) ids.add(notification.paypalDisputeId);
      for (const id of ids) {
        const dispute = await paypalRequest(`/v1/customer/disputes/${encodeURIComponent(id)}`);
        if (!dispute.disputed_transactions?.some((item: { seller_transaction_id: string }) => `paypal:${item.seller_transaction_id}` === identity)) throw new Error("Dispute purchase mismatch");
        const won = dispute.status === "RESOLVED" && ["RESOLVED_SELLER_FAVOUR", "CANCELED_BY_BUYER"].includes(dispute.dispute_outcome?.outcome_code);
        disputes.push({ id, status: won ? "won" : dispute.status === "RESOLVED" ? "lost" : "under_review" });
      }
      disputeStatus = disputes.find(item => item.status === "lost")?.status ?? disputes.find(item => item.status !== "won")?.status ?? disputes[0]?.status ?? null;
    } else if (isMercadoPagoOrderId(checkoutId)) {
      const order = await mercadoPagoRequest(`/v1/orders/${encodeURIComponent(checkoutId)}`);
      validateMercadoPagoOrder(order, checkoutId, payment);
      const settlement = mercadoPagoOrderSettlement(order, payment.amount);
      ({ paid, failed, identity, paidAt, refundedAmount, refundPendingAmount, disputeStatus } = settlement);
      refunds.push(...settlement.refunds); disputes.push(...settlement.disputes);
    } else {
      const existingId = payment.providerPaymentId?.slice("mercadopago:".length) ?? notification.mercadoPagoPaymentId;
      const results = existingId ? [await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(existingId)}`)]
        : (await mercadoPagoRequest(`/v1/payments/search?external_reference=${encodeURIComponent(payment.id)}&sort=date_created&criteria=desc&limit=100`)).results ?? [];
      // Prefer an approved charge over a newer declined retry.
      const remote = results.find((item: { status: string }) => ["approved", "refunded", "charged_back"].includes(item.status)) ?? results[0];
      if (remote) {
        if (remote.external_reference !== payment.id
          || remote.currency_id?.toLowerCase() !== payment.currency || minorUnits(remote.transaction_amount) !== payment.amount
          || !await mercadoPagoPaymentEnvironmentMatches(remote, payment.livemode)) throw new Error("Mercado Pago purchase mismatch");
        paid = ["approved", "refunded", "charged_back"].includes(remote.status);
        failed = ["rejected", "cancelled"].includes(remote.status);
        identity = `mercadopago:${remote.id}`;
        paidAt = remote.date_approved ? new Date(remote.date_approved) : payment.paidAt;
        refundedAmount = minorUnits(remote.transaction_amount_refunded ?? 0);
        disputeStatus = remote.status === "charged_back" ? "lost" : remote.status === "approved" ? null : disputeStatus;
      }
    }
    if (!paid) {
      if (!payment.paidAt) await tx.invitationPayment.update({ where: { id: payment.id }, data: { status: failed ? "FAILED" : !identity && payment.checkoutExpiresAt <= new Date() ? "EXPIRED" : "PENDING", lastSyncedAt: new Date() } });
      return { paymentId, invitation: null };
    }
    if (!identity || !paidAt || !Number.isFinite(paidAt.getTime()) || (payment.providerPaymentId && payment.providerPaymentId !== identity)) throw new Error("Invalid payment identity or date");
    paidAt = payment.paidAt ?? paidAt;
    const expiresAt = payment.expiresAt ?? addCalendarMonths(paidAt, 12);
    const updated = await tx.invitationPayment.update({ where: { id: payment.id }, data: { status: "PAID", providerPaymentId: identity, paidAt, expiresAt, refundedAmount, refundPendingAmount, disputeStatus, ...(payment.provider === "paypal" || isMercadoPagoOrderId(checkoutId) ? { disputes, refunds } : {}), lastSyncedAt: new Date() } });
    return applyPaymentToInvitation(tx, updated, identity, null, registryReady);
  }, { timeout: 60000, maxWait: 10000 });
}
