export type ProgramActivity = { time: string; activity: string };

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
