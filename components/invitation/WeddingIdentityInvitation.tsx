"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { FiArrowDown, FiArrowUpRight, FiCamera, FiClock, FiGift, FiHeart, FiMapPin, FiMusic, FiSun } from "react-icons/fi";
import type { InviteSection } from "@/lib/invitation-editor";
import { getWeddingDesign, orderedWeddingSections, weddingArtwork, weddingPalette, type WeddingDesign } from "@/lib/wedding-designs";
import { getInvitationFont } from "@/lib/invitation-fonts";
import { invitationMapUrl, invitationSectionUrl } from "@/lib/invitation-links";
import { useInvitationMotion } from "@/components/dashboard/useInvitationMotion";
import { LoveLetterCover, LoveLetterMemory, LoveLetterClosing } from "./LoveLetterCover";
import { ArtDecoCover, ArtDecoPortrait } from "./ArtDecoCover";
import { StarlightCover, StarlightPortrait } from "./StarlightCover";
import { WeddingCountdown, type WeddingInvitationProps } from "./WeddingInvitation";
import { RsvpForm } from "./RsvpForm";
import { WeddingCollectionInvitation } from "./WeddingCollectionInvitation";

type Artwork = ReturnType<typeof weddingArtwork>;
type CoverProps = { design: WeddingDesign; art: Artwork; title: string; names: string[]; date: string; time: string; imageUrl: string; venue: string };

const welcome: Record<WeddingDesign["kind"], [string, string]> = {
  floral: ["CON LA ALEGRÍA DE ENCONTRARNOS", "El amor se celebra.\nLos recuerdos florecen."],
  editorial: ["LA HISTORIA CONTINÚA", "Nuestro siguiente capítulo."],
  minimal: ["USTEDES, NOSOTROS Y ESTE DÍA", "Todo lo que importa."],
  garden: ["GUARDA UN LUGAR EN TU CALENDARIO", "Tenemos una cita\nentre flores."],
  blossom: ["UNA NUEVA PRIMAVERA", "Contigo,\ntodo florece."],
  bougainvillea: ["CON EL CORAZÓN Y LAS PUERTAS ABIERTAS", "Una fiesta.\nTodo nuestro amor."],
  sunlight: ["LA ALEGRÍA SE COMPARTE", "Un día de sol.\nUna vida juntos."],
  olive: ["CON LAS PERSONAS QUE MÁS QUEREMOS", "Un amor que crece.\nUn recuerdo que permanece."],
  mediterranean: ["UNA POSTAL PARA LAS PERSONAS QUE QUEREMOS", "El mejor destino\nes encontrarnos."],
  "art-deco": ["TIENES UN LUGAR EN NUESTRA HISTORIA", "Una noche\npara recordar."],
  "love-letter": ["ESTA CARTA TAMBIÉN ES PARA TI", "Hay historias\nque merecen compartirse."],
  starlight: ["DE TODAS LAS FORMAS DE ENCONTRARNOS", "Coincidir contigo.\nCelebrarlo con todos."],
};

export function WeddingIdentityInvitation(props: WeddingInvitationProps) {
  const kind = getWeddingDesign(props.templateId)!.kind;
  return kind === "olive" || kind === "love-letter" ? <PreservedWeddingIdentity {...props} /> : <WeddingCollectionInvitation {...props} />;
}

function PreservedWeddingIdentity(props: WeddingInvitationProps) {
  const motion = useInvitationMotion();
  const design = getWeddingDesign(props.templateId)!;
  const art = weddingArtwork(design);
  const palette = weddingPalette(design, props.accent);
  const title = props.hostNames.trim() || "Nuestra boda";
  const names = title.split(/\s+(?:y|&)\s+/i);
  const time = props.eventTime ? new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${props.eventTime}:00Z`)) : "";
  const date = props.eventDateKey ? props.date : "La fecha, muy pronto";
  const copy = welcome[design.kind];
  const sections = orderedWeddingSections(props.sections).filter(section => section.enabled && hasContent(section));
  const style = {
    "--w-accent": palette.accent, "--w-paper": palette.paper, "--w-panel": palette.panel,
    "--w-ink": palette.ink, "--w-muted": palette.muted, "--w-dark": palette.dark,
    "--w-heading": getInvitationFont(design.typography).family, "--w-body": getInvitationFont(design.bodyTypography).family,
    "--w-texture": art.texture ? `url("${art.texture}")` : "none",
    "--w-night-sky": design.celestial ? `url("${design.celestial.sky}")` : "none",
    "--w-nebula": design.celestial ? `url("${design.celestial.nebula}")` : "none",
    "--w-foil": design.foil ? `url("${design.foil}")` : "none",
    "--w-botanical": art.topLeft ? `url("${art.topLeft}")` : "none",
    "--w-botanical-end": art.bottomRight ? `url("${art.bottomRight}")` : "none",
  } as CSSProperties;

  return <article ref={motion} className="wedding-invitation wedding-identity" data-design={design.kind} data-long-names={title.length > 24 ? "true" : undefined} style={style}>
    <header className={`wedding-hero${props.imageUrl ? " has-photo" : ""}`}>
      <IdentityCover design={design} art={art} title={title} names={names} date={date} time={time} imageUrl={props.imageUrl} venue={props.venue} />
    </header>
    {design.kind === "love-letter" && props.imageUrl && <LoveLetterMemory src={props.imageUrl} title={title} butterfly={art.decoration} />}
    {design.kind === "art-deco" && props.imageUrl && <ArtDecoPortrait src={props.imageUrl} title={title} />}
    {design.kind === "starlight" && props.imageUrl && <StarlightPortrait src={props.imageUrl} title={title} />}
    <section id="wedding-celebration" className="wedding-welcome">
      <Motif design={design} art={art} />
      <span className="wedding-eyebrow">{copy[0]}</span>
      <h2>{copy[1]}</h2>
      <p>{props.message.trim() || "Hay momentos que se vuelven inolvidables cuando los compartimos. Nos encantará tenerte cerca para celebrar el comienzo de esta nueva etapa."}</p>
      {design.kind !== "editorial" && design.kind !== "minimal" && <Signature names={names} />}
    </section>
    {props.eventDateKey && ["garden", "minimal", "mediterranean"].includes(design.kind) && <WeddingCalendar dateKey={props.eventDateKey} />}
    {(props.venue || props.address) && <section className="wedding-section wedding-location">
      <div className="wedding-section-heading"><Motif design={design} art={art} small /><span className="wedding-eyebrow">{design.kind === "mediterranean" ? "EL DESTINO DE NUESTRA CELEBRACIÓN" : "AQUÍ COMIENZA EL RECUERDO"}</span><h2>La celebración</h2></div>
      <div className="wedding-section-body"><FiMapPin className="identity-location-pin" aria-hidden="true" /><h3>{props.venue || "Nos vemos aquí"}</h3>{props.eventDateKey && <p>{date}{time && ` · ${time}`}</p>}{props.address && <p>{props.address}</p>}<a className="wedding-button" href={invitationMapUrl(props.venue, props.address)} target="_blank" rel="noopener noreferrer">Cómo llegar <FiArrowUpRight aria-hidden="true" /></a></div>
    </section>}
    {sections.map((section, index) => <IdentitySection key={section.id} section={section} index={index} design={design} art={art} publicEventId={props.publicEventId} />)}
    {props.eventDateKey && <section className="wedding-finale"><Motif design={design} art={art} /><span className="wedding-eyebrow">{design.kind === "starlight" ? "CONTAMOS LAS LUNAS PARA ENCONTRARNOS" : "CADA VEZ FALTA MENOS"}</span><h2>{design.kind === "love-letter" ? "La próxima página,\nla escribimos juntos." : "Nuestro día\nestá por llegar."}</h2><WeddingCountdown date={props.eventDateKey} time={props.eventTime ?? ""} /><p>{date}</p></section>}
    <footer className="wedding-footer">
      {design.kind === "love-letter" && <LoveLetterClosing artwork={art} />}
      <Motif design={design} art={art} small />
      <span className="wedding-eyebrow">CON TODO NUESTRO AMOR</span><strong>{title}</strong><p>Gracias por ser parte de nuestra historia.</p><small>Hecho con cariño · Cheetah Invite</small>
    </footer>
  </article>;
}

function Couple({ title, names, separator = "&" }: { title: string; names: string[]; separator?: string }) {
  return <h1 aria-label={title}>{names.length === 2 ? <><span className="wedding-couple-name">{names[0]}</span><i className="wedding-couple-separator" aria-hidden="true">{separator}</i><span className="wedding-couple-name">{names[1]}</span></> : <span>{title}</span>}</h1>;
}

function Signature({ names }: { names: string[] }) {
  return <span className="identity-signature" aria-hidden="true">{names.slice(0, 2).map(name => name.trim()[0]).join(" & ")}</span>;
}

function Photo({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  return <div className={`wedding-hero-photo ${className}`}><Image src={src} alt={`La pareja: ${title}`} fill sizes="(max-width: 760px) 90vw, 50vw" unoptimized /></div>;
}

function CoverDetails({ date, time }: { date: string; time: string }) {
  return <div className="wedding-date"><span>{date}</span>{time && <span>{time}</span>}</div>;
}

function Discover({ children = "Descubre nuestro día" }: { children?: string }) {
  return <a className="wedding-button identity-discover" href="#wedding-celebration">{children} <FiArrowDown aria-hidden="true" /></a>;
}

function Corners({ art }: { art: Artwork }) {
  return <div className="identity-cover-botanicals" aria-hidden="true">{art.topLeft && <Image src={art.topLeft} alt="" width={300} height={340} unoptimized />}{art.bottomRight && <Image src={art.bottomRight} alt="" width={300} height={340} unoptimized />}</div>;
}

function IdentityCover(p: CoverProps) {
  const { design, art, title, names, date, time, imageUrl, venue } = p;
  if (design.kind === "love-letter") return <LoveLetterCover title={title} names={names} date={date} time={time} artwork={art} />;
  if (design.kind === "art-deco") return <ArtDecoCover title={title} names={names} date={date} time={time} />;
  if (design.kind === "starlight") return <StarlightCover title={title} names={names} date={date} time={time} moon={design.celestial!.moon} />;
  if (design.kind === "editorial") return <>
    <div className="identity-editorial-masthead"><span>EL AMOR, EN PRIMERA PERSONA</span><span>EDICIÓN ESPECIAL · NUESTRA BODA</span></div>
    <div className="wedding-hero-copy"><span className="wedding-eyebrow">UNA HISTORIA PARA SIEMPRE</span><Couple title={title} names={names} separator="y" /><p className="identity-editorial-caption">La vida juntos.<br /><em>El mejor de nuestros planes.</em></p><CoverDetails date={date} time={time} /><Discover>Abre este capítulo</Discover></div>
    {imageUrl ? <figure className="identity-editorial-visual"><Photo src={imageUrl} title={title} /><figcaption>Para siempre.</figcaption></figure> : <div className="identity-editorial-type" aria-hidden="true">Sí,<br /><em>para<br />siempre.</em></div>}
    <div className="identity-editorial-bottom"><span>{venue || "Un encuentro para recordar"}</span><span>CON USTEDES, EL MEJOR CAPÍTULO</span></div>
  </>;
  if (design.kind === "minimal") return <>
    <div className="wedding-hero-copy"><span className="identity-script-note">La alegría de elegirnos</span><span className="wedding-eyebrow">NUESTRA BODA</span><Couple title={title} names={names} /><HeartThread /><CoverDetails date={date} time={time} /></div>
    {imageUrl && <Photo src={imageUrl} title={title} />}<Discover>Estás invitado</Discover>
  </>;
  if (design.kind === "garden") return <>
    <Corners art={art} /><div className="identity-garden-card wedding-hero-copy"><span className="identity-card-index" aria-hidden="true">INVITACIÓN · 01</span><Motif design={design} art={art} /><span className="wedding-eyebrow">ENTRE FLORES Y PERSONAS QUERIDAS</span><Couple title={title} names={names} /><CoverDetails date={date} time={time} /><Discover>Reserva este día</Discover></div>
    {imageUrl && <figure className="identity-garden-memory"><Photo src={imageUrl} title={title} /><figcaption>Lo bonito de coincidir.</figcaption></figure>}
  </>;
  if (design.kind === "blossom") return <>
    <Corners art={art} /><div className="wedding-hero-copy"><span className="wedding-eyebrow">EL COMIENZO DE NUESTRA PRIMAVERA</span><Couple title={title} names={names} /><CoverDetails date={date} time={time} /></div>
    <div className="identity-blossom-scene">{imageUrl ? <Photo src={imageUrl} title={title} /> : <Signature names={names} />}{art.flower && <Image className="identity-blossom-flower" src={art.flower} alt="" width={150} height={150} unoptimized />}<span aria-hidden="true" className="identity-orbit" /></div><Discover>Celebra con nosotros</Discover>
  </>;
  if (design.kind === "bougainvillea") return <>
    <Corners art={art} /><figure className="identity-hacienda-album">{imageUrl ? <Photo src={imageUrl} title={title} /> : <Motif design={design} art={art} />}{art.flower && <Image className="identity-album-flower" src={art.flower} alt="" width={160} height={160} unoptimized />}<figcaption>Nuestro recuerdo favorito está por llegar.</figcaption></figure>
    <div className="wedding-hero-copy"><span className="wedding-eyebrow">CON LA ALEGRÍA DE NUESTRAS FAMILIAS</span><Couple title={title} names={names} /><p>Nos casamos.<br />Y la fiesta empieza contigo.</p><CoverDetails date={date} time={time} /><Discover>Bienvenido a nuestra boda</Discover></div>
  </>;
  if (design.kind === "sunlight") return <>
    <Corners art={art} /><div className="wedding-hero-copy"><span className="identity-sun" aria-hidden="true"><FiSun /></span><span className="wedding-eyebrow">UN DÍA PARA CELEBRAR LA VIDA JUNTOS</span><Couple title={title} names={names} /><CoverDetails date={date} time={time} /><Discover>Comparte nuestra alegría</Discover></div>
    {imageUrl && <figure className="identity-sunlight-print"><Photo src={imageUrl} title={title} /><figcaption>Los días más bonitos son contigo.</figcaption></figure>}
  </>;
  if (design.kind === "mediterranean") return <>
    <div className="identity-postcard-heading"><span>UNA POSTAL DE NUESTRO AMOR</span><Signature names={names} /></div>
    <div className="wedding-hero-copy"><span className="wedding-eyebrow">PRÓXIMO DESTINO: NUESTRO SÍ</span><Couple title={title} names={names} /><CoverDetails date={date} time={time} /></div>
    <div className="identity-postcard-scene"><span className="identity-ceramic" aria-hidden="true" />{imageUrl ? <Photo src={imageUrl} title={title} /> : <div className="identity-postcard-empty"><span>Una vida.<br /><em>Mil destinos.</em></span></div>}{art.flower && <Image src={art.flower} className="identity-postcard-lemons" alt="" width={220} height={246} unoptimized />}</div>
    <div className="identity-postcard-address"><span>PARA: NUESTRAS PERSONAS FAVORITAS</span><p>{venue || "El mejor destino es encontrarnos."}</p><Discover>Nos vemos aquí</Discover></div>
  </>;
  if (design.kind === "olive") return <>
    <Corners art={art} /><div className="wedding-hero-copy">{art.decoration && <Image className="wedding-olive-butterfly" src={art.decoration} alt="" width={72} height={49} unoptimized />}<span className="wedding-eyebrow">NOS CASAMOS</span><Couple title={title} names={names} /><p className="wedding-hero-intro">Y queremos compartir este día contigo.</p><CoverDetails date={date} time={time} /><Discover /></div>{imageUrl && <Photo src={imageUrl} title={title} />}
  </>;
  return <>
    <Corners art={art} /><div className="identity-floral-arch wedding-hero-copy"><span className="identity-script-note">El comienzo de nuestro siempre</span><span className="wedding-eyebrow">CON EL CORAZÓN LLENO DE ALEGRÍA</span><Couple title={title} names={names} /><CoverDetails date={date} time={time} /><Discover>El jardín de nuestro sí</Discover></div>{imageUrl && <figure className="identity-floral-portrait"><Photo src={imageUrl} title={title} />{art.flower && <Image className="identity-floral-bloom" src={art.flower} alt="" width={150} height={150} unoptimized />}<figcaption>Un día, una vida, juntos.</figcaption></figure>}
  </>;
}

function HeartThread() {
  return <svg className="identity-heart-thread" viewBox="0 0 400 55" fill="none" aria-hidden="true"><path d="M0 30C80 5 120 55 200 35C170 15 180 0 200 17C220 0 230 15 200 35C270 55 330 10 400 30" /></svg>;
}

function Motif({ design, art, small = false }: { design: WeddingDesign; art: Artwork; small?: boolean }) {
  if (design.kind === "art-deco" || design.kind === "editorial") return null;
  return <span className={`identity-motif${small ? " is-small" : ""}`} aria-hidden="true">{design.kind === "starlight" ? <span className="identity-star-mark">✧</span> : design.kind === "minimal" ? <HeartThread /> : art.flower ? <Image src={art.flower} alt="" width={110} height={110} unoptimized /> : <FiHeart />}</span>;
}

function WeddingCalendar({ dateKey }: { dateKey: string }) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  const blanks = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return <section className="identity-calendar" aria-label={`Reserva la fecha: ${date.toLocaleDateString("es-MX", { dateStyle: "long", timeZone: "UTC" })}`}><span className="wedding-eyebrow">UN DÍA QUE LO CAMBIA TODO</span><h2>{date.toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" })}</h2><div className="identity-calendar-grid" aria-hidden="true">{["L", "M", "M", "J", "V", "S", "D"].map((day, i) => <b key={`day-${i}`}>{day}</b>)}{Array.from({ length: blanks }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => <span key={i} className={i + 1 === date.getUTCDate() ? "is-wedding-day" : undefined}>{i + 1}</span>)}</div><FiHeart aria-hidden="true" /></section>;
}

function hasContent(s: InviteSection) {
  return s.content.trim() || s.detail.trim() || invitationSectionUrl(s.type, s.link) || s.imageUrl || s.imageUrls?.length || (s.type === "rsvp" && s.rsvpMode === "integrated");
}

const sectionEyebrows: Partial<Record<InviteSection["type"], string>> = { story: "ASÍ EMPEZÓ TODO", ceremony: "EL SÍ MÁS ESPECIAL", reception: "UN BRINDIS POR NOSOTROS", program: "LOS MOMENTOS DE NUESTRO DÍA", parents: "NUESTRAS RAÍCES", dress_code: "PARA CELEBRAR JUNTOS", gifts: "EL MEJOR REGALO ES TENERTE", gallery: "PEDACITOS DE NUESTRA HISTORIA", rsvp: "TE GUARDAMOS UN LUGAR" };

function IdentitySection({ section: s, index, design, art, publicEventId }: { section: InviteSection; index: number; design: WeddingDesign; art: Artwork; publicEventId?: string }) {
  const images = s.imageUrls?.length ? s.imageUrls : s.imageUrl ? [s.imageUrl] : [];
  const url = invitationSectionUrl(s.type, s.link);
  return <section id={`wedding-${s.type}`} className={`wedding-section wedding-${s.type}`}>
    <div className="wedding-section-heading">{["garden", "love-letter"].includes(design.kind) && <span className="identity-chapter-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}{["parents", "gifts", "dress_code", "rsvp"].includes(s.type) && <Motif design={design} art={art} small />}<span className="wedding-eyebrow">{sectionEyebrows[s.type]}</span><h2>{s.title}</h2></div>
    <div className="wedding-section-body">
      {s.detail && <p className="wedding-detail">{s.detail}</p>}
      {s.type === "program" ? <ol className="wedding-timeline">{s.content.split("\n").filter(line => line.trim()).map((line, i) => {
        const parts = line.split(/\s+[—–-]\s+/), time = parts.length > 1 ? parts.shift()! : String(i + 1).padStart(2, "0"), label = parts.join(" — ");
        const Icon = /foto/i.test(label) ? FiCamera : /baile|fiesta|música/i.test(label) ? FiMusic : /ceremonia|votos/i.test(label) ? FiHeart : /regalo/i.test(label) ? FiGift : FiClock;
        return <li key={i}><span className="identity-timeline-icon"><Icon aria-hidden="true" /></span><time>{time}</time><p>{label}</p></li>;
      })}</ol> : s.content && <p>{s.content}</p>}
      {images.length > 0 && <div className="wedding-gallery">{images.map((src, i) => <a href={src} key={`${src}-${i}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir fotografía ${i + 1} de ${s.title}`}><Image src={src} alt={`${s.title} · fotografía ${i + 1}`} width={800} height={1000} sizes="(max-width: 760px) 90vw, 40vw" unoptimized /></a>)}</div>}
      {s.type === "rsvp" && s.rsvpMode === "integrated" ? <RsvpForm eventId={publicEventId} /> : url && <a className="wedding-button" href={url} target="_blank" rel="noopener noreferrer">{s.type === "rsvp" ? "Confirmar asistencia" : s.type === "gifts" ? "Ver mesa de regalos" : "Ver ubicación"}<FiArrowUpRight aria-hidden="true" /></a>}
    </div>
  </section>;
}
