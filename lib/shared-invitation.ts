import { invitationPaletteChoices, paletteFromAccent } from "./invitation-palettes";
import type { InvitationButtonAppearance } from "./invitation-buttons";

export const sharedInvitationId = "celebration-v1";
export const sharedInvitationDesign = {
  id: sharedInvitationId, label: "Celebración",
  description: "Tus fotos y tu historia en una invitación para cualquier ocasión.",
  typography: "great-vibes", bodyTypography: "lora",
  buttons: { shape: "pill", filled: true, border: false, icons: true, bold: false } satisfies InvitationButtonAppearance,
  palettes: invitationPaletteChoices([
    { label: "Olivo y marfil", accent: "#58664E", paper: "#FCFAF5", panel: "#EEEFE5", ink: "#2D382B", muted: "#606655", dark: "#303D2D" },
    { label: "Rosa antiguo", accent: "#925C65", paper: "#FFF9F7", panel: "#F3E5E4", ink: "#482E36", muted: "#785B62", dark: "#583B43" },
    { label: "Lavanda", accent: "#765B89", paper: "#FCF9FE", panel: "#EEE7F4", ink: "#392D46", muted: "#6F6079", dark: "#453450" },
    { label: "Champaña", accent: "#806640", paper: "#FFFCF5", panel: "#F2EBDC", ink: "#3C3223", muted: "#71634F", dark: "#493B28" },
    { label: "Eucalipto", accent: "#486D66", paper: "#F8FCFA", panel: "#E4EEEA", ink: "#263D37", muted: "#536B62", dark: "#2C4840" },
    { label: "Azul polvo", accent: "#536D86", paper: "#FAFBFE", panel: "#E7EDF3", ink: "#2B3849", muted: "#566779", dark: "#304458" },
  ]),
};

export function invitationPalette(accent: string) {
  return sharedInvitationDesign.palettes.find(palette => palette.accent.toLowerCase() === accent.toLowerCase())
    ?? (/^#[0-9a-f]{6}$/i.test(accent) ? paletteFromAccent(accent, "Color personalizado") : sharedInvitationDesign.palettes[0]);
}
