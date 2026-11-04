"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { FiArrowDown, FiArrowUpRight, FiMapPin } from "react-icons/fi";
import type { InviteSection } from "@/lib/invitation-editor";
import { getWeddingDesign, orderedWeddingSections, weddingArtwork, weddingPalette } from "@/lib/wedding-designs";
import { getInvitationFont } from "@/lib/invitation-fonts";
import { invitationMapUrl, invitationSectionUrl } from "@/lib/invitation-links";
import { useInvitationMotion } from "@/components/dashboard/useInvitationMotion";
import { RsvpForm } from "./RsvpForm";
import { StarlightCover, StarlightPortrait } from "./StarlightCover";
import { ArtDecoCover, ArtDecoPortrait } from "./ArtDecoCover";
import { LoveLetterCover, LoveLetterMemory, LoveLetterClosing } from "./LoveLetterCover";
import { WeddingAtmosphereInvitation } from "./WeddingAtmosphereInvitation";

export type WeddingInvitationProps = {
  templateId: string; accent: string; name: string; hostNames: string; date: string; eventDateKey?: string;
  eventTime?: string; venue: string; address: string; message: string; imageUrl: string; backgroundImageUrl?: string;
  sections: InviteSection[]; publicEventId?: string;
};

export function WeddingInvitation(props: WeddingInvitationProps) {
  return getWeddingDesign(props.templateId)?.edition === 2 ? <WeddingAtmosphereInvitation {...props} /> : <LegacyWeddingInvitation {...props} />;
}

function LegacyWeddingInvitation({ templateId, accent, name, hostNames, date, eventDateKey = "", eventTime = "", venue, address, message, imageUrl, sections, publicEventId }: WeddingInvitationProps) {
  const motion = useInvitationMotion();
  const design = getWeddingDesign(templateId)!;
  const artwork = weddingArtwork(design);
  const botanical = Boolean(design.artwork && design.kind !== "floral" && design.kind !== "love-letter");
  const palette = weddingPalette(design, accent);
  const title = hostNames.trim() || "Nuestra boda";
  const names = title.split(/\s+(?:y|&)\s+/i);
  const ordered = orderedWeddingSections(sections).filter(section => section.enabled);
  const story = ordered.find(section => section.type === "story");
  const remaining = ordered.filter(section => section.type !== "story");
  const time = eventTime ? new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${eventTime}:00Z`)) : "";
  const style = {
    "--w-accent": palette.accent, "--w-paper": palette.paper, "--w-panel": palette.panel,
    "--w-ink": palette.ink, "--w-muted": palette.muted, "--w-dark": palette.dark,
    "--w-heading": getInvitationFont(design.typography).family, "--w-body": getInvitationFont(design.bodyTypography).family,
    "--w-texture": artwork.texture ? `url("${artwork.texture}")` : "none",
    "--w-night-sky": design.celestial ? `url("${design.celestial.sky}")` : "none",
    "--w-nebula": design.celestial ? `url("${design.celestial.nebula}")` : "none",
    "--w-foil": design.foil ? `url("${design.foil}")` : "none",
  } as CSSProperties;

  return <article ref={motion} className="wedding-invitation" data-design={design.kind} data-artwork={design.artwork} data-paper-texture={design.texture ? "true" : undefined} data-long-names={title.length > 24 ? "true" : undefined} style={style}>
    <header className={`wedding-hero${imageUrl ? " has-photo" : ""}`}>
      {design.kind === "starlight" ? <StarlightCover moon={design.celestial!.moon} title={title} names={names} date={eventDateKey ? date : "La fecha, muy pronto"} time={time} /> : design.kind === "love-letter" ? <LoveLetterCover title={title} names={names} date={eventDateKey ? date : "La fecha, muy pronto"} time={time} artwork={artwork} /> : design.kind === "art-deco" ? <ArtDecoCover title={title} names={names} date={eventDateKey ? date : "La fecha, muy pronto"} time={time} /> : design.kind === "mediterranean" ? <MediterraneanCover title={title} names={names} date={eventDateKey ? date : "La fecha, muy pronto"} time={time} imageUrl={imageUrl} lemons={artwork.flower} /> : <>
      {design.artwork && <FloralCorners artwork={artwork} />}
      <div className="wedding-hero-copy">
        {design.kind === "olive" && artwork.decoration && <Image className="wedding-olive-butterfly" src={artwork.decoration} alt="" width={72} height={49} unoptimized />}
        <span className="wedding-eyebrow">{design.kind === "editorial" ? "UNA HISTORIA PARA SIEMPRE" : "NOS CASAMOS"}</span>
        {design.kind === "minimal" && <span className="wedding-monogram" aria-hidden="true">{title.split(/\s+(?:y|&)\s+/i).map(part => part.trim()[0]).slice(0, 2).join(" · ")}</span>}
        <h1 aria-label={title}>{names.length === 2 ? <><span className="wedding-couple-name">{names[0]}</span><span className="wedding-couple-separator" aria-hidden="true">&amp;</span><span className="wedding-couple-name">{names[1]}</span></> : title}</h1>
        <p className="wedding-hero-intro">Y queremos compartir este día contigo.</p>
        <div className="wedding-date"><span>{eventDateKey ? date : "La fecha, muy pronto"}</span>{time && <span>{time}</span>}</div>
        <a className="wedding-button" href="#wedding-celebration">Descubre nuestro día <FiArrowDown aria-hidden="true" /></a>
      </div>
      {imageUrl && <div className="wedding-hero-photo"><Image src={imageUrl} alt={hostNames ? `La pareja: ${hostNames}` : "Fotografía de la pareja"} fill sizes="(max-width: 760px) 100vw, 55vw" priority unoptimized /></div>}
      {design.kind === "editorial" && <span className="wedding-edition">{name || "Nuestra boda"} <span>UNA NUEVA ETAPA</span></span>}
      {!imageUrl && design.kind === "editorial" && <span className="wedding-type-art" aria-hidden="true">Sí,<br /><i>para siempre.</i></span>}
      </>}
    </header>
    {design.kind === "art-deco" && imageUrl && <ArtDecoPortrait src={imageUrl} title={title} />}

    {design.kind === "love-letter" && imageUrl && <LoveLetterMemory src={imageUrl} title={title} butterfly={artwork.decoration} />}
    {design.kind === "starlight" && imageUrl && <StarlightPortrait src={imageUrl} title={title} />}
    <section id="wedding-celebration" className="wedding-welcome">
      {design.kind === "love-letter" && artwork.decoration && <Image className="love-welcome-butterfly" src={artwork.decoration} alt="" width={64} height={64} unoptimized />}
      {botanical && artwork.flower && <Image className="wedding-welcome-flower" src={artwork.flower} alt="" width={100} height={100} unoptimized />}
      <span className="wedding-eyebrow">CON LAS PERSONAS QUE MÁS QUEREMOS</span>
      <h2>Un día nuestro.<br /><em>Un recuerdo de todos.</em></h2>
      <p>{message.trim() || "Hay momentos que se vuelven inolvidables cuando los compartimos. Nos encantará tenerte cerca para celebrar el comienzo de esta nueva etapa."}</p>
      <span className="wedding-small-ornament" aria-hidden="true">✳</span>
    </section>
    {story && <WeddingSection section={story} />}
    {(venue || address) && <section className="wedding-location wedding-section">
      <div className="wedding-section-heading"><span className="wedding-eyebrow">EL LUGAR DE NUESTRO ENCUENTRO</span><h2>La celebración</h2></div>
      <div className="wedding-section-body"><h3>{venue || "Nos vemos aquí"}</h3>{eventDateKey && <p>{date}{time ? ` · ${time}` : ""}</p>}{address && <p>{address}</p>}<a className="wedding-button" href={invitationMapUrl(venue, address)} target="_blank" rel="noopener noreferrer"><FiMapPin aria-hidden="true" /> Cómo llegar</a></div>
    </section>}
    {remaining.map(section => <WeddingSection key={section.id} section={section} publicEventId={publicEventId} ornament={botanical && ["ceremony", "parents", "gifts"].includes(section.type) ? artwork.decoration : undefined} />)}
    {eventDateKey && <section className="wedding-finale"><span className="wedding-eyebrow">CADA VEZ FALTA MENOS</span><h2>El comienzo de<br /><em>nuestro siempre.</em></h2><WeddingCountdown date={eventDateKey} time={eventTime} /><p>{date}</p></section>}
    <footer className="wedding-footer">{design.kind === "love-letter" && <LoveLetterClosing artwork={artwork} />}{design.kind === "mediterranean" && artwork.flower && <Image className="wedding-mediterranean-footer-lemons" src={artwork.flower} alt="" width={100} height={112} unoptimized />}<span className="wedding-eyebrow">GRACIAS POR SER PARTE DE NUESTRA HISTORIA</span><strong>{title}</strong><small>Hecho con cariño · Cheetah Invite</small></footer>
  </article>;
}

function MediterraneanCover({ title, names, date, time, imageUrl, lemons }: { title: string; names: string[]; date: string; time: string; imageUrl: string; lemons?: string }) {
  return <>
    <div className="mediterranean-masthead"><span>NOS CASAMOS</span><span>UN DÍA PARA RECORDAR</span></div>
    <div className="wedding-hero-copy mediterranean-cover-copy">
      <h1 aria-label={title}>{names.length === 2 ? <><span>{names[0]}</span><i aria-hidden="true">&amp;</i><span>{names[1]}</span></> : <span>{title}</span>}</h1>
      <div className="mediterranean-cover-details"><p>La alegría de encontrarnos.<br />El comienzo de nuestro siempre.</p><div className="wedding-date"><span>{date}</span>{time && <span>{time}</span>}</div></div>
    </div>
    <div className={`mediterranean-scene${imageUrl ? "" : " is-illustrated"}`}>
      <span className="mediterranean-tile-piece" aria-hidden="true" />
      {imageUrl && <div className="wedding-hero-photo"><Image src={imageUrl} alt={`La pareja: ${title}`} fill sizes="(max-width: 760px) 100vw, 85vw" priority unoptimized /></div>}
      {lemons && <Image className="mediterranean-cover-lemons" src={lemons} alt="" width={220} height={246} unoptimized />}
    </div>
    <a className="wedding-button mediterranean-discover" href="#wedding-celebration">Celebremos juntos <FiArrowDown aria-hidden="true" /></a>
  </>;
}

function FloralCorners({ artwork }: { artwork: ReturnType<typeof weddingArtwork> }) {
  return <div className="wedding-floral-corners" aria-hidden="true">{artwork.topLeft && <Image src={artwork.topLeft} alt="" width={300} height={340} unoptimized />}{artwork.bottomRight && <Image src={artwork.bottomRight} alt="" width={300} height={340} unoptimized />}</div>;
}

function WeddingSection({ section, publicEventId, ornament }: { section: InviteSection; publicEventId?: string; ornament?: string }) {
  const url = invitationSectionUrl(section.type, section.link);
  const images = section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : [];
  if (!(section.content.trim() || section.detail.trim() || url || images.length || (section.type === "rsvp" && section.rsvpMode === "integrated"))) return null;
  return <section className={`wedding-section wedding-${section.type}`}>
    <div className="wedding-section-heading">{ornament && <Image className="wedding-section-ornament" src={ornament} alt="" width={70} height={70} unoptimized />}<span className="wedding-eyebrow">{({ story: "CÓMO EMPEZÓ TODO", ceremony: "EL SÍ MÁS ESPECIAL", reception: "UN BRINDIS POR EL AMOR", program: "ASÍ VIVIREMOS EL DÍA", parents: "CON TODO NUESTRO CARIÑO", gifts: "UN DETALLE CON AMOR", rsvp: "NOS HARÁ FELICES VERTE", gallery: "MOMENTOS QUE NOS TRAJERON HASTA AQUÍ", dress_code: "PARA DISFRUTAR JUNTOS" } as Record<string, string>)[section.type]}</span><h2>{section.title}</h2></div>
    <div className="wedding-section-body">
      {section.detail && <p className="wedding-detail">{section.detail}</p>}
      {section.type === "program" ? <ol className="wedding-timeline">{section.content.split("\n").filter(line => line.trim()).map((line, index) => {
        const parts = line.split(/\s+[—–-]\s+/);
        return <li key={index}><span>{parts.length > 1 ? parts.shift() : String(index + 1).padStart(2, "0")}</span><p>{parts.join(" — ")}</p></li>;
      })}</ol> : section.content && <p>{section.content}</p>}
      {images.length > 0 && <div className="wedding-gallery">{images.map((src, index) => <a href={src} target="_blank" rel="noopener noreferrer" key={`${src}-${index}`} aria-label={`Abrir fotografía ${index + 1} completa`}><Image src={src} alt={`${section.title} · fotografía ${index + 1}`} width={800} height={1000} sizes="(max-width: 760px) 90vw, 40vw" unoptimized /></a>)}</div>}
      {section.type === "rsvp" && section.rsvpMode === "integrated" ? <RsvpForm eventId={publicEventId} /> : url && <a className="wedding-button" href={url} target="_blank" rel="noopener noreferrer">{section.type === "rsvp" ? "Confirmar asistencia" : section.type === "gifts" ? "Ver mesa de regalos" : "Ver ubicación"}<FiArrowUpRight aria-hidden="true" /></a>}
    </div>
  </section>;
}

export function WeddingCountdown({ date, time }: { date: string; time: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    // Wedding dates belong to the event's Mexico City timezone, regardless of the guest's device.
    const target = Date.parse(`${date}T${time || "00:00"}:00-06:00`);
    const tick = () => setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [date, time]);
  if (remaining === null) return <p>Contamos los días para celebrar contigo.</p>;
  if (!remaining) return <p>¡Llegó nuestro gran día!</p>;
  return <div className="wedding-countdown" aria-label="Tiempo para la boda">{[[Math.floor(remaining / 86400), "días"], [Math.floor(remaining / 3600) % 24, "horas"], [Math.floor(remaining / 60) % 60, "minutos"]].map(([value, label]) => <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}</div>;
}
