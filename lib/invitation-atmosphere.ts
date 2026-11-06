import { isInvitationBlurIntensity } from "./invitation-editor";
import type { CSSProperties } from "react";
import type { InviteSection, InvitationPanelStyle } from "./invitation-editor";
import { getInvitationFont } from "./invitation-fonts";
import { orderedInvitationSections } from "./invitation-sections";
import { invitationPalette, sharedInvitationDesign } from "./shared-invitation";
import { invitationSectionUrl } from "./invitation-links";

export function atmospherePanelStyle(section: Pick<InviteSection, "panelStyle"> | undefined, index: number, globalStyle: InvitationPanelStyle = "auto") {
  if (globalStyle !== "auto") return globalStyle;
  return section?.panelStyle && section.panelStyle !== "auto" ? section.panelStyle : (["blur", "blur-color", "color"] as const)[index % 3];
}

export function atmosphereSections(sections: InviteSection[]) {
  const ordered = orderedInvitationSections(sections);
  return ordered.filter(section => section.enabled && (
    section.content.trim() || section.detail.trim() || invitationSectionUrl(section.type, section.link)
    || section.imageUrl || section.imageUrls?.length || (section.type === "rsvp" && section.rsvpMode === "integrated")
  ));
}

export function atmosphereStyle(accent: string, fonts?: { typography?: string; bodyTypography?: string; blurIntensity?: number }): CSSProperties {
  const palette = invitationPalette(accent);
  const strength = (isInvitationBlurIntensity(fonts?.blurIntensity) ? fonts.blurIntensity : 50) / 50;
  return {
    "--wa-blur": `${16 * strength}px`, "--wa-blur-color": `${24 * strength}px`,
    "--wa-blur-cover": `${20 * strength}px`, "--wa-blur-panel": `${18 * strength}px`,
    "--wa-base": palette.dark, "--wa-tint": palette.accent,
    "--wa-heading": getInvitationFont(fonts?.typography || sharedInvitationDesign.typography).family,
    "--wa-body": getInvitationFont(fonts?.bodyTypography || sharedInvitationDesign.bodyTypography).family,
  } as CSSProperties;
}

export function atmosphereTime(time = "") {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${time}:00Z`));
}
