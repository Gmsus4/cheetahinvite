import type { InviteSection, SectionType } from "./invitation-editor";
export const weddingDetails: { type: SectionType; title: string; question: string; help: string }[] = [
  { type: "story", title: "Nuestra historia", question: "¿Quieren contar su historia?", help: "Unas palabras sobre ustedes y cómo llegaron hasta aquí." },
  { type: "ceremony", title: "Ceremonia", question: "¿La ceremonia será en otro lugar?", help: "Agrega aquí el lugar y horario si son distintos a la celebración principal." },
  { type: "reception", title: "Recepción", question: "¿Habrá recepción en otro lugar?", help: "Comparte los datos del segundo lugar de la celebración." },
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
