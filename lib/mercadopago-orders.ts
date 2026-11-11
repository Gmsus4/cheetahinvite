import { minorUnits } from "@/lib/payment-amount";

type OrderTransaction = {
  id: string; amount: string; paid_amount?: string; status: string; status_detail?: string;
};
export type MercadoPagoOrder = {
  id: string; type: string; processing_mode: string; external_reference: string;
  status: string; status_detail: string; total_amount: string; total_paid_amount: string;
  currency: string; live_mode?: boolean; created_date: string;
  transactions?: {
    payments?: OrderTransaction[];
    refunds?: { id: string; transaction_id: string; amount: string; status: string }[];
    chargebacks?: { id: string; transaction_id: string; status: string }[];
  };
};

// Preferences IDs are numeric/UUID-based; Orders IDs have the ORD namespace.
export function isMercadoPagoOrderId(id: string) {
  return /^ORD[A-Z0-9]+$/.test(id);
}

export function validateMercadoPagoOrder(order: MercadoPagoOrder, id: string, payment: {
  id: string; amount: number; currency: string; livemode: boolean;
}) {
  // Orders do not consistently return live_mode. Sandbox Orders use ORDTST.
  const live = order.live_mode ?? !order.id?.startsWith("ORDTST");
  if (!isMercadoPagoOrderId(id) || order.id !== id || order.external_reference !== payment.id
    || order.type !== "online" || order.processing_mode !== "manual" || live !== payment.livemode
    || order.currency?.toLowerCase() !== payment.currency || minorUnits(order.total_amount) !== payment.amount
    || minorUnits(order.total_paid_amount) > payment.amount) {
    throw new Error("Mercado Pago order purchase mismatch");
  }
}

export function mercadoPagoOrderSettlement(order: MercadoPagoOrder, amount: number) {
  const paid = (order.status === "processed" && ["accredited", "partially_refunded"].includes(order.status_detail))
    || ["refunded", "charged_back"].includes(order.status);
  const failed = ["failed", "canceled"].includes(order.status);
  const refunds: { id: string; amount: number; status: string }[] = [];
  const disputes: { id: string; status: string }[] = [];
  if (!paid) return { paid, failed, identity: `mercadopago:${order.id}`, paidAt: null, refundedAmount: 0, refundPendingAmount: 0, disputeStatus: null, refunds, disputes };
  const transactions = (order.transactions?.payments ?? []).filter(item => ["processed", "refunded", "charged_back"].includes(item.status));
  if (transactions.length !== 1) throw new Error("Mercado Pago settled transaction unavailable");
  const transaction = transactions[0];
  if (!/^PAY[A-Z0-9]+$/.test(transaction.id) || minorUnits(transaction.amount) !== amount
    || (transaction.paid_amount !== undefined && minorUnits(transaction.paid_amount) !== amount)
    || minorUnits(order.total_paid_amount) !== amount) throw new Error("Mercado Pago settled amount mismatch");
  let refundedAmount = 0, refundPendingAmount = 0;
  const seen = new Set<string>();
  for (const refund of order.transactions?.refunds ?? []) {
    if (!refund.id || seen.has(refund.id) || refund.transaction_id !== transaction.id) throw new Error("Mercado Pago refund purchase mismatch");
    seen.add(refund.id);
    const value = minorUnits(refund.amount);
    refunds.push({ id: refund.id, amount: value, status: refund.status });
    if (refund.status === "processed") refundedAmount += value;
    else if (!["failed", "canceled"].includes(refund.status)) refundPendingAmount += value;
  }
  if (order.status === "refunded") refundedAmount = amount;
  if (refundedAmount + refundPendingAmount > amount || (order.status_detail === "partially_refunded" && !refundedAmount)) throw new Error("Mercado Pago refund amount mismatch");
  for (const dispute of order.transactions?.chargebacks ?? []) {
    if (!dispute.id || dispute.transaction_id !== transaction.id) throw new Error("Mercado Pago chargeback purchase mismatch");
    disputes.push({ id: dispute.id, status: dispute.status === "settled" ? "lost" : "under_review" });
  }
  const disputeStatus = order.status === "charged_back" || disputes.some(item => item.status === "lost") ? "lost" : disputes.length ? "under_review" : null;
  // Orders expose creation, not capture time. Anchor the term to that immutable
  // provider timestamp, so a refund notification cannot extend the purchase.
  return { paid, failed, identity: `mercadopago:${transaction.id}`, paidAt: new Date(order.created_date), refundedAmount, refundPendingAmount, disputeStatus, refunds, disputes };
}
