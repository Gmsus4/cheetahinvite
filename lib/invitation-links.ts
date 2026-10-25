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
