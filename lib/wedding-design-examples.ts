import { weddingDesigns } from "./wedding-designs";
import type { InviteSection } from "./invitation-editor";

// Fictional content shared by the twelve designs for meaningful comparisons.
export const weddingExample = {
  name: "La boda de Sofía y Mateo", eventType: "wedding", hostNames: "Sofía y Mateo",
  date: "12 de octubre de 2027", eventDateKey: "2027-10-12", eventTime: "17:00",
  venue: "Hacienda Las Nubes", address: "Camino del Jardín 24, San Miguel de Allende",
  message: "Entre todos los lugares del mundo, nuestro favorito es estar juntos. Y entre todas las formas de celebrar, elegimos hacerlo contigo.",
  imageUrl: "/demo/boda/sofia-mateo.webp",
  sections: [
    { id: "story", type: "story", title: "Nuestra historia", content: "Todo empezó con una conversación que no queríamos terminar. Vinieron los viajes, las sobremesas y los pequeños días que construyeron algo enorme. Hoy comienza nuestro siguiente capítulo.", detail: "", link: "", imageUrl: "/demo/boda/sofia-mateo.webp", imagePosition: "after", enabled: true },
    { id: "ceremony", type: "ceremony", title: "El sí de nuestras vidas", content: "Nos encontraremos en la capilla de la hacienda para compartir nuestros votos.", detail: "Ceremonia · 17:00 h", link: "https://maps.google.com/?q=San+Miguel+de+Allende", imageUrl: "", enabled: true },
    { id: "program", type: "program", title: "Así será nuestro día", content: "17:00 — Ceremonia\n18:00 — Fotos y brindis\n19:00 — Cena en el jardín\n20:30 — Primer baile\n21:00 — Fiesta bajo las estrellas", detail: "Sin prisa. Con todo el corazón.", link: "", imageUrl: "", enabled: true },
    { id: "parents", type: "parents", title: "Con nuestras familias", content: "Con el amor de quienes nos vieron crecer y la alegría de quienes caminan a nuestro lado.", detail: "Nuestras raíces, nuestro hogar.", link: "", imageUrl: "", enabled: true },
    { id: "dress", type: "dress_code", title: "Viste para celebrar", content: "Formal de jardín. Te recomendamos zapatos cómodos para caminar sobre el césped y algo abrigador para la noche.", detail: "Elegante, natural y muy tú.", link: "", imageUrl: "/demo/boda/celebracion.webp", imagePosition: "before", enabled: true },
    { id: "gifts", type: "gifts", title: "El mejor regalo", content: "Tu presencia es nuestro regalo favorito. Si deseas tener un detalle con nosotros, puedes consultar nuestra mesa de regalos.", detail: "Gracias por acompañar este comienzo.", link: "", imageUrl: "", enabled: true },
    { id: "gallery", type: "gallery", title: "Días que se quedan", content: "Un poquito de nosotros, antes de nuestro gran día.", detail: "", link: "", imageUrl: "", imageUrls: ["/demo/boda/sofia-mateo.webp", "/demo/boda/ramo.webp", "/demo/boda/celebracion.webp"], enabled: true },
    { id: "rsvp", type: "rsvp", title: "¿Nos acompañas?", content: "Nos hará muy felices celebrar contigo. Confirma tu asistencia para que podamos preparar tu lugar.", detail: "", link: "", imageUrl: "", enabled: true, rsvpMode: "integrated" },
  ] satisfies InviteSection[],
};

export const weddingDesignExamples = weddingDesigns.map(design => ({ slug: `boda-${design.kind}`, design }));
