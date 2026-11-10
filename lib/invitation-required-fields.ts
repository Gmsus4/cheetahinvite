import type { EditorValues, InviteSection } from './invitation-editor';
import { parseInvitationProgram } from './invitation-program';
import { usesPrimaryLocation } from './invitation-sections';
import { parseInvitationWhatsAppLink, splitWhatsAppPhone } from './invitation-whatsapp';

export type RequiredIssue = { step: number; field: string; message: string; sectionId?: string };
export function webLink(value: string) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname); } catch { return false; }
}
export function requiredSectionFields(section: InviteSection, requirePhotos = false): RequiredIssue[] {
  if (!section.enabled || ['cover','countdown','location','reception'].includes(section.type)) return [];
  const errors: RequiredIssue[] = [];
  const add = (field: string, message: string) => errors.push({ step: 4, sectionId: section.id, field: `${section.id}-${field}`, message });
  if (!section.title?.trim()) add('title','Escribe un título para este bloque.');
  const text = section.content?.trim(), link = section.link?.trim() ?? '';
  switch (section.type) {
    case 'gallery':
      if (requirePhotos && !section.imageUrl && !section.imageUrls?.length) add('title','Agrega al menos una foto a la galería desde el diseño o desactiva este bloque.');
      break;
    case 'program': {
      const activities = parseInvitationProgram(section.content ?? '');
      if (!activities.some(item => item.activity.trim())) add('activity-0-text','Agrega al menos una actividad al itinerario.');
      activities.forEach((item,index) => { if (item.time && !item.activity.trim()) add(`activity-${index}-text`,'Escribe qué sucederá en este horario.'); });
      break;
    }
    case 'rsvp':
      if (section.rsvpMode !== 'integrated') {
        const whatsapp = section.whatsappPhone !== undefined || !link || Boolean(parseInvitationWhatsAppLink(link));
        const parsed = parseInvitationWhatsAppLink(link);
        const phone = parsed ? splitWhatsAppPhone(parsed.phone) : null;
        const validPhone = parsed && (phone?.countryCode !== '52' || phone.number.length === 10);
        if (!link || !webLink(link) || (whatsapp && !validPhone)) add(whatsapp ? 'phone' : 'link', whatsapp ? 'Escribe un número de WhatsApp válido para recibir las confirmaciones.' : 'Agrega un enlace válido para confirmar asistencia.');
      }
      break;
    case 'ceremony':
      if (!text) add('content','Escribe el nombre del lugar de la ceremonia.');
      if (!section.detail?.trim()) add('time','Agrega el horario de la ceremonia.');
      if (!link) add('map','Agrega la dirección o el enlace de la ceremonia.');
      break;
    case 'music':
      if (!webLink(link)) add('link','Agrega un enlace válido a la playlist.');
      break;
    case 'gifts': case 'custom':
      if (!text && !link) add('content', section.type === 'gifts' ? 'Escribe un mensaje sobre los regalos o agrega un enlace.' : 'Escribe la información adicional o agrega un enlace.');
      if (link && !webLink(link)) add('link','Escribe un enlace válido que comience con https:// o http://.');
      break;
    default:
      if (!text) add('content','Completa el texto de este bloque o desactívalo para continuar.');
  }
  return errors;
}
export function creationRequiredFields(values: EditorValues, requirePhotos = false): RequiredIssue[] {
  const errors: RequiredIssue[] = [];
  const add = (step: number, field: string, message: string) => errors.push({ step, field, message });
  if (!values.hostNames.trim()) add(0,'w-hosts','Escribe el nombre de quien celebra.');
  if (values.name.trim().length < 2) add(0,'w-name','Escribe un nombre de al menos 2 caracteres para tu invitación.');
  if (!values.eventDate) add(1,'w-date','Elige la fecha de la celebración.');
  if (!values.eventTime) add(1,'w-time','Elige la hora de la celebración.');
  const location = values.sections.find(section => section.type === 'location');
  if (usesPrimaryLocation(values.sections)) {
    if (!values.venue.trim()) add(1,'w-venue','Escribe el nombre del lugar del evento.');
    if (!values.address.trim() && !location?.link.trim()) add(1,'w-address','Escribe una dirección o agrega el enlace de Google Maps.');
  }
  if (location?.link.trim() && !webLink(location.link.trim())) add(1,'w-map','Escribe un enlace válido de la ubicación.');
  return [...errors, ...values.sections.flatMap(section => requiredSectionFields(section, requirePhotos))];
}
