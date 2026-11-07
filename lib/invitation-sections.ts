import type { InviteSection, SectionType } from "./invitation-editor";

export function locationSectionTitle(section: Pick<InviteSection, "title" | "titleCustomized">) {
  return section.title === "La celebración" && !section.titleCustomized ? "Lugar del evento" : section.title;
}

export function usesPrimaryLocation(sections: InviteSection[]) {
  const primary = sections.find(section => section.type === "location");
  if (primary) return primary.enabled;
  return true;
}

export const weddingDetails: { type: SectionType; title: string; question: string; help: string }[] = [
  { type: "story", title: "Nuestra historia", question: "¿Quieren contar su historia?", help: "Unas palabras sobre ustedes y cómo llegaron hasta aquí." },
  { type: "ceremony", title: "Ceremonia", question: "¿Habrá una ceremonia?", help: "Opcional: iglesia, boda civil o acto formal. El lugar de la fiesta se configura en Lugar del evento." },
  { type: "program", title: "Itinerario", question: "¿Quieren compartir el itinerario?", help: "Ayuda a tus invitados a conocer los momentos del día." },
  { type: "parents", title: "Nuestras familias", question: "¿Quieren mencionar a sus familias?", help: "Un espacio para padres o personas especiales." },
  { type: "dress_code", title: "Código de vestimenta", question: "¿Habrá código de vestimenta?", help: "Comparte el estilo de ropa y cualquier recomendación." },
  { type: "gifts", title: "Regalos", question: "¿Tendrán mesa de regalos o lluvia de sobres?", help: "Incluye un mensaje y, si tienes, un enlace a la mesa de regalos." },
  { type: "gallery", title: "Nuestros momentos", question: "¿Quieren incluir más fotografías?", help: "Una galería con sus recuerdos favoritos." },
  { type: "rsvp", title: "¿Nos acompañas?", question: "¿Quieren recibir confirmaciones?", help: "Sus invitados podrán responder aquí o desde un enlace de WhatsApp." },
];

export function orderedInvitationSections(sections: InviteSection[]) {
  const ordered = weddingDetails.flatMap(detail => sections.filter(section => section.type === detail.type));
  return [...ordered, ...sections.filter(section => !ordered.includes(section))];
}
