export type PublicationResponses = "integrated" | "whatsapp" | "external" | "off";

export function publicationResponses(sections: unknown): PublicationResponses {
  if (!Array.isArray(sections)) return "off";
  const section = sections.find(item => item?.type === "rsvp" && item.enabled === true);
  if (!section) return "off";
  if (section.rsvpMode === "integrated") return "integrated";
  if (section.whatsappPhone) return "whatsapp";
  try {
    const host = new URL(section.link).hostname;
    if (["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(host)) return "whatsapp";
  } catch { /* An unconfigured external block still receives explanatory copy. */ }
  return "external";
}

export function invitationShareMessage(name: string, url: string) {
  return `¡Nos encantará celebrar contigo! Te compartimos nuestra invitación a ${name}:\n${url}`;
}
