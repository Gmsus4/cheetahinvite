"use client";

import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import type { GamerAsset } from '@/lib/birthday-gamer';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function GameArt({ name, className = '', eager = false }: { name: GamerAsset; className?: string; eager?: boolean }) {
  return <Image className={`gamer-art ${className}`} src={`/birthday/gamer/${name}.webp`} width={800} height={800} alt="" unoptimized loading={eager ? 'eager' : 'lazy'} />;
}

export function BirthdayGamerInvitation({ name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, sections, publicEventId, accent }: WeddingInvitationProps) {
  const title = hostNames || name || 'Tu cumpleaños';
  const time = eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) ? new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(`1970-01-01T${eventTime}:00Z`)) : eventTime;
  return <article className="birthday-gamer" style={{ '--gamer-accent': /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#7450CC' } as CSSProperties}>
    <header className="gamer-hero">
      <div className="gamer-hud"><span><i className="gamer-status" /> MISIÓN: CUMPLEAÑOS</span><span className="gamer-lives" aria-hidden="true">♥ ♥ ♥</span></div>
      <div className="gamer-console">
        <div className="gamer-window-bar"><span>PARTIDA ESPECIAL</span><span aria-hidden="true">— &nbsp; □ &nbsp; ×</span></div>
        <div className="gamer-stage">
          <div className="gamer-hero-copy"><span className="gamer-kicker">¡ESTÁS INVITADO A MI CUMPLEAÑOS!</span><h1>{title}</h1><p>Subimos de nivel.<br /><strong>¡Y tú estás en mi equipo!</strong></p><a className="gamer-button gamer-start" href="#gamer-start">START · Ver la partida <span aria-hidden="true">↓</span></a></div>
          <div className="gamer-hero-art" aria-hidden="true"><span className="gamer-orbit" /><span className="gamer-plus gamer-plus-one">✚</span><GameArt name="mario-kart" eager /><GameArt name="lucky-block" className="gamer-hero-block" eager /><span className="gamer-plus gamer-plus-two">✚</span></div>
        </div>
        <div className="gamer-date-strip"><span>GUARDA LA PARTIDA</span><strong>{date || 'Una fecha muy especial'}</strong>{time && <b>{time}</b>}</div>
      </div>
      <p className="gamer-hero-caption">UNA FIESTA MULTIJUGADOR · RECUERDOS EN MODO INFINITO</p>
    </header>

    <section className="gamer-welcome" id="gamer-start"><div className="gamer-welcome-intro"><span className="gamer-kicker">MODO CELEBRACIÓN: ACTIVADO</span><h2>Las mejores partidas<br />se juegan <em>juntos.</em></h2><p>{message || 'Te espero para un cumpleaños lleno de juegos, risas y sorpresas. ¡La aventura es mucho mejor contigo!'}</p></div>
      {imageUrl && <Image className="gamer-portrait" src={imageUrl} alt={title} width={700} height={800} unoptimized />}
      <div className="gamer-player-cards" aria-hidden="true"><figure><span>PLAYER 01</span><GameArt name="fall-guy" /><figcaption>Jugar sin parar</figcaption></figure><figure><span>PLAYER 02</span><GameArt name="peach-kart" /><figcaption>Reír a toda velocidad</figcaption></figure><figure><span>PLAYER 03</span><GameArt name="spike" /><figcaption>Celebrar en equipo</figcaption></figure></div>
    </section>

    {(venue || address) && <section className="gamer-location"><div className="gamer-location-frame"><div className="gamer-location-art" aria-hidden="true"><span className="gamer-crosshair" /><GameArt name="isabelle" /><span className="gamer-tag">CHECKPOINT</span></div><div className="gamer-location-copy"><span className="gamer-kicker">DESTINO DESBLOQUEADO</span><h2>Nos vemos<br /><em>en este nivel.</em></h2><h3>{venue}</h3><p>{address}</p><p className="gamer-location-date">{date}{time ? ` · ${time}` : ''}</p><a className="gamer-button" href={invitationMapUrl(venue, address)} target="_blank" rel="noopener noreferrer">Cómo llegar <span aria-hidden="true">↗</span></a></div></div></section>}

    {sections.filter(section => section.enabled).map((section, index) => <GamerSection key={section.id} section={section} index={index} publicEventId={publicEventId} />)}

    {eventDateKey && eventTime && <section className="gamer-countdown"><div className="gamer-countdown-panel"><span className="gamer-kicker">EL SIGUIENTE NIVEL EMPIEZA EN</span><h2>¡Ya casi es<br /><em>hora de jugar!</em></h2><CountdownTimer date={eventDateKey} time={eventTime} /></div><div className="gamer-terrain" aria-hidden="true" /><span className="gamer-world-label" aria-hidden="true">NUEVO MUNDO · NUEVOS RECUERDOS</span></section>}
    <footer className="gamer-footer"><span className="gamer-dpad" aria-hidden="true" /><span className="gamer-kicker">CONTINUAR LA PARTIDA</span><h2>¡Te espero<br />en mi cumpleaños!</h2><strong>{title}</strong><p>La mejor recompensa es celebrar contigo.</p><span className="gamer-footer-lives" aria-hidden="true">♥ &nbsp; ♥ &nbsp; ♥</span></footer>
  </article>;
}

function GamerSection({ section, index, publicEventId }: { section: InviteSection; index: number; publicEventId?: string }) {
  const gallery = section.type === 'gallery';
  const link = invitationSectionUrl(section.type, section.link);
  const images = gallery ? [...new Set([section.imageUrl, ...(section.imageUrls || [])].filter(Boolean))] : [];
  const art: GamerAsset = section.type === 'rsvp' ? 'crewmate' : section.type === 'music' ? 'poco' : section.type === 'gifts' ? 'llama' : section.type === 'program' ? 'chicken-rider' : section.type === 'dress_code' ? 'pixel-dog' : section.type === 'parents' ? 'isabelle' : section.type === 'ceremony' || section.type === 'reception' ? 'peach-kart' : 'fall-guy';
  return <section className={`gamer-section gamer-section-${section.type}`}>
    <div className="gamer-section-frame">
      {!gallery && <div className="gamer-window-bar"><span>{section.type === 'rsvp' ? 'SALA DE ESPERA' : section.type === 'music' ? 'SOUNDTRACK' : `MISIÓN ${String(index + 1).padStart(2, '0')}`}</span><span aria-hidden="true">● ● ●</span></div>}
      <div className="gamer-section-inner">
        {!gallery && <div className="gamer-section-art" aria-hidden="true"><GameArt name={art} /><span className="gamer-art-platform" /></div>}
        <div className="gamer-section-copy"><h2>{section.title}</h2>
          {section.type === 'program' ? <ol className="gamer-program">{section.content.split('\n').filter(Boolean).map((line, i) => {
            const [time, ...description] = line.split(/\s+[—–-]\s+/);
            return <li key={i}><strong>{description.length ? time : String(i + 1).padStart(2, '0')}</strong><span>{description.length ? description.join(' — ') : line}</span></li>;
          })}</ol> : section.content && <p>{section.content}</p>}
          {section.detail && <p className="gamer-detail">{section.detail}</p>}
          {!gallery && section.imageUrl && <Image className="gamer-section-photo" src={section.imageUrl} alt={section.title} width={800} height={600} unoptimized />}
          {images.length > 0 && <div className="gamer-gallery">{images.map((url, i) => <Image key={url} src={url} alt={`${section.title}, foto ${i + 1}`} width={700} height={800} unoptimized />)}</div>}
          {section.type === 'rsvp' && section.rsvpMode !== 'external' ? <div className="gamer-rsvp"><RsvpForm eventId={publicEventId} /></div> : link && <a className="gamer-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} <span aria-hidden="true">↗</span></a>}
        </div>
      </div>
    </div>
  </section>;
}
