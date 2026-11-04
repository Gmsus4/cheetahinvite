import type { CSSProperties } from "react";
import type { InviteSection } from "./invitation-editor";
import { getInvitationFont } from "./invitation-fonts";
import { orderedWeddingSections, weddingArtwork, weddingPalette, type WeddingDesign } from "./wedding-designs";
import { invitationSectionUrl } from "./invitation-links";

export function atmosphereSections(sections: InviteSection[]) {
  const ordered = orderedWeddingSections(sections);
  return [...ordered, ...sections.filter(section => !ordered.includes(section))].filter(section => section.enabled && (
    section.content.trim() || section.detail.trim() || invitationSectionUrl(section.type, section.link)
    || section.imageUrl || section.imageUrls?.length || (section.type === "rsvp" && section.rsvpMode === "integrated")
  ));
}

export function atmospherePhotos(imageUrl: string, sections: InviteSection[]) {
  // An invitation without a cover photo must never acquire a demo portrait.
  if (!imageUrl) return [];
  const gallery = sections.filter(section => section.type === "gallery").flatMap(section => section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : []);
  return [...new Set([imageUrl, ...gallery])].slice(0, 4);
}

export function atmosphereStyle(design: WeddingDesign, accent: string): CSSProperties {
  const palette = weddingPalette(design, accent);
  const art = weddingArtwork(design);
  return {
    "--wa-base": palette.dark, "--wa-tint": palette.accent,
    "--wa-heading": getInvitationFont(design.typography).family,
    "--wa-body": getInvitationFont(design.bodyTypography).family,
    "--wa-art-top": art.topLeft ? `url("${art.topLeft}")` : "none",
    "--wa-art-bottom": art.bottomRight ? `url("${art.bottomRight}")` : "none",
    "--wa-texture": design.celestial ? `url("${design.celestial.sky}")` : design.foil ? `url("${design.foil}")` : "url('/textures/wedding/stationery-grain.svg')",
  } as CSSProperties;
}

export function atmosphereTime(time = "") {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${time}:00Z`));
}
