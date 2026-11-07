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
    case "location": return "Cómo llegar";
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

export function invitationLocationUrl(venue: string, address: string, link = ""): string | null {
  const exact = invitationExternalUrl(link.trim());
  if (exact) return exact;
  if (address.trim()) return invitationMapUrl("", address.trim());
  return venue.trim() ? invitationMapUrl(venue.trim(), "") : null;
}

export function invitationGoogleMapsUrl(value: string): string | null {
  const input = value.trim();
  const external = invitationExternalUrl(input);
  if (!external) return null;
  const url = new URL(external);
  return url.hostname === "maps.app.goo.gl" || (url.hostname === "goo.gl" && url.pathname.startsWith("/maps/"))
    || (/^(?:www\.|maps\.)?google\.[a-z.]+$/.test(url.hostname) && (url.hostname.startsWith("maps.") || url.pathname.startsWith("/maps"))) ? external : null;
}

export function invitationSectionUrl(type: string, value: string): string | null {
  const input = value.trim();
  const external = invitationExternalUrl(input);
  if (external || !input || (type !== "location" && type !== "ceremony" && type !== "reception")) return external;
  // Accept pasted Maps links without a scheme, too.
  if (/^(?:www\.)?google\.[a-z.]+\/maps(?:[/?#]|$)|^maps\.google\.[a-z.]+\/|^maps\.app\.goo\.gl\/|^goo\.gl\/maps\//i.test(input)) {
    return invitationExternalUrl(`https://${input}`);
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith("//")) return null;
  return invitationMapUrl("", input);
}
