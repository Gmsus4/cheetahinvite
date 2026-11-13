import type { EditorValues } from "./invitation-editor";
import { invitationSectionPaletteTarget, type InvitationImagePalette } from "./invitation-image-palette";

/** Bind old hexadecimal selections before replacing the palette they belong to. */
export function invitationPaletteChanges(values: Pick<EditorValues, "imagePalette" | "sectionColor" | "sections">, accent: string, imagePalette: InvitationImagePalette | null, sectionColor?: string): Pick<EditorValues, "accent" | "imagePalette" | "sectionColor" | "sections"> {
  const bind = (color: string) => invitationSectionPaletteTarget(color, values.imagePalette)
    ?? (/^#[0-9a-f]{6}$/i.test(color) ? `custom:${color}` : color);
  return {
    accent, imagePalette,
    sectionColor: sectionColor === undefined ? bind(values.sectionColor ?? "auto") : bind(sectionColor),
    sections: values.sections.map(section => section.sectionColor
      ? { ...section, sectionColor: bind(section.sectionColor) }
      : section),
  };
}
