import { prisma } from "@/prisma";
import { mercadoPagoRequest, paymentProviderConfigured } from "@/lib/payment-providers";
import { validMercadoPagoSignature } from "@/lib/mercadopago-signature";
import { reconcileExternalPayment } from "@/lib/external-payment-fulfillment";
import { invalidatePayment } from "@/lib/payment-invalidation";

export async function POST(request: Request) {
  if (!paymentProviderConfigured("mercadopago")) return Response.json({ error: "Unavailable" }, { status: 503 });
  if (!validMercadoPagoSignature(request, process.env.MERCADOPAGO_WEBHOOK_SECRET!)) return Response.json({ error: "Invalid signature" }, { status: 401 });
  const query = new URL(request.url).searchParams;
  // Only payment notifications are enabled for this endpoint.
  if (query.get("type") && query.get("type") !== "payment") return Response.json({ received: true });
  try {
    const remote = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(query.get("data.id")!)}`);
    if (typeof remote.external_reference !== "string") return Response.json({ received: true });
    const payment = await prisma.invitationPayment.findUnique({ where: { id: remote.external_reference } });
    if (payment?.provider === "mercadopago") invalidatePayment(await reconcileExternalPayment(payment.id, 0, { mercadoPagoPaymentId: String(remote.id) }));
    return Response.json({ received: true });
  } catch {
    console.error("Unable to reconcile Mercado Pago notification");
    return Response.json({ error: "Unable to verify payment" }, { status: 500 });
  }
}
