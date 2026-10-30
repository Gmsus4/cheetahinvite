"use client";
import { birthdayCinemaId } from '@/lib/birthday-cinema';
import { birthdayElegantId } from '@/lib/birthday-elegant';
import { birthdayCowboyId } from '@/lib/birthday-cowboy';
import { birthdayGamerId } from '@/lib/birthday-gamer';


import { birthdayDinosaurId } from '@/lib/birthday-dinosaur';

import { birthdaySpaceId } from '@/lib/birthday-space';
import type { CSSProperties } from 'react';
import { InvitationDesignGrid } from './InvitationDesignGrid';
import { invitationTemplates, type InvitationTemplate } from '@/lib/invitation-templates';
import { getInvitationEventContent } from '@/lib/invitation-event-content';
import { birthdayDiscoId } from '@/lib/birthday-disco';
import { birthdayNeonId } from '@/lib/birthday-neon';
import { birthdayPastelId } from '@/lib/birthday-pastel';
import { birthdayConfettiId } from '@/lib/birthday-designs';
import styles from './WeddingDesignPicker.module.css';

export function EventDesignPicker({ eventType, value, onChange }: { eventType: string; value: string; onChange(id: string): void }) {
  const content = getInvitationEventContent(eventType);
  const templates = invitationTemplates.filter(template => template.eventType === eventType && template.available);
  return <InvitationDesignGrid value={value} onChange={onChange}
    legend="¿Cuál se siente más como tu celebración?"
    description="Elige tu estilo favorito. Tus fotos y datos se conservan al cambiar de diseño."
    options={[
      { id: 'none', label: 'Esencial', preview: <EventPreview eventType={eventType} />, href: `/ejemplo-invitacion/${content.slug}` },
      ...templates.map(template => ({ id: template.id, label: template.label, preview: <EventPreview eventType={eventType} template={template} />, href: template.id === birthdayCinemaId ? '/ejemplo-invitacion/cumpleanos-cine' : template.id === birthdayElegantId ? '/ejemplo-invitacion/cumpleanos-elegante' : template.id === birthdayCowboyId ? '/ejemplo-invitacion/cumpleanos-vaquero' : template.id === birthdayGamerId ? '/ejemplo-invitacion/cumpleanos-gamer' : template.id === birthdayDinosaurId ? '/ejemplo-invitacion/cumpleanos-dinosaurios' : template.id === birthdaySpaceId ? '/ejemplo-invitacion/cumpleanos-espacial' : template.id === birthdayConfettiId ? '/ejemplo-invitacion/cumpleanos-confeti' : template.id === birthdayPastelId ? '/ejemplo-invitacion/cumpleanos-globos-pastel' : template.id === birthdayNeonId ? '/ejemplo-invitacion/cumpleanos-neon' : template.id === birthdayDiscoId ? '/ejemplo-invitacion/cumpleanos-disco' : undefined })),
    ]} />;
}

export function EventPreview({ eventType, template }: { eventType: string; template?: InvitationTemplate }) {
  const content = getInvitationEventContent(eventType);
  const cinema = template?.id === birthdayCinemaId;
  const elegant = template?.id === birthdayElegantId;
  const cowboy = template?.id === birthdayCowboyId;
  const gamer = template?.id === birthdayGamerId;
  const dinosaur = template?.id === birthdayDinosaurId;
  const space = template?.id === birthdaySpaceId;
  const disco = template?.id === birthdayDiscoId;
  const neon = template?.id === birthdayNeonId;
  const pastel = template?.id === birthdayPastelId;
  const confetti = template?.id === birthdayConfettiId;
  return <span className={styles.scene} data-design={cinema ? 'birthday-cinema' : elegant ? 'birthday-elegant' : cowboy ? 'birthday-cowboy' : gamer ? 'birthday-gamer' : dinosaur ? 'birthday-dinosaur' : space ? 'birthday-space' : disco ? 'birthday-disco' : neon ? 'birthday-neon' : pastel ? 'birthday-pastel' : confetti ? 'birthday-confetti' : 'event-essential'} aria-hidden="true" style={{
    '--paper': '#fffaf0', '--ink': '#354f50', '--accent': template?.accent || content.demo.accent,
    '--heading': confetti ? "'Fredoka Variable',sans-serif" : "'Cormorant Garamond Variable',serif",
    '--art-top': template?.assets.topLeft ? `url("${template.assets.topLeft}")` : 'none',
    '--art-bottom': template?.assets.bottomRight ? `url("${template.assets.bottomRight}")` : 'none',
  } as CSSProperties}>
    {cinema ? <><span className={styles.kicker}>ESTRENO ESPECIAL</span><span className={styles.miniCinemaTitle}>Cine</span><span className={styles.miniCinemaArt} /><span className={styles.date}>RED CARPET</span></> : elegant ? <><span className={styles.kicker}>BLACK & GOLD</span><span className={styles.miniElegantTitle}>Elegante</span><span className={styles.miniElegantArt} /><span className={styles.date}>EL ARTE DE CELEBRAR</span></> : cowboy ? <><span className={styles.kicker}>¡SE ARMA LA FIESTA!</span><span className={styles.miniCowboyArt} /><span className={styles.miniCowboyTitle}>Vaquero</span><span className={styles.date}>NOS VEMOS EN EL RANCHO</span></> : gamer ? <><span className={styles.kicker}>NUEVA PARTIDA</span><span className={styles.miniGamerTitle}>Gamer</span><span className={styles.miniGamerArt} /><span className={styles.date}>¡ESTÁS EN MI EQUIPO!</span></> : dinosaur ? <><span className={styles.kicker}>EXPEDICIÓN CUMPLEAÑOS</span><span className={styles.miniDinosaurArt} /><span className={styles.miniBirthdayTitle}>Dinosaurios</span></> : space ? <><span className={styles.kicker}>MISIÓN CUMPLEAÑOS</span><span className={styles.miniSpaceArt} /><span className={styles.miniBirthdayTitle}>Espacial</span></> : disco ? <><span className={styles.kicker}>CUMPLEAÑOS DISCO</span><span className={styles.miniDiscoArt} /><span className={styles.miniDiscoTitle}>A la pista</span><span className={styles.date}>UNA NOCHE PARA CELEBRAR</span></> : neon ? <><span className={styles.kicker}>ESTÁS INVITADO</span><span className={styles.miniNeonTitle}>Neón</span><span className={styles.miniNeonArt} /><span className={styles.date}>QUE BRILLE LA FIESTA</span></> : pastel ? <><span className={styles.kicker}>UNA FIESTA ENTRE NUBES</span><span className={styles.miniBirthdayTitle}>Globos pastel</span><span className={styles.miniPastelArt} /><span className={styles.date}>UN DESEO MUY ESPECIAL</span></> : confetti ? <><span className={styles.miniBunting} /><span className={styles.kicker}>¡ESTÁS INVITADO!</span><span className={styles.miniBirthdayTitle}>Mi cumpleaños</span><span className={styles.miniBirthdayArt} /><span className={styles.date}>UN DÍA PARA CELEBRAR</span></> : <><span className={styles.paper} /><span className={styles.artTop} /><span className={styles.artBottom} /><span className={styles.kicker}>{content.label.toUpperCase()}</span><span className={styles.names}>Tu celebración</span><span className={styles.rule} /><span className={styles.date}>UN MOMENTO PARA COMPARTIR</span></>}
  </span>;
}
