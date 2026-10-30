"use client";

import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import type { ElegantAsset } from '@/lib/birthday-elegant';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function GoldArt({ name, className = '', eager = false }: { name: ElegantAsset; className?: string; eager?: boolean }) {
  return <Image className={`elegant-art ${className}`} src={`/birthday/elegant/${name}.webp`} width={800} height={800} alt="" unoptimized loading={eager ? 'eager' : 'lazy'} />;
}

function accentColors(color: string) {
  const channels = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16));
  const rgb = channels.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  return {
    ink: luminance > .179 ? '#000000' : '#ffffff',
    highlight: luminance >= .2 ? color : `#${channels.map(v => Math.round(v * .5 + 127.5).toString(16).padStart(2, '0')).join('')}`,
  };
}

export function BirthdayElegantInvitation({ name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, sections, publicEventId, accent }: WeddingInvitationProps) {
  const title = hostNames || name || 'Tu celebración';
  const color = /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#D4B77A';
  const palette = accentColors(color);
  const time = eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) ? new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(`1970-01-01T${eventTime}:00Z`)) : eventTime;
  return <article className="birthday-elegant" style={{ '--elegant-accent': color, '--elegant-highlight': palette.highlight, '--elegant-action-ink': palette.ink } as CSSProperties}>
    <header className="elegant-hero">
      <div className="elegant-hero-copy"><span className="elegant-eyebrow">CELEBRACIÓN DE CUMPLEAÑOS</span><div className="elegant-hero-title"><p className="elegant-occasion">{hostNames && name && name !== hostNames ? name : 'Una noche para celebrar'}</p><h1>{title}</h1><p className="elegant-hero-line">Por todo lo vivido.<br /><em>Por todo lo que viene.</em></p></div><div className="elegant-save-date"><div><span>GUARDA LA FECHA</span><strong>{date || 'Una fecha muy especial'}</strong></div>{time && <div><span>A PARTIR DE</span><strong>{time}</strong></div>}</div><a className="elegant-discover" href="#elegant-toast">Descubre la noche <span aria-hidden="true">↓</span></a></div>
      <div className={`elegant-hero-visual${imageUrl ? ' has-portrait' : ''}`}>{imageUrl ? <Image className="elegant-hero-portrait" src={imageUrl} alt={title} width={900} height={1300} unoptimized loading="eager" /> : <div className="elegant-marble" aria-hidden="true" />}<div className="elegant-hero-outline" aria-hidden="true" /><GoldArt name="balloons" className="elegant-hero-balloons" eager /><span className="elegant-visual-note">EL ARTE DE CELEBRAR</span></div>
    </header>

    <section className="elegant-toast" id="elegant-toast"><span className="elegant-eyebrow">LOS BUENOS MOMENTOS SE COMPARTEN</span><h2>Hay mucho<br />por <em>celebrar.</em></h2><div className="elegant-toast-message"><span aria-hidden="true">“</span><p>{message || 'Me encantará celebrar este día contigo. Una noche para brindar, conversar y compartir buenos recuerdos.'}</p></div><GoldArt name="champagne" /><p className="elegant-toast-signature">Con cariño, <strong>{title}</strong></p></section>

    {(venue || address) && <section className="elegant-location"><div className="elegant-location-heading"><span className="elegant-eyebrow">EL ENCUENTRO</span><h2>Una noche.<br /><em>Un lugar especial.</em></h2><GoldArt name="monstera" /></div><div className="elegant-location-details"><h3>{venue || 'El lugar de nuestra celebración'}</h3><p>{address}</p><div className="elegant-location-date"><span>{date}</span>{time && <strong>{time}</strong>}</div><a className="elegant-link" href={invitationMapUrl(venue, address)} target="_blank" rel="noopener noreferrer">Ver ubicación <span aria-hidden="true">↗</span></a></div></section>}

    {sections.filter(section => section.enabled).map(section => <ElegantSection key={section.id} section={section} publicEventId={publicEventId} />)}

    {eventDateKey && eventTime && <section className="elegant-countdown"><GoldArt name="confetti" className="elegant-countdown-confetti" /><span className="elegant-eyebrow">LA FECHA SE ACERCA</span><h2>Nos vemos <em>pronto.</em></h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}

    <footer className="elegant-footer"><GoldArt name="gold-waves" className="elegant-footer-waves" /><span className="elegant-eyebrow">QUE ESTA NOCHE SEA UN GRAN RECUERDO</span><p>Será un placer celebrar contigo.</p><strong>{title}</strong><span className="elegant-footer-rule" aria-hidden="true" /><span>Una celebración para recordar.</span></footer>
  </article>;
}

function ElegantHeading({ section, eyebrow }: { section: InviteSection; eyebrow?: string }) {
  return <div className="elegant-section-heading">{eyebrow && <span className="elegant-eyebrow">{eyebrow}</span>}<h2>{section.title}</h2></div>;
}

function ElegantSection({ section, publicEventId }: { section: InviteSection; publicEventId?: string }) {
  const heading = (eyebrow?: string) => <ElegantHeading section={section} eyebrow={eyebrow} />;
  const content = <ElegantContent section={section} publicEventId={publicEventId} />;
  let scene;
  switch (section.type) {
    case 'gallery': scene = <div className="elegant-gallery-content">{heading()}{content}</div>; break;
    case 'program': scene = <div className="elegant-evening">{heading('CADA MOMENTO, UN RECUERDO')}{content}</div>; break;
    case 'dress_code': scene = <div className="elegant-atelier">{heading('CÓDIGO DE VESTIMENTA')}{content}<GoldArt name="palm" /></div>; break;
    case 'gifts': scene = <div className="elegant-gift-note"><GoldArt name="ornament-frame" className="elegant-gift-frame" />{heading()}{content}<span className="elegant-gift-signature">Gracias por ser parte de mi historia.</span></div>; break;
    case 'music': scene = <div className="elegant-listening">{heading('PARA ACOMPAÑAR LA NOCHE')}{content}<div className="elegant-listening-rule" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div></div>; break;
    case 'rsvp': scene = <div className="elegant-reservation"><div className="elegant-reservation-copy">{heading('CONFIRMACIÓN DE ASISTENCIA')}<p>{section.content}</p>{section.detail && <p className="elegant-detail">{section.detail}</p>}<span className="elegant-reservation-rule" aria-hidden="true" /></div><div className="elegant-reservation-form">{content}</div></div>; break;
    default: scene = <div className="elegant-letter">{heading(section.type === 'parents' ? 'A QUIENES HACEN ESPECIAL MI VIDA' : 'UN DETALLE PARA TI')}{content}</div>;
  }
  return <section className={`elegant-section elegant-section-${section.type}`}>{scene}</section>;
}

function ElegantContent({ section, publicEventId }: { section: InviteSection; publicEventId?: string }) {
  const gallery = section.type === 'gallery';
  const link = invitationSectionUrl(section.type, section.link);
  const images = gallery ? [...new Set([section.imageUrl, ...(section.imageUrls || [])].filter(Boolean))] : [];
  return <div className="elegant-content">
    {section.type === 'program' ? <ol className="elegant-program">{section.content.split('\n').filter(Boolean).map((line, i) => {
      const [time, ...description] = line.split(/\s+[—–-]\s+/);
      return <li key={i}><span className="elegant-program-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><div>{description.length > 0 && <strong>{time}</strong>}<p>{description.length ? description.join(' — ') : line}</p></div></li>;
    })}</ol> : section.type !== 'rsvp' && section.content && <p>{section.content}</p>}
    {section.type !== 'rsvp' && section.detail && <p className="elegant-detail">{section.detail}</p>}
    {!gallery && section.imageUrl && <Image className="elegant-section-photo" src={section.imageUrl} alt={section.title} width={800} height={600} unoptimized />}
    {images.length > 0 && <div className="elegant-gallery">{images.map((url, i) => <Image key={url} src={url} alt={`${section.title}, foto ${i + 1}`} width={700} height={800} unoptimized />)}</div>}
    {section.type === 'rsvp' && section.rsvpMode !== 'external' ? <div className="elegant-rsvp"><RsvpForm eventId={publicEventId} /></div> : link && <a className="elegant-link" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} <span aria-hidden="true">↗</span></a>}
  </div>;
}
