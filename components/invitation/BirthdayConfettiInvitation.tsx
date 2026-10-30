"use client";

import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function Artwork({ name, className = '' }: { name: string; className?: string }) {
  return <Image className={`birthday-art ${className}`} src={`/birthday/confetti/${name}.webp`} alt="" width={700} height={1000} unoptimized />;
}

export function BirthdayConfettiInvitation({ name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, sections, publicEventId, accent }: WeddingInvitationProps) {
  const title = hostNames || name || 'Tu cumpleaños';
  const visible = sections.filter(s => s.enabled);
  const time = eventTime && /^\d{2}:\d{2}$/.test(eventTime) ? new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(`1970-01-01T${eventTime}:00Z`)) : eventTime;
  return <article className="birthday-confetti" style={{ '--birthday-accent': /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#387D81' } as CSSProperties}>
    <header className="birthday-cover">
      <div className="birthday-bunting" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
      <span className="birthday-eyebrow">UN DÍA PEQUEÑITO · UNA ALEGRÍA ENORME</span>
      <p className="birthday-script">¡Estás invitado a mi</p>
      <h1>cumpleaños<span>!</span></h1>
      <div className="birthday-cover-scene"><span className="birthday-spark birthday-spark-one" aria-hidden="true">✧</span><Artwork name="bear" /><span className="birthday-spark birthday-spark-two" aria-hidden="true">✳</span></div>
      <h2 className="birthday-name">{title}</h2>
      <div className="birthday-date"><span>{date || 'Una fecha muy especial'}</span>{time && <strong>{time}</strong>}</div>
      <a className="birthday-scroll" href="#birthday-welcome">La fiesta empieza aquí <span aria-hidden="true">↓</span></a>
    </header>
    <section className="birthday-welcome" id="birthday-welcome">
      <span className="birthday-eyebrow">HAY MUCHO QUE CELEBRAR</span><h2>Las mejores aventuras<br />se viven juntos.</h2>
      <p>{message || 'Te espero para compartir una tarde de juegos, pastel y momentos felices. ¡Mi fiesta sería más bonita contigo!'}</p>
      {imageUrl && <div className="birthday-portrait"><Image src={imageUrl} alt={title} width={600} height={700} unoptimized /></div>}
      <div className="birthday-friends" aria-hidden="true"><Artwork name="elephant" /><span>¡Y tú eres parte<br />de esta historia!</span><Artwork name="hedgehog" /></div>
    </section>
    {(venue || address) && <section className="birthday-place"><Artwork name="blue-dino" /><div><span className="birthday-eyebrow">GUARDA UN LUGAR EN TU AGENDA</span><h2>¿Dónde es la fiesta?</h2><h3>{venue}</h3><p>{address}</p><p>{date}{time ? ` · ${time}` : ''}</p><a className="birthday-button" href={invitationMapUrl(venue, address)} target="_blank" rel="noopener noreferrer">Cómo llegar <span aria-hidden="true">↗</span></a></div></section>}
    {visible.map((section, index) => <BirthdaySection key={section.id} section={section} index={index} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="birthday-countdown"><span className="birthday-eyebrow">CADA VEZ FALTA MENOS</span><h2>Contando los días<br />para verte.</h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <footer className="birthday-closing"><Artwork name="party-dino" /><p className="birthday-script">¡Que empiece la magia!</p><h2>Te espero en mi fiesta.</h2><strong>{title}</strong><span>HECHO CON CARIÑO · CELEBRADO CONTIGO</span></footer>
  </article>;
}

function BirthdaySection({ section, index, publicEventId }: { section: InviteSection; index: number; publicEventId?: string }) {
  const link = invitationSectionUrl(section.type, section.link);
  const art = section.type === 'gifts' ? 'dino-gift' : section.type === 'rsvp' ? 'tiger' : section.type === 'program' ? 'hedgehog' : section.type === 'dress_code' ? 'elephant' : 'party-dino';
  const gallery = section.type === 'gallery' ? [...new Set([section.imageUrl, ...(section.imageUrls || [])].filter(Boolean))] : [];
  return <section className={`birthday-section birthday-section-${section.type}`}>
    {section.type !== 'gallery' && <div className="birthday-section-art"><Artwork name={art} /></div>}
    <div className="birthday-section-copy"><span className="birthday-eyebrow">{section.type === 'rsvp' ? 'UN SÍ QUE NOS HACE SONREÍR' : `UN POQUITO DE LA FIESTA · ${String(index + 1).padStart(2, '0')}`}</span><h2>{section.title}</h2>
      {section.type === 'program' ? <ol className="birthday-program">{section.content.split('\n').filter(Boolean).map((line, i) => { const parts = line.split(/\s+[—–-]\s+/); return <li key={i}>{parts.length > 1 ? <><strong>{parts[0]}</strong><span>{parts.slice(1).join(' — ')}</span></> : <span>{line}</span>}</li>; })}</ol> : <p>{section.content}</p>}
      {section.detail && <p className="birthday-detail">{section.detail}</p>}
      {section.type !== 'gallery' && section.imageUrl && <Image className="birthday-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
      {gallery.length > 0 && <div className="birthday-gallery">{gallery.map(url => <Image key={url} src={url} alt={section.title} width={500} height={600} unoptimized />)}</div>}
      {section.type === 'rsvp' && section.rsvpMode !== 'external' ? <div className="birthday-rsvp"><RsvpForm eventId={publicEventId} /></div> : link && <a className="birthday-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} <span aria-hidden="true">↗</span></a>}
    </div>
  </section>;
}
