"use client";
import Image from 'next/image';
import { BirthdayGallery } from './BirthdayGallery';
import type { CSSProperties } from 'react';
import type { WeddingInvitationProps } from './WeddingInvitation';
import type { InviteSection } from '@/lib/invitation-editor';
import { invitationMapUrl, invitationSectionUrl, invitationLinkLabel } from '@/lib/invitation-links';
import { RsvpForm } from './RsvpForm';
import { CountdownTimer } from './CountdownTimer';

function DiscoArt({name,className=''}:{name:string;className?:string}) {
  return <Image className={`disco-art disco-art-${name} ${className}`} src={`/birthday/disco/${name}.webp`} alt="" width={800} height={800} unoptimized />;
}
export function BirthdayDiscoInvitation({name,hostNames,date,eventDateKey,eventTime,venue,address,message,imageUrl,sections,publicEventId,accent}:WeddingInvitationProps) {
  const title=hostNames || name || 'Tu cumpleaños';
  const sectionOffset = (venue || address ? 2 : 1) + 1;
  const time=eventTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)?new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date(`1970-01-01T${eventTime}:00Z`)):eventTime;
  return <article className="birthday-disco" style={{'--disco-accent':/^#[0-9a-f]{6}$/i.test(accent)?accent:'#7154A1'} as CSSProperties}>
    <header className="disco-hero"><div className="disco-collage" aria-hidden="true" /><span className="disco-kicker">ESTÁS INVITADO · CUMPLEAÑOS DISCO</span>
      <div className="disco-mirror-scene"><DiscoArt name="chrome-spark" className="disco-spark-left" /><DiscoArt name="hanging-ball" /><DiscoArt name="holo-star" className="disco-star-right" /></div>
      <p className="disco-script">Una vuelta más. Otra noche para bailar.</p><h1>{title}</h1>
      <div className="disco-date-ticket"><span>RESERVA LA FECHA</span><strong>{date || 'Una celebración muy especial'}</strong>{time && <b>{time}</b>}</div>
      <a className="disco-scroll" href="#disco-welcome">NOS VEMOS EN LA PISTA <span aria-hidden="true">↓</span></a>
    </header>
    <section className="disco-welcome" data-birthday-band="base" id="disco-welcome"><span className="disco-kicker">LOS MEJORES MOMENTOS SE COMPARTEN</span><h2>La pista está lista.<br /><em>Solo faltas tú.</em></h2><p>{message || 'Te espero para celebrar mi cumpleaños con música, abrazos y muchas ganas de bailar. ¡Esta fiesta será más bonita contigo!'}</p>
      {imageUrl && <div className="disco-portrait"><Image src={imageUrl} alt={title} width={650} height={750} unoptimized /></div>}
      <div className="disco-mirror-row"><DiscoArt name="ball-purple" /><DiscoArt name="balloon-dog" /><DiscoArt name="ball-navy" /></div><p className="disco-script">Bailar. Reír. Repetir.</p>
    </section>
    <section className="disco-soundcheck" data-birthday-band="tinted"><DiscoArt name="helmet" /><div><span className="disco-kicker">VOLUMEN ARRIBA, BUENA VIBRA SIEMPRE</span><h2>Una noche<br />con mucho ritmo.</h2><p>El mejor plan empieza con una canción<br />y termina con una gran historia.</p></div><span className="disco-record" aria-hidden="true" /></section>
    {(venue || address) && <section className="disco-location" data-birthday-band="base"><div className="disco-location-card"><div><span className="disco-kicker">AQUÍ NOS ENCONTRAMOS</span><h2>Tu destino:<br /><em>la celebración.</em></h2><h3>{venue}</h3><p>{address}</p><p>{date}{time?` · ${time}`:''}</p><a className="disco-button" href={invitationMapUrl(venue,address)} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div><DiscoArt name="holo-star" /></div></section>}
    {sections.filter(s=>s.enabled).map((section,index)=><DiscoSection key={section.id} section={section} bandIndex={index + sectionOffset} index={index} publicEventId={publicEventId} />)}
    {eventDateKey && eventTime && <section className="disco-countdown" data-birthday-band={(sections.filter(section => section.enabled).length + sectionOffset) % 2 === 0 ? "base" : "tinted"}><DiscoArt name="chrome-spark" /><span className="disco-kicker">YA CASI SUENA NUESTRA CANCIÓN</span><h2>Contando los días<br /><em>para celebrar.</em></h2><CountdownTimer date={eventDateKey} time={eventTime} /></section>}
    <footer className="disco-footer"><DiscoArt name="silver-stars" /><p className="disco-script">Que nunca falten motivos para bailar</p><h2>¡Te espero!</h2><strong>{title}</strong><small>UNA NOCHE ESPECIAL · UN RECUERDO PARA SIEMPRE</small></footer>
  </article>;
}
function DiscoSection({ section, index, bandIndex, publicEventId }: { section: InviteSection; index: number; bandIndex: number; publicEventId?: string }) {
  const link=invitationSectionUrl(section.type,section.link);
  const art=section.type==='music'?'helmet-silver':section.type==='program'?'ball-purple':section.type==='rsvp'?'pencil':section.type==='gifts'?'balloon-dog':section.type==='dress_code'?'silver-stars':section.type==='gallery'?'chrome-spark':section.type==='story'?'ball-purple':section.type==='parents'?'balloon-dog':section.type==='ceremony'||section.type==='reception'?'hanging-ball':'holo-star';
  const images=section.type==='gallery'?[...new Set([section.imageUrl,...(section.imageUrls || [])].filter(Boolean))]:[];
  return <section className={`disco-section disco-section-${section.type}`} data-birthday-band={bandIndex % 2 === 0 ? "base" : "tinted"}><div className="disco-section-inner">{section.type !== 'gallery' && <DiscoArt name={art} />}<div className="disco-section-copy"><span className="disco-kicker">{section.type==='rsvp'?'TU LUGAR ESTÁ ESPERANDO':`EL LADO ${String(index+1).padStart(2,'0')} DE LA FIESTA`}</span><h2>{section.title}</h2>
    {section.type==='program'?<ol className="disco-program">{section.content.split('\n').filter(Boolean).map((line,i)=>{const parts=line.split(/\s+[—–-]\s+/);return <li key={i}>{parts.length>1?<><strong>{parts[0]}</strong><span>{parts.slice(1).join(' — ')}</span></>:<span>{line}</span>}</li>})}</ol>:section.content && <p>{section.content}</p>}
    {section.detail && <p className="disco-detail">{section.detail}</p>}
    {section.type!=='gallery' && section.imageUrl && <Image className="disco-section-photo" src={section.imageUrl} alt={section.title} width={700} height={500} unoptimized />}
    {images.length > 0 && <BirthdayGallery images={images} title={section.title} theme="disco" />}
    {section.type==='rsvp' && section.rsvpMode!=='external'?<div className="disco-rsvp"><RsvpForm eventId={publicEventId} /></div>:link && <a className="disco-button" href={link} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} ↗</a>}
  </div></div></section>;
}
