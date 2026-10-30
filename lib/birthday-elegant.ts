import type { InvitationTemplate } from './invitation-templates';
import type { InviteSection } from './invitation-editor';
import { birthdayConfettiExample } from './birthday-designs';

export const birthdayElegantId = 'birthday-elegant-v1';
export const birthdayElegantAssets = ['palm', 'balloons', 'party-collection', 'confetti', 'champagne', 'marble', 'silk', 'monstera', 'onyx-pattern', 'ornament-frame', 'gold-waves'] as const;
export type ElegantAsset = typeof birthdayElegantAssets[number];

export const birthdayElegantTemplate: InvitationTemplate = {
  id: birthdayElegantId, eventType: 'birthday', label: 'Elegante · Black & Gold', available: true, accent: '#D4B77A',
  assets: { topLeft: '/birthday/elegant/marble.webp', bottomRight: '/birthday/elegant/balloons.webp', decoration: '/birthday/elegant/monstera.webp', texture: '/birthday/elegant/silk.webp' },
};

export const birthdayElegantExample = {
  ...birthdayConfettiExample,
  templateId: birthdayElegantId, accent: '#D4B77A', name: 'Una noche para celebrar', hostNames: 'Valeria', eventTime: '20:00', venue: 'Salón Áurea',
  message: 'Cumplir cuarenta es mirar atrás con gratitud y hacia adelante con ilusión. Quiero celebrar este momento con una buena cena, una copa en la mano y las personas que hacen mi vida especial. Me encantará compartir esta noche contigo.',
  sections: [
    { id: 'program', type: 'program', title: 'El ritmo de la noche', content: '20:00 — Bienvenida y cóctel\n20:45 — Cena para compartir\n22:00 — Un brindis y un deseo\n22:30 — Música y celebración', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'dress', type: 'dress_code', title: 'La elegancia está en ti', content: 'Vestimenta formal. Elige ese atuendo con el que te sientes especial y ven a disfrutar de una noche inolvidable.', detail: 'Un detalle en negro o dorado será bienvenido.', link: '', imageUrl: '', enabled: true },
    { id: 'gifts', type: 'gifts', title: 'El lujo de tenerte cerca', content: 'Tu presencia es mi mejor regalo. Lo que más quiero es compartir una mesa, una conversación y un recuerdo bonito contigo.', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'music', type: 'music', title: 'La banda sonora de esta noche', content: 'Canciones que nos traen recuerdos y otras que están por convertirse en favoritas. Una selección para acompañar nuestra celebración.', detail: '', link: 'https://open.spotify.com/', imageUrl: '', enabled: true },
    { id: 'rsvp', type: 'rsvp', title: 'Un lugar en la mesa', content: 'Será un placer contar contigo. Confirma tu asistencia para preparar cada detalle de esta noche.', detail: '', link: '', imageUrl: '', rsvpMode: 'integrated', enabled: true },
  ] satisfies InviteSection[],
};
