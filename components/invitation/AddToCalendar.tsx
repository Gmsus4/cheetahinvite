"use client";

import { FiCalendar } from "react-icons/fi";
import { invitationCalendarUrl } from "@/lib/invitation-calendar";

export function AddToCalendar(props: Parameters<typeof invitationCalendarUrl>[0]) {
  const href = invitationCalendarUrl(props);
  if (!href) return null;
  return <a className="wa-button" href={href} target="_blank" rel="noopener noreferrer"><FiCalendar aria-hidden="true" />Agregar al calendario</a>;
}
