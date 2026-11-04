import type { InvitationTemplate } from './invitation-templates';
import { birthdayConfettiExample } from './birthday-designs';

export const birthdayPastelId = 'birthday-pastel-v1';
export const birthdayPastelAssets = ['bear-chef','cupcake','star-soft','star-gold','cloud-blue','cloud-light','sky','cake','duck','puppy-chef','balloons','conejo','confeti','elefante','gatito','globos','pastel2','regalo','tigre'] as const;
export const birthdayPastelTemplate: InvitationTemplate = {
  id: birthdayPastelId, eventType:'birthday', label:'Globos pastel', available:true, accent:'#526F87',
  assets:{topLeft:'/birthday/pastel/globos.webp',bottomRight:'/birthday/pastel/cake.webp',texture:'/birthday/pastel/sky.webp'},
};
export const birthdayPastelExample = {
  ...birthdayConfettiExample, templateId:birthdayPastelId, accent:'#526F87', name:'El cumpleaños de Emilia', hostNames:'Emilia',
  message:'Hay días que saben a pastel y se sienten como un abrazo. Ven a compartir conmigo una tarde de juegos, risas y deseos bonitos.',
  sections:birthdayConfettiExample.sections.map(section=>({...section,
    ...(section.type==='program'?{title:'La receta de un día feliz'}:{}),
    ...(section.type==='rsvp'?{title:'¿Te guardamos un lugar entre las nubes?'}:{}),
  })),
};
