import type { InvitationTemplate } from './invitation-templates';
import { birthdayConfettiExample } from './birthday-designs';
export const birthdaySpaceId='birthday-space-v1';
export const birthdaySpaceTemplate:InvitationTemplate={id:birthdaySpaceId,eventType:'birthday',label:'Espacial',available:true,accent:'#A89BFF',assets:{topLeft:'/birthday/space/astronaut-saturn.webp',bottomRight:'/birthday/space/earth.webp',decoration:'/birthday/space/cosmos.webp'}};
export const birthdaySpaceExample={...birthdayConfettiExample,templateId:birthdaySpaceId,accent:'#A89BFF',name:'El cumpleaños de Leo',hostNames:'Leo',venue:'Estación de juegos',message:'¡Atención, tripulación! Una nueva vuelta al Sol merece una aventura. Ven a celebrar conmigo entre planetas, juegos y sorpresas.',sections:birthdayConfettiExample.sections.map(s=>({...s,title:s.type==='program'?'Nuestro plan de misión':s.type==='rsvp'?'¿Te unes a mi tripulación?':s.type==='dress_code'?'Tu equipo de exploración':s.title}))};
