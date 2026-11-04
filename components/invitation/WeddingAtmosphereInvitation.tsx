"use client";

import Image from "next/image";
import { FiArrowDown, FiArrowUpRight, FiClock, FiGift, FiHeart, FiMapPin, FiMusic, FiCamera, FiUsers, FiMaximize2 } from "react-icons/fi";
import type { InviteSection } from "@/lib/invitation-editor";
import { getWeddingDesign, weddingArtwork } from "@/lib/wedding-designs";
import { atmospherePhotos, atmosphereSections, atmosphereStyle, atmosphereTime } from "@/lib/wedding-atmosphere";
import { invitationLinkLabel, invitationMapUrl, invitationSectionUrl } from "@/lib/invitation-links";
import type { WeddingInvitationProps } from "./WeddingInvitation";
import { CountdownTimer } from "./CountdownTimer";
import { RsvpForm } from "./RsvpForm";
import { WeddingPhotoCarousel } from "./WeddingPhotoCarousel";

const sectionIcons = { story: FiHeart, ceremony: FiHeart, reception: FiMapPin, program: FiClock, parents: FiUsers, dress_code: FiUsers, gifts: FiGift, gallery: FiCamera, rsvp: FiHeart, music: FiMusic, custom: FiHeart };

export function WeddingAtmosphereInvitation(props: WeddingInvitationProps) {
  const design = getWeddingDesign(props.templateId)!;
  const art = weddingArtwork(design);
  const title = props.hostNames.trim() || "Nuestra boda";
  const names = title.split(/\s+(?:y|&)\s+/i);
  const sections = atmosphereSections(props.sections);
  const photos = atmospherePhotos(props.imageUrl, sections);
  const time = atmosphereTime(props.eventTime);
  const date = props.eventDateKey ? props.date : "La fecha, muy pronto";
  const initials = names.map(name => name.trim()[0]).slice(0, 2).join(" & ");

  return <article className="wedding-atmosphere" data-design={design.kind} data-photo={Boolean(props.imageUrl)} data-long-names={title.length > 25 || undefined} style={atmosphereStyle(design, props.accent)}>
    <div className="wa-backdrop" aria-hidden="true">
      {photos.length > 0 && <div className="wa-backdrop-photos">{Array.from({ length: 4 }, (_, index) => <div key={index}><Image src={photos[index % photos.length]} alt="" fill sizes="50vw" unoptimized loading={index === 0 ? "eager" : "lazy"} /></div>)}</div>}
      <div className="wa-backdrop-texture" /><div className="wa-backdrop-botanicals" /><div className="wa-backdrop-shade" />
    </div>
    <div className="wa-column">
      <header className="wa-panel wa-cover">
        <div className="wa-cover-heading"><span className="wa-kicker">Nuestra boda</span>
          <h1 aria-label={title}>{names.length === 2 ? <>{names[0]}<span className="wa-ampersand" aria-hidden="true">&amp;</span>{names[1]}</> : title}</h1>
          <p className="wa-date">{date}{time && <><span aria-hidden="true"> · </span>{time}</>}</p>
        </div>
        {props.imageUrl ? <div className="wa-portrait"><Image src={props.imageUrl} alt={`La pareja: ${title}`} width={900} height={1125} sizes="(max-width:600px) 94vw, 540px" preload unoptimized /></div>
          : <div className="wa-no-photo" aria-hidden="true">{art.flower && <Image src={art.flower} alt="" width={160} height={160} unoptimized />}<span>{initials}</span><i>El comienzo de nuestro siempre</i></div>}
        <a className="wa-discover" href="#wedding-celebration">Celebra con nosotros<FiArrowDown aria-hidden="true" /></a>
      </header>
      {props.eventDateKey && <section className="wa-panel wa-countdown" aria-label="Cuenta regresiva"><span className="wa-kicker">Cada vez más cerca</span><CountdownTimer date={props.eventDateKey} time={props.eventTime || "00:00"} /></section>}
      <section className="wa-panel wa-welcome" id="wedding-celebration">
        {art.flower && <Image className="wa-small-motif" src={art.flower} alt="" width={68} height={68} unoptimized />}
        <h2>Queremos compartir<br /><em>este día contigo.</em></h2>
        <p>{props.message.trim() || "Nos encantará tenerte cerca para celebrar el comienzo de esta nueva etapa."}</p>
      </section>
      {(props.venue || props.address) && <section className="wa-panel wa-location" aria-labelledby="wedding-location-title">
        <FiMapPin className="wa-section-icon" aria-hidden="true" /><h2 id="wedding-location-title">La celebración</h2>
        <h3>{props.venue || "Nos vemos aquí"}</h3><p>{date}{time && ` · ${time}`}</p>{props.address && <p>{props.address}</p>}
        <a className="wa-button" href={invitationMapUrl(props.venue, props.address)} target="_blank" rel="noopener noreferrer">Cómo llegar<FiArrowUpRight aria-hidden="true" /></a>
      </section>}
      {sections.map(section => <AtmosphereSection key={section.id} section={section} eventId={props.publicEventId} />)}
      <footer className="wa-footer"><span className="wa-kicker">Con todo nuestro amor</span><strong>{title}</strong><p>Gracias por ser parte de nuestra historia.</p><small>Cheetah Invite</small></footer>
    </div>
  </article>;
}

function AtmosphereSection({ section, eventId }: { section: InviteSection; eventId?: string }) {
  const Icon = sectionIcons[section.type];
  const sectionPhoto = section.type !== "gallery" ? section.imageUrl : "";
  const attachedImages = section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : [];
  const images = sectionPhoto ? attachedImages.filter(src => src !== sectionPhoto) : attachedImages;
  const photoPosition = section.imagePosition ?? "after";
  const photo = sectionPhoto ? <figure className="wa-section-photo" data-photo-position={photoPosition}>
    <a href={sectionPhoto} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar la foto de ${section.title}`}><Image src={sectionPhoto} alt={`Foto que acompaña ${section.title}`} width={1200} height={800} sizes="(max-width:600px) 90vw, 530px" unoptimized /><span aria-hidden="true"><FiMaximize2 /></span></a>
  </figure> : null;
  const url = invitationSectionUrl(section.type, section.link);
  return <>{photoPosition === "before" && photo}<section className={`wa-panel wa-section wa-${section.type}`} aria-label={section.title}>
    {section.type !== "gallery" && <Icon className="wa-section-icon" aria-hidden="true" />}<h2>{section.title}</h2>
    {section.detail && <p className="wa-detail">{section.detail}</p>}
    {section.type === "program" ? <ol className="wa-timeline">{section.content.split("\n").filter(line => line.trim()).map((line, index) => {
      const parts = line.split(/\s+[—–-]\s+/);
      const time = parts.length > 1 ? parts.shift() : "";
      return <li key={index}>{time && <span className="wa-timeline-time">{time}</span>}<span>{parts.join(" — ")}</span></li>;
    })}</ol> : section.content && <p>{section.content}</p>}
    {images.length > 0 && (section.type === "gallery" ? <WeddingPhotoCarousel images={images} title={section.title} /> : <div className="wa-photo-grid">{images.map((src, index) => <a key={`${src}-${index}`} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Abrir fotografía ${index + 1} de ${section.title}`}><Image src={src} alt={`${section.title} · fotografía ${index + 1}`} width={800} height={1000} sizes="(max-width:600px) 88vw, 500px" unoptimized /></a>)}</div>)}
    {section.type === "rsvp" && section.rsvpMode === "integrated" ? <RsvpForm eventId={eventId} /> : url && <a className="wa-button" href={url} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)}<FiArrowUpRight aria-hidden="true" /></a>}
  </section>{photoPosition === "after" && photo}</>;
}
