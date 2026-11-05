import type { InviteSection } from "@/components/dashboard/EventEditor";
import { getInvitationTemplate } from "./invitation-templates";
import { eventExampleSections, getInvitationEventContent, invitationEventTypes } from "./invitation-event-content";
import { sharedInvitationId, sharedInvitationDesign } from "./shared-invitation";

// Use available editor decorations and their actual catalog names.
const exampleStyles = [
  { slug: "flores-blancas", templateId: "plantilla5" },
  { slug: "bugambilias", templateId: "plantilla3" },
  { slug: "flores-amarillas", templateId: "plantilla4" },
];

export const landingInvitationStyles = exampleStyles.flatMap(({ slug, templateId }) => {
  const template = getInvitationTemplate("wedding", templateId);
  return template ? [{ slug, template }] : [];
});

// Fictional data shared by every example; customer invitations are not used.
export const landingInvitationExample = {
  ...getInvitationEventContent("wedding").demo,
  eventType: "wedding",
  message: getInvitationEventContent("wedding").message,
  imageUrl: "/demo/boda/sofia-mateo.webp",
  heroHorizontal: "center",
  heroVertical: "bottom",
  sections: [
    {
      id: "example-story", type: "story", title: "Nuestra historia",
      content: "Entre conversaciones, viajes y momentos sencillos fuimos construyendo una historia juntos. Hoy queremos celebrar este nuevo comienzo con las personas que más queremos.",
      detail: "", link: "", imageUrl: "/demo/boda/sofia-mateo.webp", enabled: true,
    },
    {
      id: "example-ceremony", type: "ceremony", title: "La celebración",
      content: "Nos vemos en el jardín de Hacienda Las Nubes para compartir la ceremonia, el brindis y una noche para recordar.",
      detail: "12 de octubre de 2027 · 5:00 p.m.", link: "", imageUrl: "/demo/boda/celebracion.webp", enabled: true,
    },
    {
      id: "example-program", type: "program", title: "Programa",
      content: "17:00 — Ceremonia\n18:00 — Brindis\n19:00 — Cena y celebración",
      detail: "", link: "", imageUrl: "", enabled: true,
    },
    {
      id: "example-gallery", type: "gallery", title: "Nuestros momentos",
      content: "Los detalles de un día que queremos compartir contigo.",
      detail: "", link: "", imageUrl: "",
      imageUrls: ["/demo/boda/sofia-mateo.webp", "/demo/boda/celebracion.webp", "/demo/boda/ramo.webp"],
      enabled: true,
    },
    {
      id: "example-dress-code", type: "dress_code", title: "Código de vestimenta",
      content: "Formal. Elige algo con lo que te sientas especial y puedas disfrutar de la celebración.",
      detail: "", link: "", imageUrl: "", enabled: true,
    },
  ] satisfies InviteSection[],
};

// Every occasion uses real editor capabilities. Only weddings have floral assets.
export const landingEventExamples = invitationEventTypes.map((eventType) => {
  const content = getInvitationEventContent(eventType);
  const wedding = eventType === "wedding";
  const birthday = eventType === "birthday";
  const graduation = eventType === "graduation";
  const babyShower = eventType === "baby_shower";
  const sectionImages: Partial<Record<InviteSection["type"], string>> = birthday ? {
    story: "/demo/birthday/pastel.webp",
    reception: "/demo/birthday/cena.webp",
    program: "/demo/birthday/pastel.webp",
  } : graduation ? {
    story: "/demo/graduacion/diploma.webp",
    ceremony: "/demo/graduacion/auditorio.webp",
  } : babyShower ? {
    story: "/demo/babyshower/dulce.webp",
    reception: "/demo/babyshower/jardin.webp",
    program: "/demo/babyshower/dulce.webp",
  } : {};
  return {
    slug: content.slug,
    label: content.label,
    available: true,
    invitation: {
      ...content.demo,
      accent: sharedInvitationDesign.palettes[0].accent,
      typography: sharedInvitationDesign.typography,
      bodyTypography: sharedInvitationDesign.bodyTypography,
      eventType,
      message: content.message,
      locationImageUrl: babyShower ? "/demo/babyshower/jardin.webp" : birthday ? "/demo/birthday/cena.webp" : undefined,
      imageUrl: wedding ? landingInvitationExample.imageUrl : birthday ? "/demo/birthday/valeria.webp" : graduation ? "/demo/graduacion/graduacion.webp" : babyShower ? "/demo/babyshower/padres.webp" : "",
      heroHorizontal: "center",
      heroVertical: "center",
      templateId: sharedInvitationId,
      texture: "none",
      sections: eventExampleSections(eventType).map((section) => ({
        ...section, imageUrl: sectionImages[section.type] ?? section.imageUrl,
        ...(section.type === "rsvp" ? { rsvpMode: "integrated" as const } : {}),
      })),
    },
  };
});
