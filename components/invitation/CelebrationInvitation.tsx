"use client";

import Image from "next/image";
import { FiArrowUpRight, FiClock, FiGift, FiHeart, FiMapPin, FiMusic, FiCamera, FiUsers } from "react-icons/fi";
import type { InviteSection } from "@/lib/invitation-editor";
import { getInvitationEventContent, invitationPresentation } from "@/lib/invitation-event-content";
import { atmospherePanelStyle, atmosphereSections, atmosphereStyle, atmosphereTime } from "@/lib/invitation-atmosphere";
import { invitationLinkLabel, invitationMapUrl, invitationSectionUrl } from "@/lib/invitation-links";
import type { InvitationProps } from "@/lib/invitation-editor";
import { CountdownTimer } from "./CountdownTimer";
import { RsvpForm } from "./RsvpForm";
import { InvitationPhotoCarousel } from "./InvitationPhotoCarousel";
import { useInvitationMotion } from "@/components/dashboard/useInvitationMotion";

const sectionIcons = { story: FiHeart, ceremony: FiHeart, reception: FiMapPin, program: FiClock, parents: FiUsers, dress_code: FiUsers, gifts: FiGift, gallery: FiCamera, rsvp: FiHeart, music: FiMusic, custom: FiHeart };

export function CelebrationInvitation(props: InvitationProps & { preview?: boolean }) {
  const motion = useInvitationMotion(!props.preview);
  const panelStyle = props.panelStyle ?? "auto";
  const eventType = props.eventType ?? "wedding";
  const content = getInvitationEventContent(eventType);
  const copy = invitationPresentation(eventType);
  const title = props.hostNames.trim() || props.name.trim() || content.defaultName;
  const couple = eventType === "wedding" || eventType === "anniversary";
  const names = couple ? title.split(/\s+(?:y|&)\s+/i) : [title];
  const sections = atmosphereSections(props.sections);
  const time = atmosphereTime(props.eventTime);
  const date = props.eventDateKey ? props.date : "La fecha, muy pronto";
  const initials = couple ? names.map(name => name.trim()[0]).slice(0, 2).join(" & ") : title.split(/\s+/).map(part => part[0]).slice(0, 2).join("");
  const hasLocation = Boolean(props.venue || props.address);
  const firstDetailIndex = 2 + Number(Boolean(props.eventDateKey)) + Number(hasLocation);

  return <article ref={motion} className="celebration-invitation" data-preview={props.preview || undefined} data-panel-style={panelStyle === "auto" ? undefined : panelStyle} data-event-type={eventType} data-photo={Boolean(props.backgroundImageUrl)} data-long-names={title.length > 25 || undefined} style={atmosphereStyle(props.accent, props)}>
    <div className="wa-backdrop" aria-hidden="true">
      {props.backgroundImageUrl && <div className="wa-backdrop-image"><Image src={props.backgroundImageUrl} alt="" fill sizes="100vw" unoptimized loading="eager" /></div>}
      <div className="wa-backdrop-shade" />
    </div>
    <div className="wa-column">
      <div className="wa-shell">
      <div className="wa-intro" data-surface={panelStyle === "auto" ? undefined : panelStyle}>
      <header className="wa-cover" data-surface={panelStyle === "auto" ? "blur" : panelStyle} data-has-media={Boolean(props.imageUrl)}>
        <div className="wa-cover-heading"><span className="wa-kicker">{props.name.trim() || content.defaultName}</span>
          <h1 aria-label={title}>{names.length === 2 ? <><span className="wa-couple-name">{names[0]}</span><span className="wa-ampersand" aria-hidden="true">&amp;</span><span className="wa-couple-name">{names[1]}</span></> : title}</h1>
          <p className="wa-date">{date}{time && <><span aria-hidden="true"> · </span>{time}</>}</p>
        </div>
        {props.imageUrl ? <div className="wa-portrait"><Image src={props.imageUrl} alt={`${copy.photoLabel}: ${title}`} width={900} height={1000} sizes="(max-width:600px) 94vw, 540px" preload unoptimized /></div>
          : <div className="wa-no-photo" aria-hidden="true"><span>{initials}</span><i>{copy.caption}</i></div>}
      </header>
      {props.eventDateKey && <section className="wa-panel wa-countdown" data-surface={panelStyle === "auto" ? "blur-color" : panelStyle} aria-label="Cuenta regresiva"><span className="wa-kicker">Cada vez más cerca</span><CountdownTimer date={props.eventDateKey} time={props.eventTime || "00:00"} /></section>}
      </div>
      <section className="wa-panel wa-welcome" data-surface={atmospherePanelStyle(undefined, 1 + Number(Boolean(props.eventDateKey)), panelStyle)} id="invitation-celebration">
        <h2>{copy.welcomeTitle}</h2>
        <p>{props.message.trim() || content.message}</p>
      </section>
      {hasLocation && <section className="wa-panel wa-location" data-surface={atmospherePanelStyle(undefined, 2 + Number(Boolean(props.eventDateKey)), panelStyle)} aria-labelledby="invitation-location-title">
        <FiMapPin className="wa-section-icon" aria-hidden="true" /><h2 id="invitation-location-title">La celebración</h2>
        <h3>{props.venue || "Nos vemos aquí"}</h3><p>{date}{time && ` · ${time}`}</p>{props.address && <p>{props.address}</p>}
        <a className="wa-button" href={invitationMapUrl(props.venue, props.address)} target="_blank" rel="noopener noreferrer">Cómo llegar<FiArrowUpRight aria-hidden="true" /></a>
      </section>}
      {sections.map((section, index) => <AtmosphereSection key={section.id} section={section} surface={atmospherePanelStyle(section, firstDetailIndex + index, panelStyle)} eventId={props.publicEventId} />)}
      </div>
      <footer className="wa-footer"><span className="wa-kicker">{copy.closingKicker}</span><strong>{title}</strong><p>{copy.closingMessage}</p><small>Cheetah Invite</small></footer>
    </div>
  </article>;
}

function AtmosphereSection({ section, eventId, surface }: { section: InviteSection; eventId?: string; surface: "blur" | "blur-color" | "color" }) {
  const Icon = sectionIcons[section.type];
  const sectionPhoto = section.type !== "gallery" ? section.imageUrl : "";
  const attachedImages = section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : [];
  const images = sectionPhoto ? attachedImages.filter(src => src !== sectionPhoto) : attachedImages;
  const photoPosition = section.type === "gallery" ? "after" : section.imagePosition ?? "after";
  const photo = sectionPhoto ? <figure className="wa-section-photo" data-photo-position={photoPosition}>
    <Image src={sectionPhoto} alt={`Foto que acompaña ${section.title}`} width={1200} height={800} sizes="(max-width:600px) calc(100vw - 24px), 560px" unoptimized />
  </figure> : null;
  const url = invitationSectionUrl(section.type, section.link);
  const media = (photo || images.length > 0) ? <div className="wa-section-media">
    {photo}
    {images.length > 0 && (section.type === "gallery" ? <InvitationPhotoCarousel images={images} title={section.title} /> : <div className="wa-photo-grid">{images.map((src, index) => <figure key={`${src}-${index}`}><Image src={src} alt={`${section.title} · fotografía ${index + 1}`} width={800} height={1000} sizes="(max-width:600px) 88vw, 500px" unoptimized /></figure>)}</div>)}
  </div> : null;
  return <div className="wa-section-row" data-section-type={section.type} data-has-media={Boolean(media)} data-photo-position={photoPosition}>
    {photoPosition === "before" && media}<section className={`wa-panel wa-section wa-${section.type}`} data-surface={surface} aria-label={section.title}>
    {section.type !== "gallery" && <Icon className="wa-section-icon" aria-hidden="true" />}<h2>{section.title}</h2>
    {section.detail && <p className="wa-detail">{section.detail}</p>}
    {section.type === "program" ? <ol className="wa-timeline">{section.content.split("\n").filter(line => line.trim()).map((line, index) => {
      const parts = line.split(/\s+[—–-]\s+/);
      const time = parts.length > 1 ? parts.shift() : "";
      return <li key={index}>{time && <span className="wa-timeline-time">{time}</span>}<span>{parts.join(" — ")}</span></li>;
    })}</ol> : section.content && <p>{section.content}</p>}
    {section.type === "rsvp" && section.rsvpMode === "integrated" ? <RsvpForm eventId={eventId} /> : url && <a className="wa-button" href={url} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)}<FiArrowUpRight aria-hidden="true" /></a>}
  </section>{photoPosition === "after" && media}</div>;
}
