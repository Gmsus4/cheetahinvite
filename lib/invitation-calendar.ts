import { invitationTimestamp } from "./invitation-date";
import { parseInvitationProgram } from "./invitation-program";
import type { InviteSection } from "./invitation-editor";

type CalendarEvent = { date: string; time?: string; name: string; venue: string; address: string; sections?: Pick<InviteSection, "type" | "enabled" | "content">[] };
const calendarStamp = (timestamp: number) => new Date(timestamp).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export function invitationCalendarUrl(event: CalendarEvent): string | null {
  const activities = event.sections?.filter(section => section.type === "program" && section.enabled)
    .flatMap(section => parseInvitationProgram(section.content))
    .filter(item => item.time && item.activity.trim()) ?? [];
  const time = activities[0]?.time || event.time;
  // Prefer the itinerary's first timed activity; keep the event's UTC-6 time zone.
  const timestamp = invitationTimestamp(event.date, time || "00:00");
  if (!Number.isFinite(timestamp)) return null;
  const start = time ? calendarStamp(timestamp) : event.date.replace(/-/g, "");
  let endTimestamp = timestamp;
  let dayOffset = 0;
  let previousTime = activities[0]?.time;
  for (const activity of activities.slice(1)) {
    // Times follow the displayed itinerary order, including midnight crossings.
    if (activity.time < previousTime) dayOffset += 86400000;
    endTimestamp = invitationTimestamp(event.date, activity.time) + dayOffset;
    previousTime = activity.time;
  }
  const end = time ? calendarStamp(endTimestamp) : calendarStamp(timestamp + 86400000).slice(0, 8);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name.trim() || "Mi celebración",
    dates: `${start}/${end}`,
    location: [event.venue.trim(), event.address.trim()].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
