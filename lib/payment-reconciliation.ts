import "server-only";
import { prisma } from "@/prisma";
import { reconcileInvitationPayment } from "@/lib/payment-fulfillment";
import { reconcileExternalPayment } from "@/lib/external-payment-fulfillment";

export async function reconcilePurchase(paymentId: string, minimumAgeMs = 0) {
  const payment = await prisma.invitationPayment.findUnique({ where: { id: paymentId } });
  return payment?.provider && payment.provider !== "stripe"
    ? reconcileExternalPayment(paymentId, minimumAgeMs) : reconcileInvitationPayment(paymentId, minimumAgeMs);
}
