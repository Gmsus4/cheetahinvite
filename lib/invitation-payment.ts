export const INVITATION_PRICE = { amount: 49900, currency: "mxn", months: 12 } as const;
export const invitationPriceLabel = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(INVITATION_PRICE.amount / 100);

export function isInvitationPublished(event: { status: string; paidAt: Date | null; expiresAt: Date | null; slug: string | null }, now = new Date()) {
  return event.status === "PUBLISHED" && Boolean(event.paidAt && event.slug && event.expiresAt && event.expiresAt > now);
}
