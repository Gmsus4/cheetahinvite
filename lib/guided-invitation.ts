import { isInvitationCoverLayout } from "./invitation-cover-layout";
import { requiredSectionFields } from "./invitation-required-fields";
import { invitationStyleStepIndex } from "./invitation-style-journey";
import { normalizeEventLocations } from "./invitation-locations";
import { invitationGoogleMapsUrl } from "./invitation-links";
import { isInvitationPanelStyle, isInvitationBlurIntensity, isInvitationSectionCorners } from "./invitation-editor";
import { weddingDetails, usesPrimaryLocation, locationSectionTitle, invitationSectionLabels } from "./invitation-sections";
import type { EventData, EditorValues, EditorWizard, InviteSection } from './invitation-editor';
import { recommendedInvitationFonts } from './invitation-fonts';
import { getInvitationEventContent } from './invitation-event-content';
import { invitationEventPreset, invitationSectionPreset } from './invitation-event-presets';
import { eventButtonAppearance } from './invitation-buttons';
import { sharedInvitationId, sharedInvitationDesign } from './shared-invitation';

export function guidedDetails(eventType: string) {
  return (['story', 'ceremony', 'program', 'parents', 'dress_code', 'gifts', 'gallery', 'music', 'custom', 'rsvp', 'closing'] as const).map(type => {
    const weddingDetail = eventType === 'wedding' ? weddingDetails.find(detail => detail.type === type) : undefined;
    return ({
    type, title: invitationSectionLabels[type],
    question: weddingDetail?.question ?? ({closing:'¿Quieres incluir una despedida?', location:'¿Mostrar el lugar principal?', story:'¿Quieres compartir unas palabras?', ceremony:'¿Habrá una ceremonia?', reception:'¿Habrá otra sede para la celebración?', program:'¿Quieres compartir el programa?', parents:'¿Quieres mencionar a personas especiales?', dress_code:'¿Habrá código de vestimenta?', gifts:'¿Quieres incluir información de regalos?', gallery:'¿Quieres incluir una galería?', rsvp:'¿Quieres recibir confirmaciones?', music:'¿Quieres compartir una playlist?', custom:'¿Hay algo más que deban saber?'} as const)[type],
    help: weddingDetail?.help ?? (type === 'rsvp' ? 'Recibe respuestas en la invitación o mediante un enlace externo.' : 'Opcional. Activa esta sección para personalizarla.'),
    });
  });
}
export function guidedSections(eventType: string): InviteSection[] {
  return [{ type: "cover" as const }, { type: "countdown" as const }, { type: "location" as const }, ...guidedDetails(eventType)].map(d => ({ id: `${eventType}-${d.type}`, type:d.type, ...invitationSectionPreset(eventType, d.type), detail:'', link:'', imageUrl:'', imageUrls:[], ...(d.type === 'rsvp' ? { rsvpMode:'integrated' as const, maxCompanions:0 } : {}) }));
}
export function availableGuidedSections(eventType: string, sections: InviteSection[]) {
  const defaults = guidedSections(eventType);
  const extras = sections.filter(section => section.type !== "cover" && section.type !== "reception" && !defaults.some(option => option.type === section.type));
  return [...defaults, ...extras].filter(option => option.type !== "cover").filter((option, index, options) => options.findIndex(item => item.type === option.type) === index).flatMap(option => {
    if (sections.some(section => section.type === option.type && section.enabled)) return [];
    const section = sections.find(section => section.type === option.type && !section.enabled);
    return section ? [section] : [];
  });
}
export function guidedContentSectionIds(eventType: string, sections: InviteSection[], activeSection = '') {
  const recommended = new Set(guidedSections(eventType).filter(section => section.enabled).map(section => section.type));
  const ordered = guidedDetails(eventType).flatMap(detail => sections.filter(section => section.type === detail.type));
  return [sections.find(section => section.type === 'cover')?.id ?? '__cover', ...sections.filter(section => section.type === 'countdown').map(section => section.id), ...sections.filter(section => section.type === 'location').map(section => section.id), ...ordered.filter(section => recommended.has(section.type) || section.enabled || section.id === activeSection).map(section => section.id), '__more'];
}

export function guidedInformationSectionIds(eventType: string, sections: InviteSection[], activeSection = '') {
  const informationIds = new Set(sections.filter(section => !['cover', 'countdown', 'location'].includes(section.type)).map(section => section.id));
  return guidedContentSectionIds(eventType, sections, activeSection).filter(id => id === '__more' || informationIds.has(id));
}


export function completeGuidedSections(eventType: string, stored: InviteSection[]) {
  const previous = stored.map(section => section.type === 'location' ? { ...section, title: locationSectionTitle(section) } : section.type === 'rsvp' && !section.rsvpMode ? {...section, rsvpMode:'external' as const} : section);
  // Preserve the formerly automatic location block; other missing details stay disabled.
  return [...previous, ...guidedSections(eventType).filter(section => !previous.some(old => old.type === section.type)).slice(0, Math.max(0, 16 - previous.length)).map(section => ({ ...section, enabled: section.type === 'location' ? usesPrimaryLocation(previous) : section.type === 'cover' || section.type === 'countdown' || section.type === 'closing', content: section.type === 'closing' ? section.content : '' }))];
}
export function initialGuidedValues(event: EventData): EditorValues {
  const type = event.eventType;
  const content = getInvitationEventContent(type);
  const id = !event.id ? sharedInvitationId : event.templateId || sharedInvitationId;
  const stored = Array.isArray(event.sections) ? event.sections as InviteSection[] : [];
  const locations = normalizeEventLocations(event.venue || "", event.address || "", stored);
  let sections = !event.id && stored.length === 0 ? guidedSections(type) : completeGuidedSections(type, locations.sections);
  const pastedMap = invitationGoogleMapsUrl(locations.address);
  if (pastedMap) sections = sections.map(section => section.type === "location" && !section.link ? { ...section, link: pastedMap } : section);
  const values: EditorValues = {coverLayout:isInvitationCoverLayout(event.coverLayout) ? event.coverLayout : "split",backgroundDimIntensity:isInvitationBlurIntensity(event.backgroundDimIntensity) ? event.backgroundDimIntensity : 0,backgroundBlurIntensity:isInvitationBlurIntensity(event.backgroundBlurIntensity) ? event.backgroundBlurIntensity : 0,glassBorder:event.glassBorder !== false,showSectionIcons:event.showSectionIcons !== false,sectionCorners:isInvitationSectionCorners(event.sectionCorners) ? event.sectionCorners : "rounded",name:event.name || content.defaultName, eventType:type, hostNames:event.hostNames || '', eventDate:event.eventDate ? new Date(event.eventDate).toISOString().slice(0,10) : '', eventTime:event.eventTime || '', venue:locations.venue, address:pastedMap ? '' : locations.address, message:event.message || '', imageUrl:event.imageUrl || '', blurIntensity:isInvitationBlurIntensity(event.blurIntensity) ? event.blurIntensity : 50, panelStyle:isInvitationPanelStyle(event.panelStyle) ? event.panelStyle : "auto", backgroundImageUrl:event.backgroundImageUrl || '', customSlug:event.customSlug || '', accent:event.accent, templateId:id, typography:event.typography, bodyTypography:event.bodyTypography, texture:event.texture || 'none', heroHorizontal:event.heroHorizontal || 'center', heroVertical:event.heroVertical || 'center', buttonAppearance:eventButtonAppearance(event), sections};
  if (event.id) return { ...values, texture: 'none' };
  const initial = { ...values, templateId: sharedInvitationId, message: !stored.length ? event.message || invitationEventPreset(type).message : values.message,
    accent: sharedInvitationDesign.palettes[0].accent, typography: sharedInvitationDesign.typography, bodyTypography: sharedInvitationDesign.bodyTypography,
    texture: 'none', heroHorizontal: 'center', heroVertical: 'center', buttonAppearance: { ...sharedInvitationDesign.buttons } };
  return !stored.length ? { ...initial, typography: recommendedInvitationFonts(type, 'heading')[0], bodyTypography: recommendedInvitationFonts(type, 'body')[0] } : initial;
}

export function changeGuidedEventType(values: EditorValues, eventType: string): EditorValues {
  if (values.eventType === eventType) return values;
  const previousContent = getInvitationEventContent(values.eventType);
  const nextContent = getInvitationEventContent(eventType);
  const oldSections = guidedSections(values.eventType);
  const nextSections = guidedSections(eventType);
  const sections = values.sections.map(section => {
    const old = oldSections.find(item => item.type === section.type);
    const next = nextSections.find(item => item.type === section.type);
    if (!old || !next) return section;
    const unchanged = section.title === old.title && section.content === old.content
      && section.enabled === old.enabled && !section.detail && !section.link
      && !section.imageUrl && !section.imageUrls?.length
      && (section.type !== 'rsvp' || section.rsvpMode === 'integrated');
    // A customized section keeps its content, media and activation choice together.
    if (!unchanged) return section;
    return { ...section, title: next.title, content: next.content, enabled: next.enabled };
  });
  return {
    ...values, eventType,
    typography: values.typography === recommendedInvitationFonts(values.eventType, "heading")[0] ? recommendedInvitationFonts(eventType, "heading")[0] : values.typography,
    bodyTypography: values.bodyTypography === recommendedInvitationFonts(values.eventType, "body")[0] ? recommendedInvitationFonts(eventType, "body")[0] : values.bodyTypography,
    name: values.name === previousContent.defaultName ? nextContent.defaultName : values.name,
    message: values.message === invitationEventPreset(values.eventType).message ? invitationEventPreset(eventType).message : values.message,
    sections: [...sections, ...nextSections.filter(next => !sections.some(section => section.type === next.type))],
  };
}
export function guidedPublicationIssues(values: Pick<EditorValues, 'eventType' | 'hostNames' | 'eventDate' | 'eventTime' | 'venue' | 'address' | 'sections'>) {
  values = { ...values, ...normalizeEventLocations(values.venue, values.address, values.sections) };
  const wedding = values.eventType === 'wedding';
  const issues: { step: number; message: string; sectionId?: string }[] = [];
  if (!values.hostNames.trim()) issues.push({ step: 0, message: wedding ? 'Agrega los nombres de la pareja.' : 'Agrega el nombre de quien celebra o de los anfitriones.' });
  if (!values.eventDate) issues.push({ step: 1, message: wedding ? 'Elige la fecha de la boda.' : 'Elige la fecha del evento.' });
  if (!values.eventTime) issues.push({ step: 1, message: 'Agrega la hora de la celebración.' });
  if (usesPrimaryLocation(values.sections)) {
    if (!values.venue.trim()) issues.push({ step: 1, message: 'Agrega el lugar de la celebración.' });
    if (!values.address.trim() && !values.sections.find(section => section.type === 'location')?.link.trim()) issues.push({ step: 1, message: 'Agrega la dirección o un enlace de Google Maps para que tus invitados puedan llegar.' });
  }
  for (const section of values.sections.filter(section => section.enabled)) {
    if (section.type === 'reception' || section.type === 'countdown' || section.type === 'cover' || section.type === 'location' || (section.type === 'rsvp' && section.rsvpMode === 'integrated')) continue;
    const complete = requiredSectionFields(section, true).length === 0;
    if (!complete) issues.push({ step: 4, message: `Completa «${section.title}» o desactívala.`, sectionId: section.id });
  }
  return issues;
}
export function guidedRecoveryStep(wizard: EditorWizard) {
  if (wizard.flow === 'content-v6') return [0, 1, 4, 5, 6].includes(wizard.step) ? wizard.step : 5;
  if (wizard.flow === 'content-v5') return Math.min(5, Math.max(0, wizard.step));
  if (wizard.flow === 'content-v4') return wizard.step === 3 ? 4 : wizard.step === 4 ? 3 : Math.min(5, Math.max(0, wizard.step));
  if (wizard.flow === 'content-v3') return wizard.step <= 0 ? 0 : wizard.step >= 2 ? 5 : (({ photos: 2, content: 4, appearance: 3 } as Record<string, number>)[wizard.activeExtra ?? ''] ?? 2);
  if (wizard.flow === 'content-v2') return [0, 2, 4, 3, 5][Math.min(4, Math.max(0, wizard.step))];
  return [0, 0, 4, 5][Math.min(3, Math.max(0, wizard.step))];
}
export function guidedRecoverySection(wizard: EditorWizard, sections: InviteSection[]) {
  const cover = sections.find(section => section.type === 'cover')?.id ?? '__cover';
  if (wizard.flow !== 'content-v4' && wizard.flow !== 'content-v5' && wizard.flow !== 'content-v6') return cover;
  const active = wizard.activeExtra?.replace(/^__add:/, '') ?? '';
  if (active === '__cover' || active === '__welcome') return cover;
  return active === '__more' || sections.some(section => section.id === active) ? active : cover;
}
export function guidedRecoveryAppearance(wizard: EditorWizard) {
  return wizard.flow === 'content-v4' ? wizard.activeExtra === 'appearance-custom' : (wizard.flow === 'content-v3' && wizard.step === 1 && wizard.activeExtra === 'appearance') || (wizard.flow === 'content-v2' && wizard.step === 3);
}
export function guidedRecoveryAppearanceStep(wizard: EditorWizard) {
  return wizard.flow === 'content-v5' ? invitationStyleStepIndex(wizard.activeExtra) : guidedRecoveryAppearance(wizard) ? 3 : 0;
}
export function eventPublicationIssues(event: { privacy?: string; eventType?: string; hostNames?: string | null; eventDate?: Date | null; eventTime?: string | null; venue?: string | null; address?: string | null; sections?: unknown }) {
  const issues = guidedPublicationIssues({eventType:event.eventType || 'other',hostNames:event.hostNames || '',eventDate:event.eventDate?.toISOString().slice(0,10) || '',eventTime:event.eventTime || '',venue:event.venue || '',address:event.address || '',sections:(Array.isArray(event.sections) ? event.sections : []) as InviteSection[]});
  if (event.privacy === "UNSET") issues.unshift({ step: 5, message: "Elige si tu invitación será pública o protegida con PIN." });
  return issues;
}
