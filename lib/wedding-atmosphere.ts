import type { CSSProperties } from "react";
import type { InviteSection } from "./invitation-editor";
import { getInvitationFont } from "./invitation-fonts";
import { orderedWeddingSections, weddingPalette, type WeddingDesign } from "./wedding-designs";
import { invitationSectionUrl } from "./invitation-links";

export function atmospherePanelStyle(section: Pick<InviteSection, "panelStyle"> | undefined, index: number) {
  return section?.panelStyle && section.panelStyle !== "auto" ? section.panelStyle : (["blur", "blur-color", "color"] as const)[index % 3];
}

export function atmosphereSections(sections: InviteSection[]) {
  const ordered = orderedWeddingSections(sections);
  return [...ordered, ...sections.filter(section => !ordered.includes(section))].filter(section => section.enabled && (
    section.content.trim() || section.detail.trim() || invitationSectionUrl(section.type, section.link)
    || section.imageUrl || section.imageUrls?.length || (section.type === "rsvp" && section.rsvpMode === "integrated")
  ));
}

export function atmosphereStyle(design: WeddingDesign, accent: string): CSSProperties {
  const palette = weddingPalette(design, accent);
  return {
    "--wa-base": palette.dark, "--wa-tint": palette.accent,
    "--wa-heading": getInvitationFont(design.typography).family,
    "--wa-body": getInvitationFont(design.bodyTypography).family,
    "--wa-texture": design.celestial ? `url("${design.celestial.sky}")` : design.foil ? `url("${design.foil}")` : "url('/textures/wedding/stationery-grain.svg')",
  } as CSSProperties;
}

export function atmosphereTime(time = "") {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${time}:00Z`));
}
