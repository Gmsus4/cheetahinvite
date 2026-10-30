"use client";
import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function SpaceArt({name,className=''}:{name:string;className?:string}) {
  return <Image className={`space-art space-art-${name} ${className}`} src={`/birthday/space/${name}.webp`} alt="" width={800} height={800} unoptimized />;
}
export function BirthdaySpaceInvitation({name,hostNames,date,eventDateKey,eventTime,venue,address,message,imageUrl,sections,publicEventId,accent}:WeddingInvitationProps) {
  const title=hostNames || name || 'Tu cumpleaños';
  const time=eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)?new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(`1970-01-01T${eventTime}:00Z`)):eventTime;
  return <article className="birthday-space" style={{'--space-accent':/^#[0-9a-f]{6}$/i.test(accent)?accent:'#A89BFF'} as CSSProperties}>
    <header className="space-hero"><div className="space-collage" aria-hidden="true" /><span className="space-kicker">ESTÁS INVITADO · MISIÓN CUMPLEAÑOS</span>
      <div className="space-mirror-scene"><SpaceArt name="spark-blue" className="space-spark-left" /><SpaceArt name="astronaut-saturn" /><SpaceArt name="star" className="space-star-right" /></div>
      <p className="space-script">Una vuelta al Sol. Una nueva aventura.</p><h1>{title}</h1>
      <div className="space-date-ticket"><span>RESERVA LA FECHA</span><strong>{date || 'Una celebración muy especial'}</strong>{time && <b>{time}</b>}</div>
      <a className="space-scroll" href="#space-welcome">COMIENZA LA MISIÓN <span aria-hidden="true">↓</span></a>
    </header>
    <section className="space-welcome" id="space-welcome"><span className="space-kicker">LOS MEJORES MOMENTOS SE COMPARTEN</span><h2>La aventura comienza.<br /><em>Solo faltas tú.</em></h2><p>{message || 'Prepárate para una misión llena de juegos, sorpresas y nuevos recuerdos. ¡Mi tripulación te está esperando!'}</p>
      {imageUrl && <div className="space-portrait"><Image src={imageUrl} alt={title} width={650} height={750} unoptimized /></div>}
      <div className="space-mirror-row"><SpaceArt name="astronaut-star" /><SpaceArt name="astronaut-wave" /><SpaceArt name="astronaut-reach" /></div><p className="space-script">Explorar. Jugar. Soñar.</p>
    </section>
    <section className="space-soundcheck"><SpaceArt name="astronaut-rocket" /><div><span className="space-kicker">DESTINO: UN CUMPLEAÑOS INOLVIDABLE</span><h2>Pequeños astronautas.<br />Grandes aventuras.</h2><p>Activa tu imaginación y prepara el despegue.<br />La próxima aventura la vivimos juntos.</p></div><span className="space-record" aria-hidden="true" /></section>
    {(venue || address) && <section className="space-location"><div className="space-location-card"><div><span className="space-kicker">AQUÍ NOS ENCONTRAMOS</span><h2>Tu destino:<br /><em>la celebración.</em></h2><h3>{venue}</h3><p>{address}</p><p>{date}{time?` · ${time}`:''}</p><a className="space-button" href={invitationMapUrl(venue,address)} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div><SpaceArt name="ufo" /></div></section>}
    {sections.filter(s=>s.enabled).map((section,index)=><SpaceSection key={section.id} section={section} index={index} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="space-countdown"><SpaceArt name="spark-blue" /><span className="space-kicker">CUENTA REGRESIVA PARA EL DESPEGUE</span><h2>Contando los días<br /><em>para celebrar.</em></h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <div className="space-orbit" aria-hidden="true">{["earth","pink-planet","moon","saturn","galaxy","comet","spark-gold"].map(art=><SpaceArt key={art} name={art} />)}</div>
    <footer className="space-footer"><SpaceArt name="astronaut-moon" /><p className="space-script">El universo es más bonito contigo</p><h2>¡Te espero!</h2><strong>{title}</strong><small>UNA MISIÓN ESPECIAL · UNA TRIPULACIÓN INCREÍBLE</small></footer>
  </article>;
}
function SpaceSection({section,index,publicEventId}:{section:InviteSection;index:number;publicEventId?:string}) {
  const link=invitationSectionUrl(section.type,section.link);
  const art=section.type==='music'?'galaxy':section.type==='program'?'astronaut-star':section.type==='rsvp'?'astronaut-wave':section.type==='gifts'?'astronaut-wave':section.type==='dress_code'?'astronaut-moon':section.type==='gallery'?'spark-blue':section.type==='story'?'astronaut-star':section.type==='parents'?'astronaut-wave':section.type==='ceremony'||section.type==='reception'?'astronaut-saturn':'star';
  const images=section.type==='gallery'?[...new Set([section.imageUrl,...(section.imageUrls || [])].filter(Boolean))]:[];
  return <section className={`space-section space-section-${section.type}`}><div className="space-section-inner">{section.type !== 'gallery' && <SpaceArt name={art} />}<div className="space-section-copy"><span className="space-kicker">{section.type==='rsvp'?'TU LUGAR ESTÁ ESPERANDO':`MISIÓN ${String(index+1).padStart(2,'0')}`}</span><h2>{section.title}</h2>
    {section.type==='program'?<ol className="space-program">{section.content.split('\n').filter(Boolean).map((line,i)=>{const parts=line.split(/\s+[—–-]\s+/);return <li key={i}>{parts.length>1?<><strong>{parts[0]}</strong><span>{parts.slice(1).join(' — ')}</span></>:<span>{line}</span>}</li>})}</ol>:section.content && <p>{section.content}</p>}
    {section.detail && <p className="space-detail">{section.detail}</p>}
    {section.type!=='gallery' && section.imageUrl && <Image className="space-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
    {images.length>0 && <div className="space-gallery">{images.map(url=><Image key={url} src={url} alt={section.title} width={500} height={600} unoptimized />)}</div>}
    {section.type==='rsvp' && section.rsvpMode!=='external'?<div className="space-rsvp"><RsvpForm eventId={publicEventId} /></div>:link && <a className="space-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} ↗</a>}
  </div></div></section>;
}
