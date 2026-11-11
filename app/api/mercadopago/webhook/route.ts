import { prisma } from "@/prisma";
import { mercadoPagoRequest, paymentProviderConfigured } from "@/lib/payment-providers";
import { validMercadoPagoSignature } from "@/lib/mercadopago-signature";
import { reconcileExternalPayment } from "@/lib/external-payment-fulfillment";
import { invalidatePayment } from "@/lib/payment-invalidation";
import { isMercadoPagoOrderId } from "@/lib/mercadopago-orders";

export async function POST(request: Request) {
  if (!paymentProviderConfigured("mercadopago")) return Response.json({ error: "Unavailable" }, { status: 503 });
  if (!validMercadoPagoSignature(request, process.env.MERCADOPAGO_WEBHOOK_SECRET!)) return Response.json({ error: "Invalid signature" }, { status: 401 });
  const query = new URL(request.url).searchParams;
  // Orders are used by new checkouts; payment remains for historical Preferences.
  const type = query.get("type");
  if (type && !["order", "orders_v2", "payment"].includes(type)) return Response.json({ received: true });
  try {
    const id = query.get("data.id")!;
    const order = isMercadoPagoOrderId(id);
    if ((type === "payment" && order) || (["order", "orders_v2"].includes(type ?? "") && !order)) return Response.json({ error: "Invalid resource" }, { status: 400 });
    const remote = await mercadoPagoRequest(`/v1/${order ? "orders" : "payments"}/${encodeURIComponent(id)}`);
    if (String(remote.id) !== id) throw new Error("Notification resource mismatch");
    if (typeof remote.external_reference !== "string") return Response.json({ received: true });
    const payment = await prisma.invitationPayment.findUnique({ where: { id: remote.external_reference } });
    if (payment?.provider === "mercadopago") {
      if (order && payment.providerCheckoutId !== `mercadopago:${id}`) throw new Error("Notification purchase mismatch");
      invalidatePayment(await reconcileExternalPayment(payment.id, 0, order ? {} : { mercadoPagoPaymentId: id }));
    }
    return Response.json({ received: true });
  } catch {
    console.error("Unable to reconcile Mercado Pago notification");
    return Response.json({ error: "Unable to verify payment" }, { status: 500 });
  }
}
