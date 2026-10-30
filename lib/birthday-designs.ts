import type { InvitationTemplate } from './invitation-templates';
import type { InviteSection } from './invitation-editor';

export const birthdayConfettiId = 'birthday-confetti-v1';
export const birthdayConfettiTemplate: InvitationTemplate = {
  id: birthdayConfettiId, eventType: 'birthday', label: 'Confeti · Animalitos de fiesta',
  available: true, accent: '#387D81',
  assets: { topLeft: '/birthday/confetti/party-dino.webp', bottomRight: '/birthday/confetti/bear.webp', texture: '/textures/wedding/cotton.webp' },
};

export const birthdayConfettiExample = {
  eventType: 'birthday', templateId: birthdayConfettiId, accent: '#387D81',
  name: 'El cumpleaños de Mateo', hostNames: 'Mateo', date: 'sábado, 14 de noviembre de 2026',
  eventDateKey: '2026-11-14', eventTime: '16:00', venue: 'Jardín de las Mariposas',
  address: 'Ciudad de México', imageUrl: '',
  message: 'Un día para jugar, reír y llenar de recuerdos bonitos. ¡Ven a celebrar mi cumpleaños conmigo!',
  sections: [
    { id: 'party', type: 'reception', title: 'Aquí empieza la diversión', content: 'Nos vemos en el jardín para una tarde de juegos, sorpresas y muchas sonrisas.', detail: 'No olvides traer todas tus ganas de jugar.', link: '', imageUrl: '', enabled: true },
    { id: 'program', type: 'program', title: 'Un día lleno de cosas bonitas', content: '16:00 — ¡Bienvenidos a la fiesta!\n16:30 — Juegos y aventuras\n17:30 — Piñata y sorpresas\n18:00 — Pastel y un gran deseo', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'dress', type: 'dress_code', title: 'Listos para la aventura', content: 'Ropa cómoda, tus tenis favoritos y una sonrisa enorme.', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'gifts', type: 'gifts', title: 'El mejor regalo eres tú', content: 'Lo que más ilusión me hace es compartir este día contigo. Tu compañía es mi regalo favorito.', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'rsvp', type: 'rsvp', title: '¿Vienes a mi fiesta?', content: 'Queremos preparar algo especial para cada invitado. Confirma si nos acompañas.', detail: '', link: '', imageUrl: '', rsvpMode: 'integrated', enabled: true },
  ] satisfies InviteSection[],
};
