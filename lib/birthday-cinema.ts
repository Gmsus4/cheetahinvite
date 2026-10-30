import type { InvitationTemplate } from './invitation-templates';
import type { InviteSection } from './invitation-editor';
import { birthdayConfettiExample } from './birthday-designs';

export const birthdayCinemaId = 'birthday-cinema-v1';
export const birthdayCinemaAssets = ['deco-pattern', 'spotlight', 'camera-hand', 'camera', 'clapper', 'projector', 'mask', 'curtain', 'cinema-pin', 'red-fabric', 'popcorn', 'disc'] as const;
export type CinemaAsset = typeof birthdayCinemaAssets[number];
export const birthdayCinemaTemplate: InvitationTemplate = {
  id: birthdayCinemaId, eventType: 'birthday', label: 'Cine · Red Carpet', available: true, accent: '#9D2135',
  assets: { topLeft: '/birthday/cinema/curtain.webp', bottomRight: '/birthday/cinema/clapper.webp', decoration: '/birthday/cinema/cinema-pin.webp', texture: '/birthday/cinema/red-fabric.webp' },
};
export const birthdayCinemaExample = {
  ...birthdayConfettiExample,
  templateId: birthdayCinemaId, accent: '#9D2135', name: 'El estreno de un nuevo capítulo', hostNames: 'Alex', eventTime: '19:30', venue: 'Salón Cinema',
  message: 'Hay historias que merecen una gran celebración. Este cumpleaños quiero compartir la mía contigo: una noche de luces, música y momentos que se quedarán en nuestra memoria. Tú eres parte de mi mejor reparto.',
  sections: [
    { id: 'story', type: 'story', title: 'Un nuevo capítulo, contigo', content: 'Si mi vida fuera una película, mis escenas favoritas tendrían algo en común: las personas con las que las he compartido. Gracias por las risas, las conversaciones y por estar aquí para escribir un recuerdo más.', detail: 'Esta noche celebramos todo lo vivido y lo que está por venir.', link: '', imageUrl: '', enabled: true },
    { id: 'ceremony', type: 'ceremony', title: 'Un deseo bajo los reflectores', content: 'Haremos una pausa para encender las velitas, compartir unas palabras y brindar por este nuevo capítulo. Me encantará tenerte cerca en ese momento.', detail: '21:30 h · Mesa del pastel, en el salón principal.', link: '', imageUrl: '', enabled: true },
    { id: 'reception', type: 'reception', title: 'La noche continúa en la terraza', content: 'Después de la cena, nos vemos en la terraza del Salón Cinema. Allí nos esperan la pista de baile y una vista para seguir celebrando.', detail: '22:00 h · Acceso por las escaleras junto al vestíbulo.', link: 'https://www.google.com/maps/search/?api=1&query=Ciudad+de+M%C3%A9xico', imageUrl: '', enabled: true },
    { id: 'program', type: 'program', title: 'La cartelera de la noche', content: '19:30 — Llegada a la alfombra roja\n20:00 — Cena y primeras escenas\n21:30 — El brindis del protagonista\n22:00 — Música, baile y créditos abiertos', detail: 'La mejor escena será compartirla contigo.', link: '', imageUrl: '', enabled: true },
    { id: 'parents', type: 'parents', title: 'Mi reparto imprescindible', content: 'Mi familia\nMis amigos de siempre\nQuienes llegaron para quedarse', detail: 'Gracias por acompañarme en cada escena. Esta celebración también lleva un poquito de ustedes.', link: '', imageUrl: '', enabled: true },
    { id: 'dress', type: 'dress_code', title: 'Tu momento de brillar', content: 'Vestimenta de gala. Traje, vestido o ese conjunto con el que te sientes protagonista. Esta noche, la alfombra roja también es tuya.', detail: 'Negro, rojo y detalles dorados para una noche de película.', link: '', imageUrl: '', enabled: true },
    { id: 'gifts', type: 'gifts', title: 'El mejor papel lo tienes tú', content: 'No hace falta un gran regalo para crear una gran historia. Tu compañía, una buena charla y las ganas de celebrar son lo que más ilusión me hace.', detail: '', link: '', imageUrl: '', enabled: true },
    { id: 'music', type: 'music', title: 'Nuestra banda sonora', content: 'Toda gran película tiene canciones inolvidables. Estas son las que acompañarán nuestra noche. Prepárate para cantar, bailar y crear nuevos recuerdos.', detail: '', link: 'https://open.spotify.com/', imageUrl: '', enabled: true },
    { id: 'custom', type: 'custom', title: 'Antes de entrar a escena', content: 'Procura llegar unos minutos antes para disfrutar la bienvenida con calma. Habrá un espacio para dejar los abrigos y tomar las primeras fotos de la noche.', detail: 'Si necesitas apoyo con el acceso, avísame al confirmar tu asistencia.', link: '', imageUrl: '', enabled: true },
    { id: 'rsvp', type: 'rsvp', title: 'Tu entrada a esta historia', content: 'Confirma tu asistencia. Quiero reservar un lugar para ti en esta noche de estreno.', detail: '', link: '', imageUrl: '', rsvpMode: 'integrated', enabled: true },
  ] satisfies InviteSection[],
};
