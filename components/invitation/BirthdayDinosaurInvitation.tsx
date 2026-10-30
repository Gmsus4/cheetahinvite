"use client";

import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function DinoArt({ name, className = '' }: { name: string; className?: string }) {
  return <Image className={`dino-art ${className}`} src={`/birthday/dinosaur/${name}.webp`} alt="" width={800} height={800} unoptimized />;
}

export function BirthdayDinosaurInvitation({ name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, sections, publicEventId, accent }: WeddingInvitationProps) {
  const title = hostNames || name || 'Tu cumpleaños';
  const time = eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) ? new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(`1970-01-01T${eventTime}:00Z`)) : eventTime;
  return <article className="birthday-dinosaur" style={{ '--dino-accent': /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#C46A32' } as CSSProperties}>
    <header className="dino-hero">
      <span className="dino-kicker">EXPEDICIÓN CUMPLEAÑOS · ESTÁS INVITADO</span>
      <p className="dino-script">Una aventura enorme para alguien muy especial</p>
      <h1>{title}</h1>
      <div className="dino-hero-date"><span>RESERVA ESTE DÍA</span><strong>{date || 'Una fecha muy especial'}</strong>{time && <b>{time}</b>}</div>
      <div className="dino-hero-scene" aria-hidden="true"><DinoArt name="longneck" /><DinoArt name="trex" /></div>
      <div className="dino-jungle" aria-hidden="true" />
      <a className="dino-discover" href="#dino-adventure">SIGUE LAS HUELLAS <span aria-hidden="true">↓</span></a>
    </header>
    <section className="dino-welcome" id="dino-adventure"><span className="dino-kicker">PEQUEÑOS EXPLORADORES · GRANDES RECUERDOS</span><h2>Un cumpleaños<br /><em>para rugir de emoción.</em></h2><p>{message || 'Te espero para una expedición llena de juegos, risas y sorpresas. ¡Ven a celebrar conmigo!'}</p>
      {imageUrl && <Image className="dino-portrait" src={imageUrl} alt={title} width={650} height={750} unoptimized />}
      <div className="dino-field-notes"><figure><DinoArt name="triceratops" /><figcaption>01 / Conocer nuevos amigos</figcaption></figure><figure><DinoArt name="stegosaurus" /><figcaption>02 / Compartir aventuras</figcaption></figure><figure><DinoArt name="pterodactyl" /><figcaption>03 / Dejar volar la imaginación</figcaption></figure></div>
    </section>
    <section className="dino-expedition"><DinoArt name="volcano" /><div><span className="dino-kicker">EL VOLCÁN DE LA DIVERSIÓN</span><h2>¡Se viene una<br />gran aventura!</h2><p>Juegos por descubrir, sorpresas por encontrar<br />y un deseo enorme por pedir.</p></div><DinoArt name="comet" className="dino-comet" /></section>
    {(venue || address) && <section className="dino-location"><div className="dino-location-copy"><span className="dino-kicker">COORDENADAS DE LA EXPEDICIÓN</span><h2>Aquí comienza<br /><em>nuestro recorrido.</em></h2><h3>{venue}</h3><p>{address}</p><p>{date}{time ? ` · ${time}` : ''}</p><a className="dino-button" href={invitationMapUrl(venue, address)} target="_blank" rel="noopener noreferrer">Ver cómo llegar ↗</a></div><DinoArt name="palm" /></section>}
    {sections.filter(section => section.enabled).map((section, index) => <DinoSection key={section.id} section={section} index={index} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="dino-countdown"><div className="dino-eggs" aria-hidden="true">{['egg-orange', 'egg-blue', 'egg-purple'].map(egg => <DinoArt key={egg} name={egg} />)}</div><span className="dino-kicker">ALGO MUY ESPECIAL ESTÁ POR NACER</span><h2>Cada vez falta menos<br /><em>para la aventura.</em></h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <footer className="dino-footer"><div className="dino-leaves" aria-hidden="true">{['monstera', 'leaves', 'leaf-small'].map(leaf => <DinoArt key={leaf} name={leaf} />)}</div><p className="dino-script">Los mejores recuerdos se descubren juntos</p><h2>¡Te espero, explorador!</h2><strong>{title}</strong><small>UNA GRAN AVENTURA · UN CUMPLEAÑOS INOLVIDABLE</small></footer>
  </article>;
}

function DinoSection({ section, index, publicEventId }: { section: InviteSection; index: number; publicEventId?: string }) {
  const link = invitationSectionUrl(section.type, section.link);
  const images = section.type === 'gallery' ? [...new Set([section.imageUrl, ...(section.imageUrls || [])].filter(Boolean))] : [];
  const art = section.type === 'rsvp' ? 'hatchling' : section.type === 'program' ? 'trex' : section.type === 'music' ? 'pterodactyl' : section.type === 'gifts' ? 'triceratops' : section.type === 'dress_code' ? 'stegosaurus' : section.type === 'reception' || section.type === 'ceremony' ? 'longneck' : ['pterodactyl', 'triceratops', 'stegosaurus'][index % 3];
  return <section className={`dino-section dino-section-${section.type}`}><div className="dino-section-heading"><span className="dino-kicker">{section.type === 'rsvp' ? 'TU LUGAR EN LA EXPEDICIÓN' : `CUADERNO DE EXPLORACIÓN / ${String(index + 1).padStart(2, '0')}`}</span><h2>{section.title}</h2></div><div className="dino-section-body">{section.type !== 'gallery' && <DinoArt name={art} />}<div className="dino-section-copy">
    {section.type === 'program' ? <ol className="dino-program">{section.content.split('\n').filter(Boolean).map((line, i) => { const [time, ...description] = line.split(/\s+[—–-]\s+/); return <li key={i}>{description.length ? <><strong>{time}</strong><span>{description.join(' — ')}</span></> : <span>{line}</span>}</li>; })}</ol> : section.content && <p>{section.content}</p>}
    {section.detail && <p className="dino-detail">{section.detail}</p>}
    {section.type !== 'gallery' && section.imageUrl && <Image className="dino-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
    {images.length > 0 && <div className="dino-gallery">{images.map(url => <Image key={url} src={url} alt={section.title} width={500} height={600} unoptimized />)}</div>}
    {section.type === 'rsvp' && section.rsvpMode !== 'external' ? <div className="dino-rsvp"><RsvpForm eventId={publicEventId} /></div> : link && <a className="dino-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} ↗</a>}
  </div></div></section>;
}
