export const INVITATION_PRICE = { amount: 26900, currency: "mxn", months: 12 } as const;
export const invitationPriceLabel = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(INVITATION_PRICE.amount / 100);

export function hasPublicationGrant(event: { paidAt: Date | null; complimentaryAt?: Date | null }) {
  return Boolean(event.paidAt || event.complimentaryAt);
}

export function isInvitationPublished(event: { status: string; paidAt: Date | null; complimentaryAt?: Date | null; expiresAt: Date | null; slug: string | null }, now = new Date()) {
  return event.status === "PUBLISHED" && Boolean(hasPublicationGrant(event) && event.slug && event.expiresAt && event.expiresAt > now);
}
