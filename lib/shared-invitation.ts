import { getWeddingDesign, weddingDesigns, type WeddingDesign } from "./wedding-designs";

export const sharedInvitationId = "celebration-v1";
export const sharedInvitationDesign: WeddingDesign = {
  ...weddingDesigns[0], id: sharedInvitationId, label: "Celebración",
  description: "Tus fotos y tu historia en una invitación para cualquier ocasión.",
};

export function invitationAppearance(eventType: string, templateId: string) {
  return eventType === "wedding" ? getWeddingDesign(templateId) ?? sharedInvitationDesign : sharedInvitationDesign;
}
