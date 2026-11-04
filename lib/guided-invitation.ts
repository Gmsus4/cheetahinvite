import { birthdayCinemaId } from './birthday-cinema';
import { birthdayElegantId } from './birthday-elegant';
import { birthdayCowboyId } from './birthday-cowboy';
import { birthdayGamerId } from './birthday-gamer';
import { birthdayDinosaurId } from './birthday-dinosaur';
import { birthdaySpaceId } from './birthday-space';
import type { EventData } from '@/components/dashboard/EventEditor';
import type { EditorValues, InviteSection } from './invitation-editor';
import { getInvitationEventContent } from './invitation-event-content';
import { getInvitationTemplate } from './invitation-templates';
import { birthdayDiscoId } from './birthday-disco';
import { birthdayNeonId } from './birthday-neon';
import { birthdayPastelId } from './birthday-pastel';
import { birthdayConfettiId } from './birthday-designs';
import { eventButtonAppearance } from './invitation-buttons';
import { applyWeddingDesign, getWeddingDesign, weddingDesigns, weddingDetails, weddingSections, weddingPublicationIssues, weddingEventPublicationIssues } from './wedding-designs';

export function guidedDetails(eventType: string) {
  if (eventType === 'wedding') return weddingDetails;
  const content = getInvitationEventContent(eventType);
  return (['story', 'ceremony', 'reception', 'program', 'parents', 'dress_code', 'gifts', 'gallery', 'rsvp', 'music', 'custom'] as const).map(type => ({
    type, title: content.sections[type].title,
    question: ({story:'¿Quieres compartir unas palabras?', ceremony:'¿Habrá una ceremonia o momento especial?', reception:'¿Habrá otra sede para la celebración?', program:'¿Quieres compartir el programa?', parents:'¿Quieres mencionar a personas especiales?', dress_code:'¿Habrá código de vestimenta?', gifts:'¿Quieres incluir información de regalos?', gallery:'¿Quieres incluir una galería?', rsvp:'¿Quieres recibir confirmaciones?', music:'¿Quieres compartir una playlist?', custom:'¿Hay algo más que deban saber?'} as const)[type],
    help: type === 'rsvp' ? 'Recibe respuestas en la invitación o mediante un enlace externo.' : 'Opcional. Activa esta sección para personalizarla.',
  }));
}
export function guidedSections(eventType: string): InviteSection[] {
  if (eventType === 'wedding') return weddingSections();
  return guidedDetails(eventType).map(d => ({ id: `${eventType}-${d.type}`, type:d.type, title:d.title, content:'', detail:'', link:'', imageUrl:'', imageUrls:[], enabled:d.type === 'rsvp', ...(d.type === 'rsvp' ? { rsvpMode:'integrated' as const } : {}) }));
}
export function guidedDesign(eventType: string, templateId: string) {
  const wedding = eventType === 'wedding' ? getWeddingDesign(templateId) : null;
  if (wedding) return wedding;
  const template = getInvitationTemplate(eventType, templateId);
  const accent = template?.accent || getInvitationEventContent(eventType).demo.accent;
  return { id:templateId, label:template?.label || 'Esencial', palettes:[
    {label:'Color original', accent, paper:'#fffaf0', panel:'#e6efeb', ink:'#354f50', muted:'#60716b', dark:'#354f50'},
    {label:'Azul', accent:'#3e6685', paper:'#f8fbff', panel:'#e4edf4', ink:'#253c50', muted:'#60716b', dark:'#253c50'},
    {label:'Rosa', accent:'#a34465', paper:'#fff9fb', panel:'#f4e1e8', ink:'#51303d', muted:'#765b62', dark:'#51303d'},
    {label:'Terracota', accent:'#a15236', paper:'#fffaf5', panel:'#f1dfd2', ink:'#50362b', muted:'#775e49', dark:'#50362b'},
  ] };
}
export function applyGuidedDesign(values: EditorValues, id: string): EditorValues {
  if (values.eventType === 'wedding' && getWeddingDesign(id)) return applyWeddingDesign(values,id);
  const design = guidedDesign(values.eventType,id);
  const confetti = values.eventType === 'birthday' && (id === birthdayConfettiId || id === birthdayDinosaurId);
  return {...values, templateId:id, accent:design.palettes[0].accent, ...(confetti ? {typography:'fredoka',bodyTypography:'nunito'} : values.eventType === 'birthday' && id === birthdayPastelId ? {typography:'comfortaa',bodyTypography:'nunito'} : values.eventType === 'birthday' && id === birthdayNeonId ? {typography:'comfortaa',bodyTypography:'dm-sans'} : values.eventType === 'birthday' && id === birthdayCinemaId ? {typography:'cinzel',bodyTypography:'dm-sans'} : values.eventType === 'birthday' && id === birthdayElegantId ? {typography:'cormorant-garamond',bodyTypography:'dm-sans'} : values.eventType === 'birthday' && id === birthdayCowboyId ? {typography:'rye',bodyTypography:'nunito'} : values.eventType === 'birthday' && id === birthdayGamerId ? {typography:'outfit',bodyTypography:'nunito'} : values.eventType === 'birthday' && (id === birthdayDiscoId || id === birthdaySpaceId) ? {typography:'outfit',bodyTypography:'dm-sans'} : {})};
}
export function completeGuidedSections(eventType: string, stored: InviteSection[]) {
  const previous = stored.map(section => section.type === 'rsvp' && !section.rsvpMode ? {...section, rsvpMode:'external' as const} : section);
  return [...previous, ...guidedSections(eventType).filter(section => !previous.some(old => old.type === section.type))];
}
export function initialGuidedValues(event: EventData): EditorValues {
  const type = event.eventType;
  const content = getInvitationEventContent(type);
  const id = !event.id && type === 'wedding' ? weddingDesigns[0].id : !event.id && type === 'birthday' ? birthdayConfettiId : event.templateId || 'none';
  const stored = Array.isArray(event.sections) ? event.sections as InviteSection[] : [];
  const sections = completeGuidedSections(type, stored);
  const values: EditorValues = {name:event.name || content.defaultName, eventType:type, hostNames:event.hostNames || '', eventDate:event.eventDate ? new Date(event.eventDate).toISOString().slice(0,10) : '', eventTime:event.eventTime || '', venue:event.venue || '', address:event.address || '', message:event.message || '', imageUrl:event.imageUrl || '', backgroundImageUrl:event.backgroundImageUrl || '', customSlug:event.customSlug || '', accent:event.accent, templateId:id, typography:event.typography, bodyTypography:event.bodyTypography, texture:event.texture || 'none', heroHorizontal:event.heroHorizontal || 'center', heroVertical:event.heroVertical || 'center', buttonAppearance:eventButtonAppearance(event), sections};
  if (type === 'wedding' && getWeddingDesign(id)) return applyWeddingDesign(values,id,event.accent);
  return event.id ? values : applyGuidedDesign(values,id);
}
export function guidedPublicationIssues(values: Pick<EditorValues,'eventType'|'hostNames'|'eventDate'|'eventTime'|'venue'|'address'|'sections'>) {
  const issues = weddingPublicationIssues(values);
  if (values.eventType === 'wedding') return issues;
  return issues.map(issue => ({...issue, message:issue.message.replace('los nombres de la pareja','el nombre de quien celebra o de los anfitriones').replace('la fecha de la boda','la fecha del evento')}));
}
export function eventPublicationIssues(event: Parameters<typeof weddingEventPublicationIssues>[0]) {
  if (!event.eventType || event.eventType === 'wedding') return weddingEventPublicationIssues(event);
  return guidedPublicationIssues({eventType:event.eventType || 'other',hostNames:event.hostNames || '',eventDate:event.eventDate?.toISOString().slice(0,10) || '',eventTime:event.eventTime || '',venue:event.venue || '',address:event.address || '',sections:(Array.isArray(event.sections) ? event.sections : []) as InviteSection[]});
}
