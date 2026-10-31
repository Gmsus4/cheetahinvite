"use client";
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useRef, useState } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function SpaceArt({name,className=''}:{name:string;className?:string}) {
  const dimensions: Record<string, [number, number]> = {
    'astronaut-resting': [969, 659],
    'astronaut-gift': [849, 783],
    'astronaut-hero': [560, 561], 'astronaut-earth': [456, 482],
    'astronaut-photo': [433, 504], 'astronaut-reading': [466, 521],
    'astronaut-music': [510, 449], 'astronaut-flying': [548, 395],
  };
  const [width, height] = dimensions[name] ?? [800, 800];
  return <Image className={`space-art space-art-${name} ${className}`} src={`/birthday/space/${name}.webp`} alt="" width={width} height={height} unoptimized />;
}
export function BirthdaySpaceInvitation({name,hostNames,date,eventDateKey,eventTime,venue,address,message,imageUrl,sections,publicEventId,accent}:WeddingInvitationProps) {
  const title=hostNames || name || 'Tu cumpleaños';
  const hasLocation = Boolean(venue || address);
  const visibleSections = sections.filter(section => section.enabled);
  const time=eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)?new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(`1970-01-01T${eventTime}:00Z`)):eventTime;
  return <article className="birthday-space" style={{'--space-accent':/^#[0-9a-f]{6}$/i.test(accent)?accent:'#A89BFF'} as CSSProperties}>
    <header className="space-hero"><div className="space-collage" aria-hidden="true" /><span className="space-kicker">ESTÁS INVITADO · MISIÓN CUMPLEAÑOS</span>
      <div className="space-mirror-scene"><SpaceArt name="spark-blue" className="space-spark-left" /><SpaceArt name="astronaut-hero" /><SpaceArt name="star" className="space-star-right" /></div>
      <p className="space-script">Una vuelta al Sol. Una nueva aventura.</p><h1>{title}</h1>
      <div className="space-date-ticket"><span>RESERVA LA FECHA</span><strong>{date || 'Una celebración muy especial'}</strong>{time && <b>{time}</b>}</div>
      <a className="space-scroll" href="#space-welcome">COMIENZA LA MISIÓN <span aria-hidden="true">↓</span></a>
    </header>
    <section className="space-welcome" id="space-welcome"><span className="space-kicker">LOS MEJORES MOMENTOS SE COMPARTEN</span><h2>La aventura comienza.<br /><em>Solo faltas tú.</em></h2><p>{message || 'Prepárate para una misión llena de juegos, sorpresas y nuevos recuerdos. ¡Mi tripulación te está esperando!'}</p>
      {imageUrl && <div className="space-portrait"><Image src={imageUrl} alt={title} width={650} height={750} unoptimized /></div>}
      <div className="space-mirror-row"><SpaceArt name="astronaut-earth" /></div><p className="space-script">Explorar. Jugar. Soñar.</p>
    </section>
    <section className="space-soundcheck space-band-tinted"><SpaceArt name="astronaut-rocket" /><div><span className="space-kicker">DESTINO: UN CUMPLEAÑOS INOLVIDABLE</span><h2>Pequeños astronautas.<br />Grandes aventuras.</h2><p>Activa tu imaginación y prepara el despegue.<br />La próxima aventura la vivimos juntos.</p></div><span className="space-record" aria-hidden="true" /></section>
    {hasLocation && <section className="space-location space-band-base"><div className="space-location-card"><div><span className="space-kicker">AQUÍ NOS ENCONTRAMOS</span><h2>Tu destino:<br /><em>la celebración.</em></h2><h3>{venue}</h3><p>{address}</p><p>{date}{time?` · ${time}`:''}</p><a className="space-button" href={invitationMapUrl(venue,address)} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div><SpaceArt name="astronaut-flying" /></div></section>}
    {visibleSections.map((section,index)=><SpaceSection key={section.id} section={section} index={index} visualIndex={index + (hasLocation ? 2 : 1)} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="space-countdown"><SpaceArt name="spark-blue" /><span className="space-kicker">CUENTA REGRESIVA PARA EL DESPEGUE</span><h2>Contando los días<br /><em>para celebrar.</em></h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <div className="space-orbit" aria-hidden="true">{["earth","pink-planet","moon","saturn","galaxy","comet","spark-gold"].map(art=><SpaceArt key={art} name={art} />)}</div>
    <footer className="space-footer"><SpaceArt name="astronaut-resting" /><p className="space-script">El universo es más bonito contigo</p><h2>¡Te espero!</h2><strong>{title}</strong><small>UNA MISIÓN ESPECIAL · UNA TRIPULACIÓN INCREÍBLE</small></footer>
  </article>;
}
function SpaceSection({section,index,visualIndex,publicEventId}:{section:InviteSection;index:number;visualIndex:number;publicEventId?:string}) {
  const link=invitationSectionUrl(section.type,section.link);
  const art=section.type==='music'?'astronaut-music':section.type==='program'?'astronaut-star':section.type==='rsvp'?'astronaut-wave':section.type==='gifts'?'ufo':section.type==='dress_code'?'astronaut-moon':section.type==='gallery'?'astronaut-photo':section.type==='story'?'astronaut-reading':section.type==='parents'?'astronaut-reach':section.type==='ceremony'?'astronaut-saturn':section.type==='reception'?'comet':'astronaut-gift';
  const images=section.type==='gallery'?[...new Set([section.imageUrl,...(section.imageUrls || [])].filter(Boolean))]:[];
  return <section className={`space-section space-section-${section.type} ${visualIndex % 2 === 0 ? 'space-band-tinted' : 'space-band-base space-section-reversed'}`}><div className="space-section-inner">{section.type !== 'gallery' && <SpaceArt name={art} />}<div className="space-section-copy"><span className="space-kicker">{section.type==='rsvp'?'TU LUGAR ESTÁ ESPERANDO':`MISIÓN ${String(index+1).padStart(2,'0')}`}</span><h2>{section.title}</h2>
    {section.type==='program'?<ol className="space-program">{section.content.split('\n').filter(Boolean).map((line,i)=>{const parts=line.split(/\s+[—–-]\s+/);return <li key={i}>{parts.length>1?<><strong>{parts[0]}</strong><span>{parts.slice(1).join(' — ')}</span></>:<span>{line}</span>}</li>})}</ol>:section.content && <p>{section.content}</p>}
    {section.detail && <p className="space-detail">{section.detail}</p>}
    {section.type!=='gallery' && section.imageUrl && <Image className="space-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
    {images.length>0 && <SpaceGallery images={images} title={section.title} />}
    {section.type==='rsvp' && section.rsvpMode!=='external'?<div className="space-rsvp"><RsvpForm eventId={publicEventId} /></div>:link && <a className="space-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} ↗</a>}
  </div></div></section>;
}

function SpaceGallery({images,title}:{images:string[];title:string}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [orientations, setOrientations] = useState<Record<string, 'horizontal' | 'vertical' | 'square'>>({});
  const move = (step: number) => setActive(current => (current + step + images.length) % images.length);
  return <>
    <div className="space-gallery">
      {images.map((url,index) => <button key={url} type="button" className="space-gallery-tile" data-orientation={orientations[url] ?? 'square'} aria-label={`Ampliar foto ${index + 1} de ${title}`} aria-haspopup="dialog" onClick={() => {
        setActive(index);
        dialog.current?.showModal();
      }}><Image src={url} alt={`${title}, foto ${index + 1}`} width={500} height={600} unoptimized onLoad={event => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (!naturalWidth || !naturalHeight) return;
        const orientation = naturalWidth > naturalHeight ? 'horizontal' : naturalWidth < naturalHeight ? 'vertical' : 'square';
        setOrientations(current => current[url] === orientation ? current : { ...current, [url]: orientation });
      }} /><span aria-hidden="true">↗</span></button>)}
    </div>
    <dialog ref={dialog} className="space-gallery-viewer" aria-label={`Fotos de ${title}`} onClick={event => {
      if (event.target === event.currentTarget) dialog.current?.close();
    }} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    }}>
      <div className="space-gallery-viewer-panel">
        <button type="button" className="space-gallery-close" aria-label="Cerrar foto" onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        <Image className="space-gallery-expanded" src={images[active] ?? images[0]} alt={`${title}, foto ${active + 1}`} width={1400} height={1000} unoptimized />
        <div className="space-gallery-controls">
          {images.length > 1 && <button type="button" aria-label="Foto anterior" onClick={() => move(-1)}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 12H5m7 7-7-7 7-7" /></svg></button>}
          <span aria-live="polite">{active + 1} / {images.length}</span>
          {images.length > 1 && <button type="button" aria-label="Foto siguiente" onClick={() => move(1)}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14m-7-7 7 7-7 7" /></svg></button>}
        </div>
      </div>
    </dialog>
  </>;
}
