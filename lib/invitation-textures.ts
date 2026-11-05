export function isInvitationTexture(value: string) {
  // Accept stored values for compatibility; saves normalize them to none.
  return ['none', 'paper', 'linen', 'dots', 'diagonal'].includes(value);
}
