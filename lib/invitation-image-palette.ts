export type InvitationImagePalette = { light: string; dark: string; accents: [string, string, string] };

export function isInvitationImagePalette(value: unknown): value is InvitationImagePalette {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const palette = value as InvitationImagePalette;
  const validHex = (color: unknown) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color);
  return Object.keys(value).length === 3 && validHex(palette.light) && validHex(palette.dark)
    && Array.isArray(palette.accents) && palette.accents.length === 3 && palette.accents.every(validHex)
    && new Set([palette.light, palette.dark, ...palette.accents].map(color => color.toLowerCase())).size === 5;
}

export function imagePaletteColors(palette: InvitationImagePalette) {
  return [palette.light, palette.dark, ...palette.accents];
}

export const imagePaletteTargets = ["palette:light", "palette:dark", "palette:accent-1", "palette:accent-2", "palette:accent-3"] as const;
export type InvitationPaletteTarget = typeof imagePaletteTargets[number];

export function isInvitationPaletteTarget(value: unknown): value is InvitationPaletteTarget {
  return typeof value === "string" && (imagePaletteTargets as readonly string[]).includes(value);
}

export function isInvitationSectionColor(value: unknown): value is string {
  return value === "auto" || isInvitationPaletteTarget(value)
    || (typeof value === "string" && /^(?:custom:)?#[0-9a-f]{6}$/i.test(value));
}

/** Recognize older saved swatches while keeping explicit custom colors fixed. */
export function invitationSectionPaletteTarget(value?: string, palette?: unknown): InvitationPaletteTarget | undefined {
  if (isInvitationPaletteTarget(value)) return value;
  if (!value || !/^#[0-9a-f]{6}$/i.test(value) || !isInvitationImagePalette(palette)) return;
  const index = imagePaletteColors(palette).findIndex(color => color.toLowerCase() === value.toLowerCase());
  return index < 0 ? undefined : imagePaletteTargets[index];
}

export function resolveInvitationSectionColor(value?: string, palette?: unknown): string | undefined {
  if (isInvitationPaletteTarget(value)) {
    return isInvitationImagePalette(palette) ? imagePaletteColors(palette)[imagePaletteTargets.indexOf(value)] : undefined;
  }
  if (value && /^(?:custom:)?#[0-9a-f]{6}$/i.test(value)) return value.replace(/^custom:/i, "");
}
