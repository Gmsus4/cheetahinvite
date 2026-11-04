import type { InvitationTemplate } from './invitation-templates';
import type { InviteSection } from './invitation-editor';
import { birthdayConfettiExample } from './birthday-designs';

export const birthdayGamerId = 'birthday-gamer-v1';
export const birthdayGamerAssets = ['crewmate', 'fall-guy', 'llama', 'lucky-block', 'mario-kart', 'isabelle', 'pixel-dog', 'poco', 'peach-kart', 'minecraft-world', 'spike', 'chicken-rider', 'abejaminecraft', 'caballoajedrez', 'clashroyale1', 'clashroyale2', 'pelotabeisbol', 'peonajedrez'] as const;
export type GamerAsset = typeof birthdayGamerAssets[number];

export const birthdayGamerTemplate: InvitationTemplate = {
  id: birthdayGamerId, eventType: 'birthday', label: 'Gamer', available: true, accent: '#7450CC',
  assets: { topLeft: '/birthday/gamer/lucky-block.webp', bottomRight: '/birthday/gamer/mario-kart.webp', decoration: '/birthday/gamer/crewmate.webp' },
};

export const birthdayGamerExample = {
  ...birthdayConfettiExample,
  templateId: birthdayGamerId, accent: '#7450CC', name: 'El cumpleaños de Alex', hostNames: 'Alex', venue: 'Salón Player One',
  message: '¡Estás en mi equipo! Vamos a celebrar mi cumpleaños con juegos, retos y muchas risas. La mejor parte de esta partida es compartirla contigo.',
  sections: [
    { id: 'program', type: 'program', title: 'El plan de la partida', content: '16:00 — Llegada del equipo\n16:30 — Juegos y retos\n17:30 — Piñata y recompensas\n18:00 — Pastel y un nuevo nivel', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'dress', type: 'dress_code', title: 'Tu mejor skin: ser tú', content: 'Ven con ropa cómoda y tenis para jugar. ¡Puedes traer una prenda de tu videojuego favorito!', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'gifts', type: 'gifts', title: 'El mejor loot es tu compañía', content: 'No necesitas desbloquear ningún regalo. Lo que más ilusión me hace es que estés aquí para celebrar conmigo.', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'music', type: 'music', title: 'El soundtrack de la fiesta', content: 'Una buena partida merece buena música. Estas canciones nos van a acompañar entre juegos, baile y pastel.', detail: '', link: 'https://open.spotify.com/', imageUrl: '', enabled: true },
    { id: 'rsvp', type: 'rsvp', title: '¿Te unes a mi equipo?', content: 'Estamos preparando un lugar para ti. Confirma tu asistencia y prepárate para jugar.', detail: '', link: '', imageUrl: '', rsvpMode: 'integrated', enabled: true },
  ] satisfies InviteSection[],
};
