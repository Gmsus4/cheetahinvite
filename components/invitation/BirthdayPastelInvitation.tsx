"use client";

import Image from 'next/image';
import { BirthdayGallery } from './BirthdayGallery';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

const artworkDimensions = {
  'bear-chef': [409, 657],
  'cupcake': [536, 587],
  'star-soft': [396, 388],
  'star-gold': [377, 379],
  'cloud-blue': [544, 312],
  'cloud-light': [700, 439],
  'cake': [642, 999],
  'duck': [344, 511],
  'puppy-chef': [414, 658],
  'conejo': [592, 662],
  'confeti': [469, 470],
  'elefante': [634, 637],
  'gatito': [509, 557],
  'globos': [537, 613],
  'pastel2': [446, 564],
  'regalo': [553, 486],
  'tigre': [487, 660],
} as const;
type ArtworkName = keyof typeof artworkDimensions;
const extraArtwork = ['conejo', 'confeti', 'elefante', 'gatito', 'globos', 'pastel2', 'regalo', 'tigre'] as const;
const artBySection: Partial<Record<InviteSection['type'], ArtworkName[]>> = {
  story: ['conejo'], ceremony: ['globos'], reception: ['gatito'], program: ['pastel2'],
  parents: ['elefante'], dress_code: ['tigre'], gifts: ['regalo'],
  rsvp: ['elefante', 'globos', 'cloud-light'], music: ['confeti', 'cupcake', 'star-gold'],
  custom: ['bear-chef', 'puppy-chef', 'cake', 'duck'],
};

function Art({name,className='',eager=false}:{name:ArtworkName;className?:string;eager?:boolean}) {
  const [width,height] = artworkDimensions[name];
  return <Image className={`pastel-art ${className}`} src={`/birthday/pastel/${name}.webp`} alt="" width={width} height={height} loading={eager ? 'eager' : 'lazy'} unoptimized />;
}
export function BirthdayPastelInvitation({name,hostNames,date,eventDateKey,eventTime,venue,address,message,imageUrl,sections,publicEventId,accent}:WeddingInvitationProps) {
  const title=hostNames || name || 'Tu cumpleaños';
  const hasLocation = Boolean(venue || address);
  const hasCountdown = Boolean(eventDateKey && eventTime);
  const sectionOffset = hasLocation ? 2 : 1;
  const enabledSections = sections.filter(section => section.enabled);
  const usedArtwork = new Set<ArtworkName>(hasCountdown ? ['confeti'] : []);
  const sectionArtwork = enabledSections.map(section => {
    const candidates = artBySection[section.type];
    const art = candidates?.find(name => !usedArtwork.has(name)) ?? candidates?.[0];
    if (art) usedArtwork.add(art);
    return art;
  });
  const closingArtwork: ArtworkName[] = extraArtwork.filter(name => !usedArtwork.has(name));
  if (!hasLocation) closingArtwork.unshift('duck');
  if (closingArtwork.length === 0) closingArtwork.push('bear-chef', 'puppy-chef');
  const time=eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)?new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(`1970-01-01T${eventTime}:00Z`)):eventTime;
  return <article className="birthday-pastel" style={{'--pastel-accent':/^#[0-9a-f]{6}$/i.test(accent)?accent:'#526F87'} as CSSProperties}>
    <header className="pastel-hero">
      <div className="pastel-balloon-wash" aria-hidden="true" />
      <Art name="star-soft" className="pastel-star pastel-star-left" eager /><Art name="star-gold" className="pastel-star pastel-star-right" eager />
      <span className="pastel-kicker">¡ESTÁS INVITADO A MI CUMPLEAÑOS!</span>
      <div className="pastel-cake-scene"><Art name="cloud-blue" className="pastel-cloud-blue" eager /><Art name="cake" className="pastel-hero-cake" eager /><Art name="cloud-light" className="pastel-cloud-light" eager /></div>
      <h1 className="pastel-name">{title}</h1><div className="pastel-date"><span>{date || 'Una fecha muy especial'}</span>{time && <strong>{time}</strong>}</div>
      <a className="pastel-scroll" href="#pastel-welcome">Baja, hay algo dulce para ti <span aria-hidden="true">↓</span></a>
    </header>
    <section className="pastel-welcome" data-birthday-band="base" id="pastel-welcome"><span className="pastel-kicker">PREPARAMOS ALGO MUY ESPECIAL</span><h2>Un poquito de magia.<br />Muchísimas sonrisas.</h2><p>{message || 'Me hace ilusión celebrar contigo. Trae tus ganas de jugar y de pasar una tarde llena de momentos bonitos.'}</p>
      {imageUrl && <div className="pastel-portrait"><Image src={imageUrl} alt={title} width={600} height={700} unoptimized /></div>}
      <div className="pastel-friends"><Art name="bear-chef" /><div><Art name="cupcake" /><span className="pastel-handwritten">Un día para jugar,<br />reír y celebrar</span></div><Art name="puppy-chef" /></div>
    </section>
    {hasLocation && <section className="pastel-location" data-birthday-band="tinted"><div className="pastel-location-copy"><span className="pastel-kicker">EL LUGAR DE NUESTRA PEQUEÑA AVENTURA</span><h2>Nos vemos aquí.</h2><h3>{venue}</h3><p>{address}</p><p>{date}{time?` · ${time}`:''}</p><a className="pastel-button" href={invitationMapUrl(venue,address)} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div><Art name="duck" /></section>}
    {enabledSections.map((section,index)=><PastelSection key={section.id} section={section} art={sectionArtwork[index]} bandIndex={index + sectionOffset} index={index} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="pastel-countdown" data-birthday-band={(enabledSections.length + sectionOffset) % 2 === 0 ? "base" : "tinted"}><Art name="confeti" /><span className="pastel-kicker">EL GRAN DÍA SE ACERCA</span><h2>Un deseo, una sonrisa<br />y una cuenta regresiva.</h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <footer className="pastel-footer">{closingArtwork.length > 0 && <div className="pastel-farewell">{closingArtwork.map(art => <Art key={art} name={art} />)}</div>}<p className="pastel-handwritten">Las cosas más bonitas se comparten</p><h2>Mi deseo es verte aquí.</h2><strong>{title}</strong><span className="pastel-kicker">ENTRE GLOBOS · ENTRE AMIGOS · ENTRE RISAS</span></footer>
  </article>;
}
function PastelSection({ section, art, index, bandIndex, publicEventId }: { section: InviteSection; art?: ArtworkName; index: number; bandIndex: number; publicEventId?: string }) {
  const link=invitationSectionUrl(section.type,section.link);
  const images=section.type==='gallery'?[...new Set([section.imageUrl,...(section.imageUrls || [])].filter(Boolean))]:[];
  return <section className={`pastel-section pastel-section-${section.type}`} data-birthday-band={bandIndex % 2 === 0 ? "base" : "tinted"}><div className={`pastel-section-inner${!art ? ' pastel-section-no-art' : ''}`}>{art && <Art name={art} />}<div className="pastel-section-copy"><span className="pastel-kicker">{section.type==='rsvp'?'LA FIESTA ES MÁS BONITA CONTIGO':`DETALLES PARA UN DÍA FELIZ · ${String(index+1).padStart(2,'0')}`}</span><h2>{section.title}</h2>
    {section.type==='program'?<ol className="pastel-program">{section.content.split('\n').filter(Boolean).map((line,i)=>{const parts=line.split(/\s+[—–-]\s+/);return <li key={i}><span aria-hidden="true">✧</span><div>{parts.length>1?<><strong>{parts[0]}</strong><p>{parts.slice(1).join(' — ')}</p></>:<p>{line}</p>}</div></li>})}</ol>:section.content && <p>{section.content}</p>}
    {section.detail && <p className="pastel-detail">{section.detail}</p>}
    {section.type!=='gallery' && section.imageUrl && <Image className="pastel-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
    {images.length > 0 && <BirthdayGallery images={images} title={section.title} theme="pastel" />}
    {section.type==='rsvp' && section.rsvpMode!=='external'?<div className="pastel-rsvp"><RsvpForm eventId={publicEventId} /></div>:link && <a className="pastel-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} ↗</a>}
  </div></div></section>;
}
