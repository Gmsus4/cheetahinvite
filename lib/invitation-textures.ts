export const invitationTextures = [
  { id: 'none', label: 'Sin textura', description: 'Conserva los fondos lisos del diseño.' },
  { id: 'paper', label: 'Papel artesanal', description: 'Pequeñas motas que dan una apariencia suave de papel.' },
  { id: 'linen', label: 'Lino', description: 'Una trama fina de líneas entrecruzadas.' },
  { id: 'dots', label: 'Puntos delicados', description: 'Puntos pequeños y espaciados sobre el fondo.' },
  { id: 'diagonal', label: 'Líneas diagonales', description: 'Un patrón discreto de líneas inclinadas.' },
] as const;

export function isInvitationTexture(value: string) {
  return invitationTextures.some((texture) => texture.id === value);
}
