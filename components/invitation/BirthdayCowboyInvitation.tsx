"use client";

import Image from 'next/image';
import { BirthdayGallery } from './BirthdayGallery';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import type { CowboyAsset } from '@/lib/birthday-cowboy';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function RanchArt({ name, className = '', eager = false }: { name: CowboyAsset; className?: string; eager?: boolean }) {
  return <Image className={`cowboy-art ${className}`} src={`/birthday/cowboy/${name}.webp`} alt="" width={800} height={800} unoptimized loading={eager ? 'eager' : 'lazy'} />;
}

export function BirthdayCowboyInvitation({ name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, sections, publicEventId, accent }: WeddingInvitationProps) {
  const title = hostNames || name || 'Tu cumpleaños';
  const sectionOffset = (venue || address ? 2 : 1);
  const time = eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) ? new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(`1970-01-01T${eventTime}:00Z`)) : eventTime;
  return <article className="birthday-cowboy" style={{ '--cowboy-accent': /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#9B4B2B' } as CSSProperties}>
    <header className="cowboy-hero">
      <div className="cowboy-hero-masthead"><span>UNA GRAN FIESTA</span><RanchArt name="hat" className="cowboy-hero-hat" eager /><span>ESPÍRITU DEL OESTE</span></div>
      <div className="cowboy-hero-poster"><p className="cowboy-script">Se arma la fiesta de</p><div className="cowboy-name-scene"><h1>{title}</h1></div><span className="cowboy-hero-subtitle">¡ESTÁS INVITADO A MI CUMPLEAÑOS!</span><div className="cowboy-hero-pass"><span>APARTA EL DÍA</span><strong>{date || 'Una fecha muy especial'}</strong>{time && <b>{time}</b>}</div><a href="#cowboy-welcome" className="cowboy-hero-link">ENTRA A LA FIESTA <span aria-hidden="true">↓</span></a></div>
      <p className="cowboy-hero-bottom">BOTAS EN EL SUELO. &nbsp; EL CORAZÓN DE FIESTA.</p>
    </header>

    <section className="cowboy-welcome" data-birthday-band="base" id="cowboy-welcome"><div className="cowboy-broadside"><span className="cowboy-background-word" aria-hidden="true">RODEO</span><div className="cowboy-bull-scene" aria-hidden="true"><RanchArt name="bull" /><span className="cowboy-ranch-seal">BUENA<br />COMPAÑÍA</span></div><div className="cowboy-welcome-copy"><span className="cowboy-kicker">UNA CELEBRACIÓN A MI MANERA</span><h2>Sin prisa.<br />Con botas.<br /><em>Y contigo.</em></h2><p>{message || 'Ponte el sombrero y ven a compartir un cumpleaños con mucho espíritu vaquero. ¡La fiesta es mejor contigo!'}</p><span className="cowboy-handwritten">Aquí se hacen los buenos recuerdos.</span></div></div>{imageUrl && <figure className="cowboy-portrait"><Image src={imageUrl} alt={title} width={750} height={850} unoptimized /><figcaption>Un recuerdo más para nuestra historia</figcaption></figure>}</section>

    {(venue || address) && <section className="cowboy-location" data-birthday-band="tinted"><div className="cowboy-admission"><div className="cowboy-admission-main"><span className="cowboy-kicker">TU BOLETO A UNA GRAN FIESTA</span><h2>{venue || 'Nuestro punto de encuentro'}</h2><p>{address}</p><div className="cowboy-admission-bottom"><a className="cowboy-button" href={invitationMapUrl(venue, address)} target="_blank" rel="noopener noreferrer">Cómo llegar <span aria-hidden="true">↗</span></a><RanchArt name="wagon-cactus" /></div></div><div className="cowboy-admission-stub"><span className="cowboy-kicker">NOS VEMOS</span>{time && <strong>{time}</strong>}<p>{date || 'Una fecha muy especial'}</p><span className="cowboy-stub-star" aria-hidden="true">✦</span><span>UN LUGAR<br />PARA TI</span></div></div></section>}

    {sections.filter(section => section.enabled).map((section,index) => <CowboySection key={section.id} section={section} bandIndex={index + sectionOffset} publicEventId={publicEventId} />)}

    {eventDateKey && eventTime && <section className="cowboy-countdown" data-birthday-band={(sections.filter(section => section.enabled).length + sectionOffset) % 2 === 0 ? "base" : "tinted"}><div className="cowboy-countdown-heading"><span className="cowboy-kicker">EN LA CUENTA REGRESIVA</span><h2>El gran día<br />se acerca.</h2><p>¡Ya queremos celebrar contigo!</p></div><CountdownTimer date={eventDateKey} time={eventTime} /></section>}

    <footer className="cowboy-footer"><RanchArt name="desert-cactus" className="cowboy-footer-cactus" /><div><p className="cowboy-script">Hay historias que merecen una gran fiesta</p><h2>¡Nos vemos<br />en el rancho!</h2><strong>{title}</strong><RanchArt name="spur" className="cowboy-footer-spur" /><span className="cowboy-kicker">CON CARIÑO Y ESPÍRITU VAQUERO</span></div></footer>
  </article>;
}

function CowboyHeading({ section, eyebrow }: { section: InviteSection; eyebrow?: string }) {
  return <div className="cowboy-section-heading">{eyebrow && <span className="cowboy-kicker">{eyebrow}</span>}<h2>{section.title}</h2></div>;
}

function CowboySection({ section, bandIndex, publicEventId }: { section: InviteSection; bandIndex: number; publicEventId?: string }) {
  const heading = (eyebrow?: string) => <CowboyHeading section={section} eyebrow={eyebrow} />;
  const content = <CowboySectionContent section={section} publicEventId={publicEventId} />;
  let scene;
  switch (section.type) {
    case 'gallery': scene = <div className="cowboy-gallery-content">{heading()}{content}</div>; break;
    case 'program': scene = <div className="cowboy-trail"><RanchArt name="longhorn-skull" className="cowboy-trail-emblem" />{heading('LA RUTA DE LA CELEBRACIÓN')}{content}</div>; break;
    case 'dress_code': scene = <div className="cowboy-outfit">{heading('EL ESTILO SE LLEVA PUESTO')}<div className="cowboy-outfit-copy">{content}</div><div className="cowboy-outfit-stage" aria-hidden="true"><span className="cowboy-outfit-oval" /><RanchArt name="boots" className="cowboy-outfit-boots" /><RanchArt name="bandana" className="cowboy-outfit-bandana" /><RanchArt name="belt" className="cowboy-outfit-belt" /><span className="cowboy-outfit-caption">A TU MANERA</span></div></div>; break;
    case 'gifts': scene = <div className="cowboy-gift-scene"><RanchArt name="lasso" className="cowboy-gift-lasso" /><div className="cowboy-gift-letter"><span className="cowboy-letter-pin" aria-hidden="true" />{heading()}{content}<span className="cowboy-handwritten">Con mucho cariño</span></div></div>; break;
    case 'music': scene = <div className="cowboy-saloon"><span className="cowboy-saloon-star" aria-hidden="true">✦</span>{heading('QUE SUENEN LAS BUENAS CANCIONES')}{content}<RanchArt name="tequila" className="cowboy-saloon-drink" /></div>; break;
    case 'rsvp': scene = <div className="cowboy-reservation"><div className="cowboy-reservation-top"><RanchArt name="horseshoe" /><span className="cowboy-handwritten">Pásale, estás en tu casa</span></div><div className="cowboy-reservation-paper">{heading('CONFIRMA TU ASISTENCIA')}{content}</div></div>; break;
    default: scene = <div className="cowboy-postcard">{heading('ENTRE AMIGOS Y BUENOS RECUERDOS')}{content}<RanchArt name={section.type === 'parents' ? 'hat' : 'wagon-cactus'} className="cowboy-postcard-art" /></div>;
  }
  return <section className={`cowboy-section cowboy-section-${section.type}`} data-birthday-band={bandIndex % 2 === 0 ? "base" : "tinted"}>{scene}</section>;
}

function CowboySectionContent({ section, publicEventId }: { section: InviteSection; publicEventId?: string }) {
  const gallery = section.type === 'gallery';
  const link = invitationSectionUrl(section.type, section.link);
  const images = gallery ? [...new Set([section.imageUrl, ...(section.imageUrls || [])].filter(Boolean))] : [];
  return <div className="cowboy-section-content">
    {section.type === 'program' ? <ol className="cowboy-program">{section.content.split('\n').filter(Boolean).map((line, i) => {
      const [time, ...description] = line.split(/\s+[—–-]\s+/);
      return <li key={i}><strong>{description.length ? time : String(i + 1).padStart(2, '0')}</strong><span>{description.length ? description.join(' — ') : line}</span></li>;
    })}</ol> : section.content && <p>{section.content}</p>}
    {section.detail && <p className="cowboy-detail">{section.detail}</p>}
    {!gallery && section.imageUrl && <Image className="cowboy-section-photo" src={section.imageUrl} alt={section.title} width={800} height={600} unoptimized />}
    {images.length > 0 && <BirthdayGallery images={images} title={section.title} theme="cowboy" />}
    {section.type === 'rsvp' && section.rsvpMode !== 'external' ? <div className="cowboy-rsvp"><RsvpForm eventId={publicEventId} /></div> : link && <a className="cowboy-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} <span aria-hidden="true">↗</span></a>}
  </div>;
}
