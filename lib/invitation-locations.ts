import type { InviteSection } from "./invitation-editor";
import { invitationExternalUrl, invitationGoogleMapsUrl } from "./invitation-links";

// Retire the duplicate reception block without discarding its saved content.
export function normalizeEventLocations(venue: string, address: string, sections: InviteSection[]) {
  const reception = sections.find(section => section.type === "reception" && section.enabled);
  if (!reception) return { venue, address, sections };
  const primary = sections.find(section => section.type === "location");
  const adoptReception = !venue.trim() && !address.trim() && !primary?.link.trim();
  const exactLink = invitationExternalUrl(reception.link.trim())
    ?? invitationGoogleMapsUrl(`https://${reception.link.trim()}`);
  const location: InviteSection = primary ? {
    ...primary,
    enabled: true,
    link: primary.link || (adoptReception ? exactLink : null) || "",
    imageUrl: primary.imageUrl || (adoptReception ? reception.imageUrl : ""),
    imageUrls: primary.imageUrls?.length ? primary.imageUrls : adoptReception ? reception.imageUrls : primary.imageUrls,
  } : {
    ...reception, id: "event-location", type: "location", title: "Lugar del evento",
    titleCustomized: false, content: "", detail: "", link: adoptReception ? exactLink || "" : "", enabled: true,
    imageUrl: adoptReception ? reception.imageUrl : "", imageUrls: adoptReception ? reception.imageUrls : [],
  };
  return {
    venue: adoptReception ? reception.content : venue,
    address: adoptReception ? exactLink ? "" : reception.link : address,
    sections: [
      ...sections.map(section => section.type === "location" ? location
        : section.type === "reception" ? { ...section, enabled: false } : section),
      ...(!primary ? [location] : []),
    ],
  };
}
