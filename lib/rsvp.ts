export const RSVP_LIMITS = { companions: 10, nameLength: 120, bodyBytes: 2048, submissionsPerHour: 500, updatesPerHour: 20, responsesPerEvent: 10000 } as const;
export const validCompanionLimit = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= RSVP_LIMITS.companions;
// Existing invitations retain their previous allowance until explicitly changed.
export const rsvpCompanionLimit = (value: unknown) => validCompanionLimit(value) ? value : 5;
export function eventCompanionLimit(sections: unknown) {
  return rsvpCompanionLimit(Array.isArray(sections) ? sections.find(section => section?.type === "rsvp" && section.enabled)?.maxCompanions : undefined);
}
export type RsvpValues = { name: string; attending: boolean; companions: number };
export const validRsvpToken = (token: unknown): token is string => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

export function hasIntegratedRsvp(sections: unknown) {
  return Array.isArray(sections) && sections.some(section => section && section.type === "rsvp" && section.enabled === true && section.rsvpMode === "integrated");
}
export function parseRsvp(value: unknown): (RsvpValues & { token: string }) | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.name !== "string" || typeof data.attending !== "boolean" || typeof data.companions !== "number"
    || !Number.isInteger(data.companions) || data.companions < 0 || data.companions > RSVP_LIMITS.companions
    || (!data.attending && data.companions !== 0) || !validRsvpToken(data.token) || data.website) return null;
  const name = data.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > RSVP_LIMITS.nameLength || /[\u0000-\u001f\u007f]/.test(data.name)) return null;
  return { name, attending: data.attending, companions: data.companions, token: data.token };
}
export function rsvpCsv(rows: RsvpValues[]) {
  const cell = (value: string) => `"${(/^[=+\-@\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
  return "\uFEFF" + [["Nombre", "Asistencia", "Acompañantes extra", "Total de asistentes"], ...rows.map(row => [row.name, row.attending ? "Sí" : "No", String(row.companions), String(row.attending ? 1 + row.companions : 0)])].map(row => row.map(cell).join(",")).join("\r\n");
}
