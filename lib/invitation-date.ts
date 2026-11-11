import { addCalendarMonths } from "./invitation-lifecycle";

// Event wall time uses UTC−6, independently of the viewer's time zone.
export function invitationTimestamp(date: string, time = "00:00") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const target = Date.parse(date + "T" + time + ":00-06:00");
  if (!Number.isFinite(target) || new Date(target - 6 * 3600000).toISOString().slice(0, 10) !== date) return NaN;
  return target;
}

export function celebrationExceedsTerm(date: string, time: string, expiresAt: Date | string | null | undefined, now: Date) {
  const expiry = expiresAt ? new Date(expiresAt) : addCalendarMonths(now, 12);
  return invitationTimestamp(date, time || "00:00") >= expiry.getTime();
}
