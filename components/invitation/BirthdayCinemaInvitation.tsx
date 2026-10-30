"use client";

import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import type { CinemaAsset } from '@/lib/birthday-cinema';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function CinemaArt({ name, className = '' }: { name: CinemaAsset; className?: string }) {
  return <Image className={`cinema-art ${className}`} src={`/birthday/cinema/${name}.webp`} width={800} height={800} alt="" unoptimized />;
}

export function BirthdayCinemaInvitation({ name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, sections, publicEventId, accent }: WeddingInvitationProps) {
  const title = hostNames || name || 'Tu celebración';
  const color = /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#9D2135';
  const rgb = [1,3,5].map(start => parseInt(color.slice(start,start+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  const ink = rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722 > .179 ? '#000000' : '#ffffff';
  const time = eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) ? new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(`1970-01-01T${eventTime}:00Z`)) : eventTime;
  return <article className="birthday-cinema" style={{'--cinema-accent':color,'--cinema-action-ink':ink} as CSSProperties}>
    <header className="cinema-premiere">
      <div className="cinema-topline"><span>UNA CELEBRACIÓN ORIGINAL</span><span>CUMPLEAÑOS · ESTRENO ESPECIAL</span></div>
      <div className="cinema-poster"><span className="cinema-overline">ESTA NOCHE, EL PAPEL PRINCIPAL ES DE</span><h1>{title}</h1><p className="cinema-poster-subtitle">{hostNames && name && hostNames !== name ? name : 'Una vida. Mil historias. Una gran noche.'}</p><div className="cinema-stars" aria-hidden="true">★ ★ ★ ★ ★</div>{imageUrl && <Image className="cinema-portrait" src={imageUrl} alt={title} width={900} height={1100} unoptimized loading="eager" />}<p className="cinema-poster-credit">CON UN REPARTO EXCEPCIONAL: <strong>TÚ Y MIS PERSONAS FAVORITAS</strong></p></div>
      <div className="cinema-premiere-date"><div><span>PRÓXIMAMENTE</span><strong>{date || 'Una fecha para recordar'}</strong></div>{time && <div><span>LA FUNCIÓN COMIENZA</span><strong>{time}</strong></div>}<a href="#cinema-invitation">Tienes una invitación <span aria-hidden="true">↓</span></a></div>
    </header>

    <section className="cinema-invitation" id="cinema-invitation"><div className="cinema-invitation-art"><span className="cinema-stamp">UNA NOCHE<br />DE PELÍCULA</span><CinemaArt name="projector" /></div><div className="cinema-invitation-copy"><span className="cinema-overline">LA SINOPSIS</span><h2>Las mejores historias<br />se viven <em>juntos.</em></h2><p>{message || 'Quiero compartir contigo una noche de celebración y buenos recuerdos. Tú eres parte de esta historia.'}</p><span className="cinema-signature">Te espero, {title}</span></div></section>

    {(venue || address) && <section className="cinema-location"><div className="cinema-location-heading"><CinemaArt name="cinema-pin" /><span className="cinema-overline">ACCESO A LA CELEBRACIÓN</span><h2>Nos vemos en<br />la alfombra roja.</h2></div><div className="cinema-ticket"><div className="cinema-ticket-main"><span className="cinema-overline">ADMISIÓN · INVITADO ESPECIAL</span><h3>{venue || 'El lugar del estreno'}</h3><p>{address}</p><div className="cinema-ticket-data"><div><span>FECHA</span><strong>{date}</strong></div>{time && <div><span>HORA</span><strong>{time}</strong></div>}</div><a className="cinema-button" href={invitationMapUrl(venue,address)} target="_blank" rel="noopener noreferrer">Cómo llegar <span aria-hidden="true">↗</span></a></div><div className="cinema-ticket-stub"><span>ESTRENO ESPECIAL</span><div className="cinema-barcode" aria-hidden="true" /><strong>TE ESPERAMOS</strong></div></div></section>}

    {sections.filter(s=>s.enabled).map(section=><CinemaSection key={section.id} section={section} publicEventId={publicEventId} />)}

    {eventDateKey && eventTime && <section className="cinema-countdown"><span className="cinema-overline">EL ESTRENO SE ACERCA</span><h2>Cuenta atrás para<br />una gran noche.</h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <footer className="cinema-credits"><CinemaArt name="clapper" /><span className="cinema-overline">ESTA HISTORIA CONTINUARÁ</span><p>Los mejores recuerdos<br />aún están por rodarse.</p><strong>{title}</strong><span>Gracias por ser parte del reparto.</span></footer>
  </article>;
}

function CinemaSection({ section, publicEventId }: { section: InviteSection; publicEventId?: string }) {
  const heading=(eyebrow?:string)=><div className="cinema-heading">{eyebrow && <span className="cinema-overline">{eyebrow}</span>}<h2>{section.title}</h2></div>;
  const content=<CinemaContent section={section} publicEventId={publicEventId} />;
  let scene;
  switch(section.type){
    case 'story': scene=<div className="cinema-letter"><div className="cinema-letter-margin" aria-hidden="true"><span>UNA HISTORIA ORIGINAL</span><span>★</span></div><div className="cinema-letter-body"><span className="cinema-overline">EN PRIMERA PERSONA</span>{heading()}<span className="cinema-letter-quote" aria-hidden="true">“</span>{content}<div className="cinema-letter-end" aria-hidden="true"><span />★<span /></div></div></div>;break;
    case 'ceremony': scene=<div className="cinema-special-scene"><div className="cinema-scene-lights" aria-hidden="true"><span /><span /></div><span className="cinema-scene-cue">LUCES · CÁMARA · EMOCIÓN</span><div className="cinema-special-scene-copy">{heading('UN MOMENTO PARA RECORDAR')}{content}</div><div className="cinema-stage-edge" aria-hidden="true" /></div>;break;
    case 'reception': scene=<div className="cinema-next-location"><div className="cinema-next-location-label"><CinemaArt name="cinema-pin" /><span className="cinema-overline">LA SIGUIENTE ESCENA</span><span className="cinema-location-arrow" aria-hidden="true">↗</span></div><div className="cinema-next-location-body">{heading()}{content}</div><div className="cinema-location-footer" aria-hidden="true"><span />CONTINUAMOS LA CELEBRACIÓN<span /></div></div>;break;
    case 'parents': scene=<div className="cinema-cast"><span className="cinema-cast-stars" aria-hidden="true">★ ★ ★</span>{heading('CON LA PARTICIPACIÓN ESPECIAL DE')}{content}<span className="cinema-cast-line" aria-hidden="true" /></div>;break;
    case 'custom': scene=<div className="cinema-production-note"><div className="cinema-production-tab"><span aria-hidden="true">✳</span><span>NOTAS DE PRODUCCIÓN</span></div><div className="cinema-production-body">{heading()}{content}</div><div className="cinema-production-bottom" aria-hidden="true"><span>ANTES DE LA FUNCIÓN</span><span>● ● ●</span></div></div>;break;
    case 'gallery': scene=<div className="cinema-gallery-content">{heading()}{content}</div>;break;
    case 'program': scene=<div className="cinema-callsheet"><div className="cinema-callsheet-top"><span>PRODUCCIÓN: UNA NOCHE INOLVIDABLE</span><span>PLAN DE RODAJE</span></div>{heading('EN CARTELERA')}{content}<CinemaArt name="clapper" /></div>;break;
    case 'dress_code': scene=<div className="cinema-dress"><div className="cinema-dress-photo"><CinemaArt name="spotlight" /><span>READY FOR YOUR CLOSE-UP</span></div><div className="cinema-dress-copy">{heading('DRESS CODE · ALFOMBRA ROJA')}{content}<CinemaArt name="mask" /></div></div>;break;
    case 'gifts': scene=<div className="cinema-gifts"><CinemaArt name="popcorn" /><div>{heading('LO QUE HACE GRANDE ESTA NOCHE')}{content}<span className="cinema-signature">Tu compañía merece todos los aplausos.</span></div></div>;break;
    case 'music': scene=<div className="cinema-soundtrack"><CinemaArt name="disc" className="cinema-record" /><div>{heading('ORIGINAL SOUNDTRACK')}{content}</div></div>;break;
    case 'rsvp': scene=<div className="cinema-admission"><div className="cinema-admission-copy"><span className="cinema-overline">RESERVA TU LUGAR</span><h2>{section.title}</h2><p>{section.content}</p>{section.detail && <p>{section.detail}</p>}<div className="cinema-admission-art"><CinemaArt name="camera-hand" /><CinemaArt name="camera" /></div><span className="cinema-admission-caption">NO FALTES EN LA FOTO DEL REPARTO</span></div><div className="cinema-admission-form">{content}</div></div>;break;
    default: scene=<div className="cinema-note">{heading('UNA ESCENA ESPECIAL')}{content}</div>;
  }
  return <section className={`cinema-section cinema-section-${section.type}`}>{scene}</section>;
}

function CinemaContent({ section, publicEventId }: { section: InviteSection; publicEventId?: string }) {
  const gallery=section.type==='gallery';
  const link=invitationSectionUrl(section.type,section.link);
  const images=gallery ? [...new Set([section.imageUrl,...(section.imageUrls||[])].filter(Boolean))] : [];
  return <div className="cinema-content">
    {section.type==='program' ? <ol className="cinema-program">{section.content.split('\n').filter(Boolean).map((line,i)=>{const [time,...description]=line.split(/\s+[—–-]\s+/);return <li key={i}><span className="cinema-scene-number">{String(i+1).padStart(2,'0')}</span><div>{description.length>0 && <strong>{time}</strong>}<p>{description.length ? description.join(' — ') : line}</p></div><span className="cinema-scene-word" aria-hidden="true">ESCENA</span></li>;})}</ol> : section.type!=='rsvp' && section.content && <p>{section.content}</p>}
    {section.type!=='rsvp' && section.detail && <p className="cinema-detail">{section.detail}</p>}
    {!gallery && section.imageUrl && <Image className="cinema-section-photo" src={section.imageUrl} alt={section.title} width={800} height={600} unoptimized />}
    {images.length>0 && <div className="cinema-gallery">{images.map((url,i)=><Image key={url} src={url} alt={`${section.title}, foto ${i+1}`} width={700} height={800} unoptimized />)}</div>}
    {section.type==='rsvp' && section.rsvpMode!=='external' ? <div className="cinema-rsvp"><RsvpForm eventId={publicEventId} /></div> : link && <a className="cinema-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} <span aria-hidden="true">↗</span></a>}
  </div>;
}
