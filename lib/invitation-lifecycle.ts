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

export function draftDeletionDate(event: Pick<TermEvent, "paidAt" | "complimentaryAt" | "isExample" | "status"> & { draftLastSavedAt?: Date | null }) {
  if (event.isExample || event.paidAt || event.complimentaryAt || !["DRAFT", "PENDING_PAYMENT"].includes(event.status) || !event.draftLastSavedAt) return null;
  return addCalendarMonths(event.draftLastSavedAt, 6);
}

// Compare only persisted values being saved. Object key order is not a change.
export function savedContentChanged(previous: object, changes: object): boolean {
  const normalize = (value: unknown): unknown => {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, normalize(item)]));
    return value ?? null;
  };
  return Object.entries(changes).some(([key, value]) => JSON.stringify(normalize((previous as Record<string, unknown>)[key])) !== JSON.stringify(normalize(value)));
}
