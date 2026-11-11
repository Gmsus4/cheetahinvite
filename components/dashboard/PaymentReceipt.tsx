import { isPreviousPriceAttempt, paymentMoney, paymentStatusLabel, type PaymentSummary } from "@/lib/payment-status";

type Receipt = PaymentSummary & {
  id: string; provider?: string; currency: string; paidAt: Date | null; expiresAt: Date | null; livemode: boolean; lastSyncedAt: Date | null;
};
const date = (value: Date) => new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }).format(value);

export function PaymentReceipt({ payment }: { payment: Receipt }) {
  const label = isPreviousPriceAttempt(payment) ? "Intento pendiente · precio anterior" : paymentStatusLabel(payment);
  const tone = payment.status === "EXPIRED" || payment.status === "FAILED" ? "negative" : payment.status === "PENDING" ? "warning" : label === "Pago confirmado" ? "positive" : "neutral";
  return <section className="payment-receipt" aria-label="Detalle de la compra">
    <p className="payment-receipt-state" data-tone={tone}>{label}{!payment.livemode && (!payment.id.startsWith("legacy:") || payment.lastSyncedAt) && <small> · Modo de prueba</small>}</p>
    <dl>
      <div><dt>Proveedor</dt><dd>{payment.provider === "paypal" ? "PayPal" : payment.provider === "mercadopago" ? "Mercado Pago" : "Stripe"}</dd></div>
      <div><dt>{payment.status === "PENDING" ? "Importe del intento" : "Importe"}</dt><dd>{paymentMoney(payment.amount, payment.currency)} {payment.currency.toUpperCase()}</dd></div>
      {payment.paidAt && <div><dt>Pago confirmado</dt><dd>{date(payment.paidAt)}</dd></div>}
      {payment.expiresAt && <div><dt>Vigencia original hasta</dt><dd>{date(payment.expiresAt)}</dd></div>}
      {payment.refundedAmount > 0 && <div><dt>Reembolsado</dt><dd>{paymentMoney(payment.refundedAmount, payment.currency)}</dd></div>}
      {payment.refundPendingAmount > 0 && <div><dt>Reembolso en proceso</dt><dd>{paymentMoney(payment.refundPendingAmount, payment.currency)}</dd></div>}
      <div><dt>Referencia de compra</dt><dd>{payment.id}</dd></div>
    </dl>
    {payment.lastSyncedAt && <small>Última verificación: {date(payment.lastSyncedAt)}</small>}
  </section>;
}
