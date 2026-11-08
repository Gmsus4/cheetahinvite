import { INVITATION_PRICE } from "./invitation-payment";

export type PaymentSummary = {
  status: string; amount: number; refundedAmount: number; refundPendingAmount: number; disputeStatus: string | null;
};

export function isPreviousPriceAttempt(payment: { status: string; amount: number; currency: string }, price: { amount: number; currency: string } = INVITATION_PRICE) {
  return payment.status === "PENDING" && (payment.amount !== price.amount || payment.currency !== price.currency);
}

export function paymentAccess(payment: PaymentSummary) {
  if (payment.refundedAmount >= payment.amount) return "REFUNDED" as const;
  if (payment.disputeStatus && !["won", "warning_closed"].includes(payment.disputeStatus)) return "SUSPENDED" as const;
  return "PUBLISHED" as const;
}

export function paymentStatusLabel(payment: PaymentSummary) {
  if (payment.status === "PENDING") return "Pendiente de pago";
  if (payment.status === "FAILED") return "Pago fallido";
  if (payment.status === "EXPIRED") return "Intento vencido";
  if (paymentAccess(payment) === "REFUNDED") return "Reembolso total";
  if (payment.disputeStatus === "lost") return "Disputa perdida · enlace suspendido";
  if (paymentAccess(payment) === "SUSPENDED") return "Disputa en curso · enlace suspendido";
  if (payment.refundPendingAmount) return "Reembolso en proceso";
  if (payment.refundedAmount) return "Reembolso parcial";
  if (payment.disputeStatus === "won") return "Disputa ganada";
  return "Pago confirmado";
}

export function paymentMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}
