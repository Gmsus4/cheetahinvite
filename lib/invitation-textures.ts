export const invitationTextures = [
  { id: 'none', label: 'Sin textura', description: 'Conserva los fondos lisos del diseño.' },
] as const;

export function isInvitationTexture(value: string) {
  // Accept stored values for compatibility; saves normalize them to none.
  return ['none', 'paper', 'linen', 'dots', 'diagonal'].includes(value);
}
