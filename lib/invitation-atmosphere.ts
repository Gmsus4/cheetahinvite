import { invitationTextColor, isGlobalTextColorLocked } from "./invitation-text-color";
import { isInvitationBlurIntensity, isInvitationSectionCorners } from "./invitation-editor";
import { resolveInvitationSectionColor } from "./invitation-image-palette";
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

export function atmosphereStyle(accent: string, fonts?: { imagePalette?: unknown; textColorMode?: string; textColor?: string; typography?: string; bodyTypography?: string; blurIntensity?: number; backgroundBlurIntensity?: number; backgroundDimIntensity?: number; sectionCorners?: string; glassBorder?: boolean }): CSSProperties {
  const palette = invitationPalette(accent, fonts?.imagePalette);
  const strength = (isInvitationBlurIntensity(fonts?.blurIntensity) ? fonts.blurIntensity : 50) / 50;
  return {
    "--wa-ink": invitationTextColor(accent, fonts?.textColorMode, fonts?.textColor, fonts?.imagePalette),
    "--wa-soft": !fonts?.textColorMode || fonts.textColorMode === "auto" ? "#eee7dc" : invitationTextColor(accent, fonts.textColorMode, fonts.textColor, fonts.imagePalette),
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

export function atmosphereTextStyle(accent: string, global: { sectionColor?: string; imagePalette?: unknown; textColorMode?: string; textColor?: string }, section?: Pick<InviteSection, "sectionColor" | "textColorMode" | "textColor">): CSSProperties {
  const selected = isGlobalTextColorLocked(global.textColorMode) ? global : section;
  const ink = invitationTextColor(accent, selected?.textColorMode, selected?.textColor, global.imagePalette);
  const soft = !selected?.textColorMode || selected.textColorMode === "auto" ? "#eee7dc" : ink;
  const blockSelection = global.sectionColor && global.sectionColor !== "auto" ? global.sectionColor : section?.sectionColor;
  const blockColor = resolveInvitationSectionColor(blockSelection, global.imagePalette);
  const background: Record<string, string> = blockColor ? { "--wa-base": blockColor, "--wa-tint": blockColor, "--wa-block-color": blockColor } : {};
  return { ...background, color: ink, "--wa-ink": ink, "--wa-soft": soft, "--invite-ink": ink, "--invite-action": ink, "--invite-accent": soft, "--invite-muted": soft } as CSSProperties;
}

export function atmosphereTime(time = "") {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${time}:00Z`));
}
