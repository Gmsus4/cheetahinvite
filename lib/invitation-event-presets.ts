import type { SectionType } from './invitation-editor';
import { invitationPresentation, getInvitationEventContent } from './invitation-event-content';

type EventPreset = {
  message: string;
  sections: Partial<Record<SectionType, { title: string; content: string; enabled?: boolean }>>;
};

// Editable starting points, kept separate from the fictional public examples.
const presets: Record<string, EventPreset> = {
  wedding: {
    message: 'Nos hace muy felices compartir nuestra boda contigo. Te esperamos para celebrar juntos el comienzo de esta nueva etapa.',
    sections: {
      story: { title: 'Nuestra historia', content: 'Nuestra historia nos ha traído hasta este momento: elegirnos y comenzar una nueva etapa juntos. Nos encantará compartirla con las personas que queremos.', enabled: true },
      program: { title: 'Itinerario de nuestra boda', content: 'Bienvenida a nuestros invitados\nCeremonia\nFotografías y recuerdos\nRecepción y brindis\nNuestro primer baile\nCelebración en compañía', enabled: true },
      parents: { title: 'Nuestras familias', content: 'Gracias a nuestras familias y a quienes nos han acompañado con su cariño. Este día también es una celebración de todo el amor que nos rodea.', enabled: true },
      gifts: { title: 'Regalos', content: 'Compartir nuestra boda contigo es el mejor regalo. Si deseas tener un detalle, lo recibiremos con mucho cariño.', enabled: true },
      rsvp: { title: '¿Nos acompañas?', content: 'Confirma tu asistencia para que podamos preparar este día con mucho cariño.', enabled: true },
    },
  },
  birthday: {
    message: '¡Un año más para celebrar! Me encantará compartir mi cumpleaños contigo y sumar nuevos recuerdos juntos.',
    sections: {
      story: { title: '¡Vamos a celebrar!', content: 'Un nuevo cumpleaños es una oportunidad para agradecer, sonreír y disfrutar con las personas que quiero. ¡Me hará mucha ilusión que estés aquí!', enabled: true },
      program: { title: 'Así celebraremos', content: 'Bienvenida\nTiempo para convivir\nPastel y buenos deseos', enabled: true },
      parents: { title: 'Personas especiales', content: 'Gracias a quienes llenan mi vida de cariño y hacen que cada cumpleaños sea especial.', enabled: true },
      gifts: { title: 'Tu compañía es mi regalo', content: 'Lo que más me ilusiona es celebrar contigo. Si quieres tener un detalle, será recibido con mucho cariño.', enabled: true },
      gallery: { title: 'Mis mejores recuerdos', content: 'Momentos que me han acompañado hasta esta nueva vuelta al sol.' },
      rsvp: { title: '¿Vienes a mi cumpleaños?', content: 'Confirma si podrás acompañarme. ¡Quiero contar contigo para celebrar!', enabled: true },
    },
  },
  graduation: {
    message: 'Después de tanto esfuerzo, llega el momento de celebrar este logro. Gracias por acompañarme en el comienzo de una nueva etapa.',
    sections: {
      story: { title: 'Un logro para compartir', content: 'Cada aprendizaje, reto y esfuerzo me ha acercado a este momento. Hoy quiero celebrarlo con quienes me han acompañado en el camino.', enabled: true },
      ceremony: { title: 'Ceremonia de graduación', content: '' },
      program: { title: 'Celebremos este logro', content: 'Bienvenida\nUnas palabras de agradecimiento\nBrindis y celebración', enabled: true },
      parents: { title: 'Gracias por acompañarme', content: 'A mi familia, amistades y a quienes creyeron en mí: gracias por su apoyo y por ser parte de este logro.', enabled: true },
      gallery: { title: 'Recuerdos de esta etapa', content: 'Momentos y personas que hicieron especial este camino.' },
      rsvp: { title: '¿Celebramos juntos?', content: 'Confirma tu asistencia y acompáñame a celebrar este gran paso.', enabled: true },
    },
  },
  baby_shower: {
    message: 'Una nueva alegría está por llegar. Queremos compartir contigo la ilusión y el cariño de esta dulce espera.',
    sections: {
      story: { title: 'Una dulce espera', content: 'Estamos preparando nuestros corazones para una nueva llegada. Nos encantará reunir a las personas que queremos y compartir esta emoción contigo.', enabled: true },
      program: { title: 'Una celebración llena de cariño', content: 'Bienvenida\nJuegos y convivencia\nBuenos deseos para esta nueva etapa', enabled: true },
      parents: { title: 'Una familia que crece', content: 'Gracias por rodear de amor a nuestra familia en este momento tan especial.', enabled: true },
      gifts: { title: 'Detalles para la nueva llegada', content: 'Tu cariño y compañía son lo más importante. Si deseas traer un detalle para el bebé, lo recibiremos con mucha gratitud.', enabled: true },
      gallery: { title: 'Recuerdos de la espera', content: 'Pequeños momentos de una ilusión que crece cada día.' },
      rsvp: { title: '¿Nos acompañas al baby shower?', content: 'Confirma tu asistencia para compartir juntos esta dulce espera.', enabled: true },
    },
  },
  anniversary: {
    message: 'Celebramos nuestra historia, los recuerdos que hemos construido y todo lo que viene. Nos encantará compartir este aniversario contigo.',
    sections: {
      story: { title: 'Nuestra historia continúa', content: 'Cada momento compartido forma parte de nuestra historia. Hoy celebramos lo vivido y la ilusión de seguir construyendo nuevos recuerdos juntos.', enabled: true },
      ceremony: { title: 'Renovación de votos', content: '' },
      program: { title: 'Una celebración de nuestra historia', content: 'Bienvenida\nRecuerdos y palabras especiales\nBrindis por nuestra historia\nMúsica y convivencia', enabled: true },
      parents: { title: 'Quienes son parte de nuestra historia', content: 'Gracias a nuestra familia y amistades por acompañarnos y llenar de cariño cada etapa de nuestra vida.', enabled: true },
      gifts: { title: 'El regalo de estar juntos', content: 'Tu presencia es el mejor regalo. Nos hará mucha ilusión compartir una fotografía o una anécdota de nuestra historia contigo.', enabled: true },
      gallery: { title: 'Nuestros recuerdos', content: 'Una mirada a los momentos que seguimos guardando con cariño.' },
      rsvp: { title: 'Sigamos sumando recuerdos', content: 'Confirma tu asistencia y acompáñanos a celebrar nuestro aniversario.', enabled: true },
    },
  },
  other: {
    message: 'Queremos compartir un momento especial contigo. Te esperamos para disfrutar y crear nuevos recuerdos juntos.',
    sections: {
      story: { title: 'Un motivo para reunirnos', content: 'Los mejores momentos se disfrutan en compañía. Nos encantará contar contigo en esta celebración.', enabled: true },
      program: { title: 'Lo que compartiremos', content: 'Bienvenida\nMomento principal del encuentro\nTiempo para convivir\nDespedida y buenos deseos', enabled: true },
      parents: { title: 'Personas especiales', content: 'Gracias a quienes hacen posible este encuentro y nos acompañan con su cariño.', enabled: true },
      gallery: { title: 'Momentos para recordar', content: 'Recuerdos que nos gusta compartir.' },
      rsvp: { title: '¿Nos acompañas?', content: 'Confirma tu asistencia para que podamos preparar este encuentro.', enabled: true },
    },
  },
};

const titles: Record<SectionType, string> = {
  closing: 'Despedida', countdown: 'Cuenta regresiva', cover: 'Portada', location: 'Lugar del evento', story: 'Nuestra celebración', ceremony: 'Ceremonia', reception: 'Otra sede',
  program: 'Programa', parents: 'Personas especiales', dress_code: 'Código de vestimenta',
  gifts: 'Regalos', gallery: 'Galería', rsvp: 'Confirma tu asistencia', music: 'Nuestra playlist', custom: 'Información adicional',
};

export function invitationEventPreset(eventType: string) {
  return Object.hasOwn(presets, eventType) ? presets[eventType] : presets.other;
}

export function invitationSectionPreset(eventType: string, type: SectionType) {
  if (type === "closing") {
    const copy = invitationPresentation(eventType);
    return { title: copy.closingKicker, content: copy.closingMessage, enabled: true };
  }
  if (type === "countdown") return { title: "Cuenta regresiva", content: "", enabled: true };
  if (type === "ceremony") return { title: "Ceremonia", content: "", enabled: false };
  if (type === "cover") return { title: "Portada", content: "", enabled: true };
  if (type === "location") return { title: "Lugar del evento", content: "", enabled: true };
  const preset = invitationEventPreset(eventType).sections[type];
  return {
    title: preset?.title ?? (eventType === 'wedding' ? getInvitationEventContent(eventType).sections[type].title : titles[type]),
    content: preset?.content ?? '',
    enabled: preset?.enabled ?? false,
  };
}
