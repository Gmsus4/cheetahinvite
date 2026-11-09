import { isInvitationBlurIntensity, isInvitationSectionCorners } from "./invitation-editor";
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

export function atmosphereStyle(accent: string, fonts?: { typography?: string; bodyTypography?: string; blurIntensity?: number; backgroundBlurIntensity?: number; backgroundDimIntensity?: number; sectionCorners?: string; glassBorder?: boolean }): CSSProperties {
  const palette = invitationPalette(accent);
  const strength = (isInvitationBlurIntensity(fonts?.blurIntensity) ? fonts.blurIntensity : 50) / 50;
  return {
    "--wa-section-radius": `${({square:0, soft:8, rounded:18})[isInvitationSectionCorners(fonts?.sectionCorners) ? fonts.sectionCorners : "rounded"]}px`,
    "--wa-background-dim": (isInvitationBlurIntensity(fonts?.backgroundDimIntensity) ? fonts.backgroundDimIntensity : 0) / 100,
    "--wa-background-blur": `${(isInvitationBlurIntensity(fonts?.backgroundBlurIntensity) ? fonts.backgroundBlurIntensity : 0) * 0.24}px`,
    "--wa-blur": `${16 * strength}px`, "--wa-blur-color": `${24 * strength}px`,
    "--wa-blur-cover": `${20 * strength}px`, "--wa-blur-panel": `${18 * strength}px`,
    "--wa-base": palette.dark, "--wa-tint": palette.accent,
    "--wa-glass-background": "linear-gradient(135deg,#ffffff18,transparent 45%,#ffffff08),#ffffff05",
    "--wa-glass-border-width": fonts?.glassBorder === false ? "0px" : "1px",
    "--wa-glass-shadow": fonts?.glassBorder === false ? "0 8px 24px #00000010" : "inset 0 1px 0 #ffffff70,inset 1px 0 0 #ffffff24,inset 0 -1px 0 #ffffff30,0 8px 24px #00000010",
    "--wa-glass-filter": "blur(var(--wa-glass-blur)) saturate(115%)",
    "--wa-glass-blur": `${8 * strength}px`,
    "--wa-heading": getInvitationFont(fonts?.typography || sharedInvitationDesign.typography).family,
    "--wa-body": getInvitationFont(fonts?.bodyTypography || sharedInvitationDesign.bodyTypography).family,
  } as CSSProperties;
}

export function atmosphereTime(time = "") {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${time}:00Z`));
}
