import type { InvitationTemplate } from './invitation-templates';
import { birthdayConfettiExample } from './birthday-designs';

export const birthdayDinosaurId = 'birthday-dinosaur-v1';
export const birthdayDinosaurAssets = ['pterodactyl', 'longneck', 'hatchling', 'trex', 'triceratops', 'stegosaurus', 'comet', 'leaf-small', 'monstera', 'leaves', 'egg-orange', 'egg-purple', 'egg-blue', 'palm', 'volcano', 'jungle'] as const;
export const birthdayDinosaurTemplate: InvitationTemplate = {
  id: birthdayDinosaurId, eventType: 'birthday', label: 'Dinosaurios', available: true, accent: '#C46A32',
  assets: { topLeft: '/birthday/dinosaur/jungle.webp', bottomRight: '/birthday/dinosaur/trex.webp', decoration: '/birthday/dinosaur/leaves.webp' },
};
export const birthdayDinosaurExample = {
  ...birthdayConfettiExample, templateId: birthdayDinosaurId, accent: '#C46A32', name: 'El cumpleaños de Nico', hostNames: 'Nico', venue: 'Jardín de los Exploradores',
  message: '¡Prepara tus ganas de explorar! Vamos a celebrar mi cumpleaños entre dinosaurios, juegos y sorpresas. La aventura será mucho más bonita contigo.',
  sections: birthdayConfettiExample.sections.map(section => ({ ...section,
    ...(section.type === 'reception' ? { title: 'Nuestro punto de encuentro', content: 'Aquí empieza nuestra expedición: una tarde para jugar, descubrir y celebrar juntos.' } : {}),
    ...(section.type === 'program' ? { title: 'La ruta de la aventura', content: '16:00 — Llegada de exploradores\n16:30 — En busca de huevos de dinosaurio\n17:30 — Piñata y sorpresas\n18:00 — Pastel y un gran rugido' } : {}),
    ...(section.type === 'dress_code' ? { title: 'Equipo de explorador', content: 'Ropa cómoda, tenis y muchas ganas de jugar. ¡Nuestra expedición está por comenzar!' } : {}),
    ...(section.type === 'rsvp' ? { title: '¿Te unes a la expedición?' } : {}),
  })),
};
