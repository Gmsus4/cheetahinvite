import { imagePaletteColors, isInvitationImagePalette } from "./invitation-image-palette";
import { invitationPalette } from "./shared-invitation";

import { isInvitationTextColor } from "./invitation-editor";
export { isInvitationTextColor, isInvitationTextColorMode, type InvitationTextColorMode } from "./invitation-editor";

export const sectionTextColorOptions = [
  { value: "auto", label: "Por defecto (blanco)" },
  { value: "white", label: "Blanco" }, { value: "black", label: "Negro" },
  { value: "palette", label: "De la paleta" }, { value: "opposite", label: "Contraste de paleta" },
  { value: "custom", label: "Personalizado" },
] as const;

export function isGlobalTextColorLocked(mode?: string) {
  return Boolean(mode && mode !== "auto");
}

/** Choose a light/dark variant from the same palette, relative to its accent. */
export function oppositePaletteColor(accent: string, imagePalette?: unknown) {
  const palette = invitationPalette(accent, imagePalette);
  const light = textContrastRatio("#FFFFFF", palette.accent) >= textContrastRatio("#000000", palette.accent);
  const variant = light ? palette.paper : palette.ink;
  if (textContrastRatio(variant, palette.accent) >= 4.5) return variant;

  const target = light ? "#FFFFFF" : "#000000";
  let low = 0, high = 1;
  for (let i = 0; i < 24; i++) {
    const amount = (low + high) / 2;
    if (textContrastRatio(blendTextBackground(target, variant, amount), palette.accent) >= 4.5) high = amount;
    else low = amount;
  }
  return blendTextBackground(target, variant, high);
}

export function invitationTextColor(accent: string, mode?: string, custom?: string, imagePalette?: unknown) {
  if (mode === "black") return "#000000";
  if (mode === "palette") {
    if (isInvitationImagePalette(imagePalette)) {
      if (custom && imagePaletteColors(imagePalette).some(color => color.toLowerCase() === custom.toLowerCase())) return custom;
      return textContrastRatio(imagePalette.light, accent) >= textContrastRatio(imagePalette.dark, accent) ? imagePalette.light : imagePalette.dark;
    }
    return invitationPalette(accent).accent;
  }
  if (mode === "opposite") return oppositePaletteColor(accent, imagePalette);
  if (mode === "custom" && isInvitationTextColor(custom)) return custom;
  if (!mode || mode === "auto") return "#fffaf2";
  return "#FFFFFF";
}

function rgb(color: string) {
  return [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
}
function luminance(color: string) {
  const [r, g, b] = rgb(color).map(channel => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function textContrastRatio(text: string, background: string) {
  const a = luminance(text), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function blendTextBackground(foreground: string, background: string, opacity: number) {
  const back = rgb(background);
  return "#" + rgb(foreground).map((channel, index) => Math.round(channel * opacity + back[index] * (1 - opacity)).toString(16).padStart(2, "0")).join("");
}

/** Conservative sample of the background, not a guarantee for every text pixel. */
export function invitationTextContrast(text: string, accent: string, dim: number, backgrounds: string[] = [], imagePalette?: unknown) {
  const palette = invitationPalette(accent, imagePalette);
  const samples = [palette.dark, blendTextBackground(palette.accent, palette.dark, 0.5), ...backgrounds];
  return Math.min(textContrastRatio(text, palette.dark), ...samples.map(background => textContrastRatio(text, blendTextBackground("#000000", background, Math.max(0, Math.min(100, dim)) / 100))));
}
