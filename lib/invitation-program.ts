export type ProgramActivity = { time: string; activity: string };
export type ProgramTimeFormat = "24h" | "12h";

export function formatInvitationProgramTime(time: string, format: ProgramTimeFormat = "24h") {
  if (format !== "12h" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return time;
  const [hour, minute] = time.split(":");
  const value = Number(hour);
  return `${value % 12 || 12}:${minute} ${value < 12 ? "a. m." : "p. m."}`;
}

// Keep blank rows while editing and accept itineraries saved in the original text format.
export function parseInvitationProgram(content: string): ProgramActivity[] {
  return content.split(/\r?\n/).map(line => {
    const match = line.match(/^\s*(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?\s*[—–-]\s?(.*)$/i);
    if (!match) return { time: "", activity: line };
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour === 0)) return { time: "", activity: line };
    if (match[3]) hour = hour % 12 + (match[3].toLowerCase().startsWith("p") ? 12 : 0);
    return { time: `${String(hour).padStart(2, "0")}:${match[2]}`, activity: match[4] };
  });
}

export function serializeInvitationProgram(items: ProgramActivity[]): string {
  return items.map(item => item.time ? `${item.time} — ${item.activity}` : item.activity).join("\n");
}
