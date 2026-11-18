import "server-only";
import { connection } from "next/server";
import { prisma } from "@/prisma";
import { INVITATION_PRICE } from "./invitation-payment";
import { paymentMoney } from "./payment-status";

export async function getCurrentPrice(now?: Date) {
  await connection();
  const revision = await prisma.priceRevision.findFirst({ where: { effectiveAt: { lte: now ?? new Date() }, cancelledAt: null }, orderBy: { effectiveAt: "desc" } });
  const price = revision ?? INVITATION_PRICE;
  return { id: revision?.id ?? "default", amount: price.amount, currency: price.currency, months: INVITATION_PRICE.months, label: paymentMoney(price.amount, price.currency) };
}
