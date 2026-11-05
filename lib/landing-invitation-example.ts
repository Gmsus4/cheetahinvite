import { exampleStories } from "./invitation-example-stories";
import type { InviteSection } from "./invitation-editor";
import { eventExampleSections, makeEventExampleSection, getInvitationEventContent, invitationEventTypes } from "./invitation-event-content";
import { sharedInvitationDesign } from "./shared-invitation";

const baseExamples = invitationEventTypes.map((eventType) => {
  const content = getInvitationEventContent(eventType);
  const wedding = eventType === "wedding";
  const birthday = eventType === "birthday";
  const graduation = eventType === "graduation";
  const babyShower = eventType === "baby_shower";
  const galleryImages = wedding ? ["/demo/boda/sofia-mateo.webp", "/demo/boda/celebracion.webp", "/demo/boda/ramo.webp"]
    : birthday ? ["/demo/birthday/valeria.webp", "/demo/birthday/cena.webp", "/demo/birthday/pastel.webp"]
    : graduation ? ["/demo/graduacion/graduacion.webp", "/demo/graduacion/diploma.webp", "/demo/graduacion/auditorio.webp"]
    : babyShower ? ["/demo/babyshower/padres.webp", "/demo/babyshower/dulce.webp", "/demo/babyshower/jardin.webp"] : [];
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
      // The wedding background has a black base behind its yellow flowers.
      accent: wedding ? "#000000" : sharedInvitationDesign.palettes[0].accent,
      typography: sharedInvitationDesign.typography,
      bodyTypography: sharedInvitationDesign.bodyTypography,
      eventType,
      message: content.message,
      imageUrl: wedding ? "/demo/boda/sofia-mateo.webp" : birthday ? "/demo/birthday/valeria.webp" : graduation ? "/demo/graduacion/graduacion.webp" : babyShower ? "/demo/babyshower/padres.webp" : "",
      sections: [...eventExampleSections(eventType), ...(!eventExampleSections(eventType).some(section => section.type === "gallery") ? [makeEventExampleSection("gallery", eventType)] : [])].map((section) => ({
        ...section, imageUrl: sectionImages[section.type] ?? section.imageUrl,
        ...(section.type === "gallery" ? { imageUrls: galleryImages, enabled: galleryImages.length > 0 } : {}),
        ...(section.type === "rsvp" ? { rsvpMode: "integrated" as const } : {}),
      })),
    },
  };
});

export const landingEventExamples = baseExamples.map(base => {
  const story = exampleStories[base.invitation.eventType];
  const eventType = base.invitation.eventType;
  const date = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(story.eventDateKey + "T12:00:00Z"));
  const address = `Calle del Encuentro 120, Centro, ${story.city}`;
  const labels: Record<string, string[]> = {
    wedding: ["Recepción de invitados", "Cena y brindis", "Baile de celebración"],
    birthday: ["Bienvenida y convivencia", "Comida y convivencia", "Pastel y buenos deseos"],
    graduation: ["Bienvenida", "Palabras de agradecimiento", "Brindis por los nuevos caminos"],
    baby_shower: ["Bienvenida y comida", "Juegos y buenos deseos", "Agradecimientos y despedida"],
    anniversary: ["Bienvenida", "Comida y recuerdos compartidos", "Brindis y música"],
    other: ["Bienvenida y presentación", "Actividad y convivencia", "Agradecimientos y cierre"],
  };
  const start = Number(story.eventTime.slice(0, 2)) * 60 + Number(story.eventTime.slice(3));
  const program = labels[eventType].map((label, offset) => {
    const minutes = start + offset * 60;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")} — ${label}`;
  }).join("\n");
  const make = (type: InviteSection["type"], title: string, content: string, extra: Partial<InviteSection> = {}): InviteSection => ({ id: `example-${story.key}-${type}`, type, title, content, detail: "", link: "", imageUrl: "", imageUrls: [], enabled: true, ...extra });
  const fallbackGallery = base.invitation.sections.find(section => section.type === "gallery")?.imageUrls ?? [];
  const sections = [
    make("story", eventType === "wedding" || eventType === "anniversary" ? "Nuestra historia" : "El motivo de celebrar", story.story),
    make("reception", "El lugar del encuentro", `Te esperamos en ${story.venue}, en ${story.city}.\n${address}.`, { detail: `${date} · ${story.eventTime}`, link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(story.venue + " " + address)}` }),
    make("program", "Así compartiremos el día", program),
    make("parents", "Quienes nos acompañan", "Nuestra familia y nuestras amistades. Gracias por compartir este momento y por ser parte de nuestra historia."),
    make("dress_code", "Para disfrutar la celebración", story.eventTime < "17:00" ? "Ropa cómoda para una reunión de día. Te recomendamos calzado cómodo y protección para el sol." : "Vestimenta casual elegante. Elige ropa y calzado con los que puedas disfrutar de la convivencia."),
    ...(["wedding", "birthday", "baby_shower", "anniversary"].includes(eventType) ? [make("gifts", "Tu compañía es el mejor regalo", "Lo más importante para nosotros es compartir este día contigo. No es necesario traer un regalo.")] : []),
    make("gallery", "Recuerdos para compartir", "Momentos que nos recuerdan por qué vale la pena celebrar.", { imageUrls: fallbackGallery, enabled: fallbackGallery.length > 0 }),
    make("rsvp", "¿Nos acompañas?", "Confirma tu asistencia para que podamos preparar tu lugar. Este formulario es una demostración y no envía respuestas reales.", { rsvpMode: "integrated" }),
  ];
  return {
    slug: `${getInvitationEventContent(eventType).slug}-${story.key}`, label: story.title,
    typeLabel: base.label, available: true,
    imageFolder: `/demo/eventos/${getInvitationEventContent(eventType).slug}/${story.key}`,
    invitation: { ...base.invitation, name: story.title, hostNames: story.hostNames, date, eventDateKey: story.eventDateKey, eventTime: story.eventTime, venue: story.venue, address, message: `Nos encantará compartir este encuentro contigo. ${story.story}`, sections },
  };
});
