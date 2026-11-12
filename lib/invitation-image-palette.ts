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
