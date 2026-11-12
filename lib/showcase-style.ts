import type { EventData, InvitationProps, InviteSection } from "./invitation-editor";
import { sharedInvitationDesign, sharedInvitationId } from "./shared-invitation";

/** Copy only public invitation content. Account, access, payment and URL fields stay separate. */
export function showcaseStyleData(invitation: InvitationProps, previous?: EventData) {
  const remaining = Array.isArray(previous?.sections) ? [...previous.sections] as InviteSection[] : [];
  const sections = invitation.sections.map((source, index) => {
    const match = remaining.findIndex(section => section.type === source.type);
    const existing = match >= 0 ? remaining.splice(match, 1)[0] : undefined;
    const section = structuredClone(source);
    // Example contact details must never receive a user's confirmations.
    if (section.type === "rsvp") {
      section.rsvpMode = "integrated";
      section.link = "";
      delete section.whatsappPhone;
      delete section.whatsappMessage;
    }
    if (!existing) return { ...section, id: `style-${index}` };
    return {
      ...section, id: existing.id, title: existing.title, titleCustomized: existing.titleCustomized,
      content: existing.content, detail: existing.detail, link: existing.link,
      imageUrl: existing.imageUrl || section.imageUrl,
      imageUrls: existing.imageUrls?.length ? [...existing.imageUrls] : existing.imageUrl ? [] : section.imageUrls,
      ...(section.type === "rsvp" ? {
        rsvpMode: existing.rsvpMode ?? "external", maxCompanions: existing.maxCompanions,
        whatsappPhone: existing.whatsappPhone, whatsappMessage: existing.whatsappMessage,
      } : {}),
    };
  });
  // Retain personal blocks that are absent from the selected example.
  const combined = [...sections, ...structuredClone(remaining)];
  const usedIds = new Set<string>();
  for (const [index, section] of combined.entries()) {
    let id = section.id;
    while (usedIds.has(id)) id = `${id}-${index}`;
    section.id = id;
    usedIds.add(id);
  }
  return {
    templateId: sharedInvitationId, texture: "none",
    imagePalette: invitation.imagePalette ? structuredClone(invitation.imagePalette) : undefined,
    textColorMode: invitation.textColorMode ?? "auto", textColor: invitation.textColor ?? "#FFFFFF",
    accent: invitation.accent, typography: invitation.typography ?? sharedInvitationDesign.typography,
    bodyTypography: invitation.bodyTypography ?? sharedInvitationDesign.bodyTypography,
    coverLayout: invitation.coverLayout ?? "split", panelStyle: invitation.panelStyle ?? "auto",
    glassBorder: invitation.glassBorder ?? true, blurIntensity: invitation.blurIntensity ?? 50,
    backgroundBlurIntensity: invitation.backgroundBlurIntensity ?? 0,
    backgroundDimIntensity: invitation.backgroundDimIntensity ?? 0,
    showSectionIcons: invitation.showSectionIcons ?? true, sectionCorners: invitation.sectionCorners ?? "rounded",
    heroHorizontal: "center", heroVertical: "center",
    buttonShape: sharedInvitationDesign.buttons.shape, buttonFilled: sharedInvitationDesign.buttons.filled,
    buttonIcons: sharedInvitationDesign.buttons.icons, buttonBorder: sharedInvitationDesign.buttons.border,
    buttonBold: sharedInvitationDesign.buttons.bold,
    imageUrl: previous?.imageUrl || invitation.imageUrl,
    backgroundImageUrl: previous?.backgroundImageUrl || invitation.backgroundImageUrl || "",
    sections: combined,
  };
}
