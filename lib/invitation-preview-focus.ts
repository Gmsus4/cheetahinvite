import type { EditorValues, InviteSection } from './invitation-editor';

export type PreviewTarget = { target: string; label: string; fallback?: string; sequence?: number };

export function previewForSection(section: InviteSection, changes: Partial<InviteSection> = {}): PreviewTarget {
  const block = `section:${section.id}`;
  if (changes.enabled === false) return { target: 'cover', label: 'Portada' };
  const photo = 'imageUrl' in changes || 'imageUrls' in changes;
  const field = ['title', 'content', 'detail', 'link'].find(key => key in changes);
  const target = photo ? `${section.id}-photo` : field ? `${section.id}-${field === 'detail' ? 'time' : field}` : block;
  return { target, fallback: block, label: section.title };
}

export function previewForChanges(values: EditorValues, changes: Partial<EditorValues>): PreviewTarget | undefined {
  const fields: [keyof EditorValues, string, string][] = [
    ['hostNames', 'w-hosts', 'Protagonistas'], ['name', 'w-name', 'Nombre de la invitación'],
    ['eventType', 'cover', 'Portada'], ['eventDate', 'w-date', 'Fecha'], ['eventTime', 'w-time', 'Hora'],
    ['venue', 'w-venue', 'Lugar del evento'], ['address', 'w-address', 'Dirección'],
    ['imageUrl', 'cover-photo', 'Foto de portada'], ['coverLayout', 'cover', 'Portada'],
    ['backgroundImageUrl', 'cover', 'Fondo'], ['backgroundBlurIntensity', 'cover', 'Fondo'], ['backgroundDimIntensity', 'cover', 'Fondo'],
  ];
  const field = fields.find(([key]) => key in changes);
  if (field) {
    const location = values.sections.find(s => s.type === 'location');
    const fallback = location && ['w-venue', 'w-address'].includes(field[1]) ? `section:${location.id}` : 'cover';
    return { target: field[1], label: field[2], fallback };
  }
  const appearance = ['sectionCorners', 'showSectionIcons', 'panelStyle', 'blurIntensity', 'glassBorder', 'accent', 'imagePalette', 'sectionColor', 'textColorMode', 'textColor', 'typography', 'bodyTypography'];
  if (appearance.some(key => key in changes)) {
    const section = values.sections.find(s => s.enabled && !['cover', 'countdown', 'gallery', 'closing'].includes(s.type));
    return section ? previewForSection(section) : { target: 'cover', label: 'Portada' };
  }
}
