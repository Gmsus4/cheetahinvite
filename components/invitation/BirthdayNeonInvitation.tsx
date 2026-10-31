"use client";

import Image from 'next/image';
import { BirthdayGallery } from './BirthdayGallery';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

const artworkDimensions: Record<string, [number, number]> = {
  'map-pin': [307, 453],
  'koi': [736, 1308],
  'pixel-dinosaur': [736, 736],
  'butterfly': [736, 414],
};

function NeonArt({name,className=''}:{name:string;className?:string}) {
  const [width,height] = artworkDimensions[name] ?? [800,800];
  return <span className={`neon-art neon-art-${name} ${className}`} aria-hidden="true"><Image src={`/birthday/neon/${name}.webp`} alt="" width={width} height={height} unoptimized /></span>;
}
export function BirthdayNeonInvitation({name,hostNames,date,eventDateKey,eventTime,venue,address,message,imageUrl,sections,publicEventId,accent}:WeddingInvitationProps) {
  const title=hostNames || name || 'Tu cumpleaños';
  const sectionOffset = (venue || address ? 2 : 1);
  const time=eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)?new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(`1970-01-01T${eventTime}:00Z`)):eventTime;
  return <article className="birthday-neon" style={{'--neon-accent':/^#[0-9a-f]{6}$/i.test(accent)?accent:'#F46BDE'} as CSSProperties}>
    <header className="neon-hero">
      <div className="neon-confetti" aria-hidden="true" /><div className="neon-orbit" aria-hidden="true" />
      <span className="neon-kicker"><i /> ESTÁS INVITADO A MI CUMPLEAÑOS</span>
      <p className="neon-hero-intro">Esta noche se celebra</p><h1>{title}</h1><p className="neon-script">¡Que brille la fiesta!</p>
      <div className="neon-hero-art"><NeonArt name="astronaut" /><span className="neon-cross" aria-hidden="true">✦</span><NeonArt name="rocket" /></div>
      <div className="neon-date"><span>{date || 'Reserva una noche especial'}</span>{time && <strong>{time}</strong>}</div>
      <a href="#neon-welcome" className="neon-scroll">ENTRA A LA FIESTA <span aria-hidden="true">↓</span></a>
    </header>
    <section className="neon-welcome" data-birthday-band="base" id="neon-welcome"><span className="neon-kicker">BUENA MÚSICA. MEJOR COMPAÑÍA.</span><h2>Hoy nos toca<br /><em>brillar juntos.</em></h2><p>{message || 'Te espero para una celebración llena de música, risas y buenos momentos. ¡La fiesta se enciende contigo!'}</p>
      {imageUrl && <div className="neon-portrait"><Image src={imageUrl} alt={title} width={650} height={750} unoptimized /></div>}
      <div className="neon-friends"><NeonArt name="pixel-cat" /><span className="neon-script">Tu presencia<br />enciende el plan</span><NeonArt name="headphones" /></div>
    </section>
    {(venue || address) && <section className="neon-location" data-birthday-band="tinted"><div className="neon-location-inner"><div><span className="neon-kicker">PUNTO DE ENCUENTRO</span><h2>La misión:<br /><em>llegar a la fiesta.</em></h2><h3>{venue}</h3><p>{address}</p><p>{date}{time?` · ${time}`:''}</p><a className="neon-button" href={invitationMapUrl(venue,address)} target="_blank" rel="noopener noreferrer">Abrir ubicación ↗</a></div><NeonArt name="map-pin" /></div></section>}
    {sections.filter(s=>s.enabled).map((section,index)=><NeonSection key={section.id} section={section} bandIndex={index + sectionOffset} index={index} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="neon-countdown" data-birthday-band={(sections.filter(section => section.enabled).length + sectionOffset) % 2 === 0 ? "base" : "tinted"}><span className="neon-kicker">TODO LISTO PARA EL DESPEGUE</span><h2>La cuenta regresiva<br /><em>ya comenzó.</em></h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <footer className="neon-footer"><NeonArt name="alien" /><span className="neon-kicker">UNA FECHA PARA RECORDAR</span><h2>Nos vemos<br /><em>en la pista.</em></h2><p className="neon-script">{title}</p><small>HECHO PARA CELEBRAR · HECHO PARA BRILLAR</small></footer>
  </article>;
}
function NeonSection({ section, index, bandIndex, publicEventId }: { section: InviteSection; index: number; bandIndex: number; publicEventId?: string }) {
  const link=invitationSectionUrl(section.type,section.link);
  const art=section.type==='music'?'headphones':section.type==='program'?'pixel-dinosaur':section.type==='rsvp'?'party-popper':section.type==='gifts'?'pixel-cat':section.type==='dress_code'?'alien':section.type==='story'?'butterfly':section.type==='parents'?'koi':'rocket';
  const images=section.type==='gallery'?[...new Set([section.imageUrl,...(section.imageUrls || [])].filter(Boolean))]:[];
  return <section className={`neon-section neon-section-${section.type}`} data-birthday-band={bandIndex % 2 === 0 ? "base" : "tinted"}><div className="neon-section-inner">{section.type !== 'gallery' && <div className="neon-section-art"><NeonArt name={art} /></div>}<div className="neon-section-copy"><span className="neon-kicker">{section.type==='rsvp'?'TU LUGAR ESTÁ ESPERANDO':`LA FIESTA · ${String(index+1).padStart(2,'0')}`}</span><h2>{section.title}</h2>
    {section.type==='program'?<ol className="neon-program">{section.content.split('\n').filter(Boolean).map((line,i)=>{const parts=line.split(/\s+[—–-]\s+/);return <li key={i}>{parts.length>1?<><strong>{parts[0]}</strong><span>{parts.slice(1).join(' — ')}</span></>:<span>{line}</span>}</li>})}</ol>:section.content && <p>{section.content}</p>}
    {section.detail && <p className="neon-detail">{section.detail}</p>}
    {section.type!=='gallery' && section.imageUrl && <Image className="neon-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
    {images.length > 0 && <BirthdayGallery images={images} title={section.title} theme="neon" />}
    {section.type==='rsvp' && section.rsvpMode!=='external'?<div className="neon-rsvp"><RsvpForm eventId={publicEventId} /></div>:link && <a className="neon-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} ↗</a>}
  </div></div></section>;
}
