import { templateManifest } from './generated-invitation-templates';

export type DecorationSlot = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'separator' | 'flower' | 'decoration';
export type InvitationTemplate = { id: string; eventType: string; label: string; available: boolean; accent?: string | null; assets: Partial<Record<DecorationSlot, string>> };
export const invitationTemplates: InvitationTemplate[] = templateManifest;
export function getInvitationTemplate(eventType: string, id: string) {
  return invitationTemplates.find((template) => template.eventType === eventType && template.id === id && template.available) ?? null;
}
export function isInvitationTemplate(eventType: string, id: string) {
  return id === 'none' || Boolean(getInvitationTemplate(eventType, id));
}

export function templateAccent(eventType: string, id: string) {
  return getInvitationTemplate(eventType, id)?.accent ?? null;
}
