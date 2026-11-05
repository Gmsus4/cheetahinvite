import { invitationEventTypes } from "./invitation-event-content";
import { sharedInvitationId } from "./shared-invitation";

// Data compatibility only. Retired templates have no renderer or bundled artwork.
const retiredBirthdayIds = new Set(["birthday-cinema-v1","birthday-cowboy-v1","birthday-confetti-v1","birthday-dinosaur-v1","birthday-disco-v1","birthday-elegant-v1","birthday-gamer-v1","birthday-neon-v1","birthday-pastel-v1","birthday-space-v1"]);
const retiredWeddingIds = new Set(["floral","editorial","minimal","garden","blossom","bougainvillea","sunlight","olive","mediterranean","art-deco","love-letter","starlight"].flatMap(kind => [`wedding-${kind}-v1`, `wedding-${kind}-v2`]));

export function isInvitationTemplate(eventType: string, id: string) {
  if (!(invitationEventTypes as readonly string[]).includes(eventType)) return false;
  if (id === "none" || id === sharedInvitationId) return true;
  return eventType === "wedding" ? retiredWeddingIds.has(id) || /^plantilla[1-8]$/.test(id)
    : eventType === "birthday" && retiredBirthdayIds.has(id);
}
