const DAY = 86_400_000;

type TermEvent = {
  paidAt: Date | null;
  complimentaryAt?: Date | null;
  expiresAt?: Date | null;
  isExample?: boolean;
  status: string;
  stripePaymentIntentId?: string | null;
};

// Calendar arithmetic clamps leap days and month ends instead of overflowing.
export function addCalendarMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function invitationLifecycle(event: TermEvent, now = new Date()) {
  const startedAt = event.paidAt ?? event.complimentaryAt;
  if (event.isExample || !startedAt || !event.expiresAt) return null;
  const expiresAt = event.expiresAt;
  const deletesAt = addCalendarMonths(expiresAt, 1);
  const phase = now < expiresAt ? "active" : now < deletesAt ? "archived" : "deletion_due";
  const totalDays = Math.ceil((expiresAt.getTime() - startedAt.getTime()) / DAY);
  return {
    phase, startedAt, expiresAt, deletesAt, totalDays,
    elapsedDays: Math.max(0, Math.min(totalDays, Math.floor((now.getTime() - startedAt.getTime()) / DAY))),
    remainingDays: Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY)),
    archiveDaysRemaining: Math.max(0, Math.ceil((deletesAt.getTime() - now.getTime()) / DAY)),
  };
}

export function canRenewInvitation(event: TermEvent, now = new Date()) {
  return Boolean(event.paidAt && event.stripePaymentIntentId
    && ["PUBLISHED", "EXPIRED", "ARCHIVED"].includes(event.status)
    && invitationLifecycle(event, now)?.phase === "archived");
}

export function canEditInvitation(event: TermEvent, now = new Date()) {
  if (event.isExample) return true;
  if (["ARCHIVED", "EXPIRED", "SUSPENDED", "REFUNDED"].includes(event.status)) return false;
  if (!event.paidAt && !event.complimentaryAt) return true;
  return Boolean(event.expiresAt && event.expiresAt > now);
}
