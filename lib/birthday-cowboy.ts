import type { InvitationTemplate } from './invitation-templates';
import type { InviteSection } from './invitation-editor';
import { birthdayConfettiExample } from './birthday-designs';

export const birthdayCowboyId = 'birthday-cowboy-v1';
export const birthdayCowboyAssets = ['boots', 'bandana', 'longhorn-skull', 'horseshoe', 'belt', 'spur', 'desert-hero', 'lasso', 'desert-cactus', 'wagon-cactus', 'hat', 'tequila', 'leather', 'horse-paper', 'bull'] as const;
export type CowboyAsset = typeof birthdayCowboyAssets[number];

export const birthdayCowboyTemplate: InvitationTemplate = {
  id: birthdayCowboyId, eventType: 'birthday', label: 'Vaquero', available: true, accent: '#9B4B2B',
  assets: { topLeft: '/birthday/cowboy/desert-hero.webp', bottomRight: '/birthday/cowboy/hat.webp', decoration: '/birthday/cowboy/horseshoe.webp', texture: '/birthday/cowboy/leather.webp' },
};

export const birthdayCowboyExample = {
  ...birthdayConfettiExample,
  templateId: birthdayCowboyId, accent: '#9B4B2B', name: 'El cumpleaños de Santiago', hostNames: 'Santiago', eventTime: '18:00', venue: 'Rancho La Herradura',
  message: 'Este año quiero celebrar a mi manera: con espíritu vaquero, música y mi gente favorita. Ponte el sombrero y acompáñame a una fiesta que vamos a recordar con mucho cariño.',
  sections: [
    { id: 'program', type: 'program', title: 'Así se vive la fiesta', content: '18:00 — Bienvenida al rancho\n18:30 — Música y buena compañía\n20:00 — Cena para compartir\n21:00 — Pastel y a seguir bailando', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'dress', type: 'dress_code', title: 'Saca las botas y el sombrero', content: 'Mezclilla, botas y tu mejor estilo vaquero. Ven cómodo y listo para disfrutar de la fiesta.', detail: 'El pañuelo es opcional. ¡Las ganas de bailar no!', link: '', imageUrl: '', enabled: true },
    { id: 'gifts', type: 'gifts', title: 'El mejor regalo es verte aquí', content: 'No hace falta llegar con las manos llenas. Tu compañía y los recuerdos que vamos a crear juntos son lo que más quiero para mi cumpleaños.', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'music', type: 'music', title: 'Que no pare la música', content: 'Un poco de country, un poco de norteño y muchas canciones para cantar juntos. Así va a sonar nuestra fiesta.', detail: '', link: 'https://open.spotify.com/', imageUrl: '', enabled: true },
    { id: 'rsvp', type: 'rsvp', title: 'Te guardamos un lugar', content: 'Ayúdanos a preparar la fiesta. Confirma si nos acompañas y ven a celebrar con nosotros.', detail: '', link: '', imageUrl: '', rsvpMode: 'integrated', enabled: true },
  ] satisfies InviteSection[],
};
