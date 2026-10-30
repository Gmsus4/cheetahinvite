import type { InvitationTemplate } from './invitation-templates';
import type { InviteSection } from './invitation-editor';
export const birthdayDiscoId = 'birthday-disco-v1';
export const birthdayDiscoAssets = ['helmet','collage','ball-purple','hanging-ball','ball-navy','chrome-spark','balloon-dog','holo-star','silver-stars','pencil','helmet-silver'] as const;
export const birthdayDiscoTemplate: InvitationTemplate = {
  id:birthdayDiscoId,eventType:'birthday',label:'Disco',available:true,accent:'#7154A1',
  assets:{topLeft:'/birthday/disco/hanging-ball.webp',bottomRight:'/birthday/disco/balloon-dog.webp',decoration:'/birthday/disco/collage.webp'},
};
export const birthdayDiscoExample = {
  eventType:'birthday',templateId:birthdayDiscoId,accent:'#7154A1',name:'El cumpleaños de Valentina',hostNames:'Valentina',date:'sábado, 14 de noviembre de 2026',eventDateKey:'2026-11-14',eventTime:'19:00',venue:'Salón Espejo',address:'Ciudad de México',imageUrl:'',
  message:'Cumplir años merece una buena canción, muchos abrazos y una pista llena de amigos. Ven a celebrar conmigo y a sumar una noche de esas que se quedan para siempre.',
  sections:[
    {id:'disco-program',type:'program',title:'Así se vive la noche',content:'19:00 — Bienvenida y primeras fotos\n19:30 — Cena y brindis\n20:30 — Pastel y buenos deseos\n21:00 — ¡Todos a la pista!',detail:'',link:'',imageUrl:'',enabled:true},
    {id:'disco-dress',type:'dress_code',title:'Un look para brillar',content:'Saca tus lentejuelas, tus detalles metálicos o ese outfit con el que te sientes increíble.',detail:'Trae zapatos cómodos: las mejores canciones se bailan.',link:'',imageUrl:'',enabled:true},
    {id:'disco-music',type:'music',title:'Esa canción que no puede faltar',content:'Los clásicos de siempre, nuestros favoritos y un poco de todo para cantar juntos. ¡Ven con tu mejor paso!',detail:'',link:'',imageUrl:'',enabled:true},
    {id:'disco-gifts',type:'gifts',title:'Tu compañía es el hit',content:'El mejor regalo será compartir este cumpleaños contigo. Solo hacen falta tus ganas de celebrar.',detail:'',link:'',imageUrl:'',enabled:true},
    {id:'disco-rsvp',type:'rsvp',title:'¿Te guardo un lugar en la pista?',content:'Confirma si nos acompañas y cuántas personas vienen contigo para preparar una noche especial.',detail:'',link:'',imageUrl:'',rsvpMode:'integrated',enabled:true},
  ] satisfies InviteSection[],
};
