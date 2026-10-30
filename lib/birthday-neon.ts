import type { InvitationTemplate } from './invitation-templates';
import type { InviteSection } from './invitation-editor';

export const birthdayNeonId = 'birthday-neon-v1';
export const birthdayNeonAssets = ['astronaut','pixel-cat','headphones','confetti','party-popper','rocket','alien'] as const;
export const birthdayNeonTemplate: InvitationTemplate = {
  id:birthdayNeonId,eventType:'birthday',label:'Neón',available:true,accent:'#F46BDE',
  assets:{topLeft:'/birthday/neon/rocket.webp',bottomRight:'/birthday/neon/astronaut.webp',decoration:'/birthday/neon/confetti.webp'},
};
export const birthdayNeonExample = {
  eventType:'birthday',templateId:birthdayNeonId,accent:'#F46BDE',name:'El cumpleaños de Alex',hostNames:'Alex',
  date:'sábado, 14 de noviembre de 2026',eventDateKey:'2026-11-14',eventTime:'19:00',venue:'Terraza Galaxia',address:'Ciudad de México',imageUrl:'',
  message:'Sube el volumen, elige tu mejor look y ven a celebrar conmigo. Una noche de música, risas y recuerdos que brillan más cuando estamos juntos.',
  sections:[
    {id:'neon-program',type:'program',title:'El plan de la noche',content:'19:00 — Llegada y primeras fotos\n19:30 — Música y juegos\n20:30 — Pastel y un gran deseo\n21:00 — ¡Que siga la fiesta!',detail:'',link:'',imageUrl:'',enabled:true},
    {id:'neon-dress',type:'dress_code',title:'Tu versión más brillante',content:'Ven con tu outfit favorito. Los detalles neón, plateados o fluorescentes son bienvenidos.',detail:'Lo más importante: que puedas bailar a gusto.',link:'',imageUrl:'',enabled:true},
    {id:'neon-music',type:'music',title:'Dale play a la fiesta',content:'Clásicos que todos cantamos y canciones que no nos dejan sentados. ¡Trae tu mejor paso!',detail:'',link:'',imageUrl:'',enabled:true},
    {id:'neon-gifts',type:'gifts',title:'El mejor regalo: coincidir',content:'Tu compañía es el mejor motivo para celebrar. No hace falta nada más que tus ganas de pasarla bien.',detail:'',link:'',imageUrl:'',enabled:true},
    {id:'neon-rsvp',type:'rsvp',title:'¿Te sumas a la fiesta?',content:'Confirma si vienes y cuántas personas te acompañan. Queremos tener todo listo para recibirte.',detail:'',link:'',imageUrl:'',rsvpMode:'integrated',enabled:true},
  ] satisfies InviteSection[],
};
