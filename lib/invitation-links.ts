export function invitationExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function invitationLinkLabel(type: string): string {
  switch (type) {
    case "rsvp": return "Confirmar asistencia";
    case "gifts": return "Consultar mesa de regalos";
    case "gallery": return "Ver galería";
    case "music": return "Escuchar playlist";
    case "ceremony": case "reception": return "Abrir mapa";
    default: return "Ver más información";
  }
}

export function invitationMapUrl(venue: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, address].filter(Boolean).join(", "))}`;
}

export function invitationSectionUrl(type: string, value: string): string | null {
  const input = value.trim();
  const external = invitationExternalUrl(input);
  if (external || !input || (type !== "ceremony" && type !== "reception")) return external;
  // Accept pasted Maps links without a scheme, too.
  if (/^(?:www\.)?google\.[a-z.]+\/maps(?:[/?#]|$)|^maps\.google\.[a-z.]+\/|^maps\.app\.goo\.gl\/|^goo\.gl\/maps\//i.test(input)) {
    return invitationExternalUrl(`https://${input}`);
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith("//")) return null;
  return invitationMapUrl("", input);
}
