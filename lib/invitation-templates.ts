import { birthdayCinemaTemplate } from './birthday-cinema';
import { birthdayElegantTemplate } from './birthday-elegant';
import { birthdayCowboyTemplate } from './birthday-cowboy';
import { birthdayGamerTemplate } from './birthday-gamer';
import { birthdayDinosaurTemplate } from './birthday-dinosaur';
import { birthdaySpaceTemplate } from './birthday-space';
import { templateManifest } from './generated-invitation-templates';
import { getWeddingDesign } from './wedding-designs';
import { birthdayDiscoTemplate } from './birthday-disco';
import { birthdayNeonTemplate } from './birthday-neon';
import { birthdayPastelTemplate } from './birthday-pastel';
import { birthdayConfettiTemplate } from './birthday-designs';
import { invitationEventTypes } from './invitation-event-content';
import { sharedInvitationId, sharedInvitationDesign } from './shared-invitation';

export type DecorationSlot = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'separator' | 'flower' | 'decoration' | 'texture';
export type InvitationTemplate = { id: string; eventType: string; label: string; available: boolean; accent?: string | null; assets: Partial<Record<DecorationSlot, string>>; decorations?: string[] };
// Retired identities only resolve stored events; they are no longer offered.
const retiredTemplates: InvitationTemplate[] = [...templateManifest.filter(template => template.eventType !== 'wedding'), birthdaySpaceTemplate, birthdayConfettiTemplate, birthdayPastelTemplate, birthdayNeonTemplate, birthdayDiscoTemplate, birthdayDinosaurTemplate, birthdayGamerTemplate, birthdayCowboyTemplate, birthdayElegantTemplate, birthdayCinemaTemplate];
export const invitationTemplates: InvitationTemplate[] = [...templateManifest.filter(template => template.eventType === 'wedding'), ...invitationEventTypes.map(eventType => ({ id: sharedInvitationId, eventType, label: 'Celebración', available: true, accent: sharedInvitationDesign.palettes[0].accent, assets: {} }))];
export function getInvitationTemplate(eventType: string, id: string) {
  return [...invitationTemplates, ...retiredTemplates].find((template) => template.eventType === eventType && template.id === id && template.available) ?? null;
}
export function isInvitationTemplate(eventType: string, id: string) {
  return id === 'none' || (eventType === 'wedding' && Boolean(getWeddingDesign(id))) || Boolean(getInvitationTemplate(eventType, id));
}

export function templateAccent(eventType: string, id: string) {
  return getInvitationTemplate(eventType, id)?.accent ?? null;
}

export function sectionDecoration(template: InvitationTemplate | null, sectionType: string) {
  if (!template) return undefined;
  const decorations = template.decorations?.length ? template.decorations : template.assets.decoration ? [template.assets.decoration] : [];
  const positions: Record<string, number> = { program: 0, music: 1, story: 2, dress_code: 3, gifts: 4, parents: 5, ceremony: 6, reception: 7, gallery: 8, custom: 9, rsvp: 10 };
  const index = positions[sectionType];
  return decorations[index] ?? ((sectionType === 'program' || sectionType === 'music') ? decorations[0] : undefined);
}
