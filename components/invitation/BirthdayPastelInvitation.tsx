"use client";

import Image from 'next/image';
import { BirthdayGallery } from './BirthdayGallery';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function Art({name,className=''}:{name:string;className?:string}) {
  return <Image className={`pastel-art ${className}`} src={`/birthday/pastel/${name}.webp`} alt="" width={700} height={800} unoptimized />;
}
export function BirthdayPastelInvitation({name,hostNames,date,eventDateKey,eventTime,venue,address,message,imageUrl,sections,publicEventId,accent}:WeddingInvitationProps) {
  const title=hostNames || name || 'Tu cumpleaños';
  const sectionOffset = (venue || address ? 2 : 1);
  const time=eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)?new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(`1970-01-01T${eventTime}:00Z`)):eventTime;
  return <article className="birthday-pastel" style={{'--pastel-accent':/^#[0-9a-f]{6}$/i.test(accent)?accent:'#526F87'} as CSSProperties}>
    <header className="pastel-hero">
      <div className="pastel-balloon-wash" aria-hidden="true" />
      <Art name="star-soft" className="pastel-star pastel-star-left" /><Art name="star-gold" className="pastel-star pastel-star-right" />
      <span className="pastel-kicker">¡ESTÁS INVITADO A MI CUMPLEAÑOS!</span>
      <div className="pastel-cake-scene"><Art name="cloud-blue" className="pastel-cloud-blue" /><Art name="cake" className="pastel-hero-cake" /><Art name="cloud-light" className="pastel-cloud-light" /></div>
      <h1 className="pastel-name">{title}</h1><div className="pastel-date"><span>{date || 'Una fecha muy especial'}</span>{time && <strong>{time}</strong>}</div>
      <a className="pastel-scroll" href="#pastel-welcome">Baja, hay algo dulce para ti <span aria-hidden="true">↓</span></a>
    </header>
    <section className="pastel-welcome" data-birthday-band="base" id="pastel-welcome"><span className="pastel-kicker">PREPARAMOS ALGO MUY ESPECIAL</span><h2>Un poquito de magia.<br />Muchísimas sonrisas.</h2><p>{message || 'Me hace ilusión celebrar contigo. Trae tus ganas de jugar y de pasar una tarde llena de momentos bonitos.'}</p>
      {imageUrl && <div className="pastel-portrait"><Image src={imageUrl} alt={title} width={600} height={700} unoptimized /></div>}
      <div className="pastel-bakery"><Art name="bear-chef" /><div><Art name="cupcake" /><span className="pastel-handwritten">Hecho con cariño<br />para celebrar contigo</span></div><Art name="puppy-chef" /></div>
    </section>
    {(venue || address) && <section className="pastel-location" data-birthday-band="tinted"><div className="pastel-location-copy"><span className="pastel-kicker">EL LUGAR DE NUESTRA PEQUEÑA AVENTURA</span><h2>Nos vemos aquí.</h2><h3>{venue}</h3><p>{address}</p><p>{date}{time?` · ${time}`:''}</p><a className="pastel-button" href={invitationMapUrl(venue,address)} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div><Art name="duck" /></section>}
    {sections.filter(s=>s.enabled).map((section,index)=><PastelSection key={section.id} section={section} bandIndex={index + sectionOffset} index={index} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="pastel-countdown" data-birthday-band={(sections.filter(section => section.enabled).length + sectionOffset) % 2 === 0 ? "base" : "tinted"}><Art name="star-soft" /><span className="pastel-kicker">EL GRAN DÍA SE ACERCA</span><h2>Un deseo, una sonrisa<br />y una cuenta regresiva.</h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <footer className="pastel-footer"><Art name="duck" /><p className="pastel-handwritten">Las cosas más bonitas se comparten</p><h2>Mi deseo es verte aquí.</h2><strong>{title}</strong><span className="pastel-kicker">ENTRE NUBES · ENTRE AMIGOS · ENTRE RISAS</span></footer>
  </article>;
}
function PastelSection({ section, index, bandIndex, publicEventId }: { section: InviteSection; index: number; bandIndex: number; publicEventId?: string }) {
  const link=invitationSectionUrl(section.type,section.link);
  const art=section.type==='rsvp'?'cloud-light':section.type==='program'?'bear-chef':section.type==='gifts'?'cupcake':section.type==='dress_code'?'puppy-chef':'star-gold';
  const images=section.type==='gallery'?[...new Set([section.imageUrl,...(section.imageUrls || [])].filter(Boolean))]:[];
  return <section className={`pastel-section pastel-section-${section.type}`} data-birthday-band={bandIndex % 2 === 0 ? "base" : "tinted"}><div className="pastel-section-inner">{section.type !== 'gallery' && <Art name={art} />}<div className="pastel-section-copy"><span className="pastel-kicker">{section.type==='rsvp'?'LA FIESTA ES MÁS BONITA CONTIGO':`DETALLES PARA UN DÍA FELIZ · ${String(index+1).padStart(2,'0')}`}</span><h2>{section.title}</h2>
    {section.type==='program'?<ol className="pastel-program">{section.content.split('\n').filter(Boolean).map((line,i)=>{const parts=line.split(/\s+[—–-]\s+/);return <li key={i}><span aria-hidden="true">✧</span><div>{parts.length>1?<><strong>{parts[0]}</strong><p>{parts.slice(1).join(' — ')}</p></>:<p>{line}</p>}</div></li>})}</ol>:section.content && <p>{section.content}</p>}
    {section.detail && <p className="pastel-detail">{section.detail}</p>}
    {section.type!=='gallery' && section.imageUrl && <Image className="pastel-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
    {images.length > 0 && <BirthdayGallery images={images} title={section.title} theme="pastel" />}
    {section.type==='rsvp' && section.rsvpMode!=='external'?<div className="pastel-rsvp"><RsvpForm eventId={publicEventId} /></div>:link && <a className="pastel-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} ↗</a>}
  </div></div></section>;
}
