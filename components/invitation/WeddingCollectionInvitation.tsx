"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { FiArrowUpRight, FiCamera, FiClock, FiGift, FiHeart, FiMapPin, FiMusic } from "react-icons/fi";
import type { InviteSection } from "@/lib/invitation-editor";
import { getInvitationFont } from "@/lib/invitation-fonts";
import { invitationMapUrl, invitationSectionUrl } from "@/lib/invitation-links";
import { getWeddingDesign, orderedWeddingSections, weddingArtwork, weddingPalette, type WeddingDesign } from "@/lib/wedding-designs";
import { CollectionCover } from "./CollectionCover";
import { WeddingCountdown, type WeddingInvitationProps } from "./WeddingInvitation";
import { RsvpForm } from "./RsvpForm";

const opening: Partial<Record<WeddingDesign["kind"], [string, string]>> = {
  floral: ["CON NUESTRAS PERSONAS FAVORITAS", "El amor florece.\nLos recuerdos se quedan."],
  editorial: ["EL MEJOR CAPÍTULO ESTÁ POR ESCRIBIRSE", "La vida,\ncontigo."],
  minimal: ["EL ARTE DE ELEGIRNOS", "Lo extraordinario\nestá en lo nuestro."],
  garden: ["UNA INVITACIÓN A NUESTRO JARDÍN", "Entre flores,\ncomienza el siempre."],
  blossom: ["EL TIEMPO DE FLORECER", "Un encuentro.\nTodas las primaveras."],
  bougainvillea: ["ABRIMOS LAS PUERTAS A NUESTRO SIEMPRE", "La alegría\nde estar juntos."],
  sunlight: ["COMO LOS DÍAS QUE NO QUEREMOS QUE TERMINEN", "Todo es más bonito\ncuando lo compartimos."],
  mediterranean: ["PARA NUESTRAS PERSONAS FAVORITAS", "Nuestro destino\nes encontrarnos."],
  "art-deco": ["UNA INVITACIÓN EXTRAORDINARIA", "Una noche.\nToda una vida."],
  starlight: ["EL UNIVERSO NOS TRAJO HASTA AQUÍ", "De todas las estrellas,\nelegimos coincidir."],
};

const eyebrows: Partial<Record<InviteSection["type"], string>> = {
  story: "TODO EMPEZÓ CON UN ENCUENTRO", ceremony: "EL MOMENTO DE DECIR SÍ", reception: "CELEBREMOS EL COMIENZO",
  program: "LOS MOMENTOS DE NUESTRO DÍA", parents: "QUIENES NOS ENSEÑARON A AMAR", dress_code: "EL DETALLE TAMBIÉN ES PARTE DE LA FIESTA",
  gifts: "EL MEJOR REGALO ES TENERTE", gallery: "FRAGMENTOS DE UNA VIDA JUNTOS", rsvp: "TENEMOS UN LUGAR PARA TI",
};

export function WeddingCollectionInvitation(props: WeddingInvitationProps) {
  const design = getWeddingDesign(props.templateId)!;
  const palette = weddingPalette(design, props.accent);
  const originalArt = weddingArtwork(design);
  // Use the owner's template illustrations directly, including their latest PNG edits.
  const art = originalArt;
  const title = props.hostNames.trim() || "Nuestra boda";
  const names = title.split(/\s+(?:y|&)\s+/i);
  const time = props.eventTime ? new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(`2000-01-01T${props.eventTime}:00Z`)) : "";
  const date = props.eventDateKey ? props.date : "La fecha, muy pronto";
  const copy = opening[design.kind]!;
  const sections = orderedWeddingSections(props.sections).filter(s => s.enabled && hasContent(s));
  const style = {
    "--wc-paper": palette.paper, "--wc-panel": palette.panel, "--wc-accent": palette.accent,
    "--wc-ink": palette.ink, "--wc-muted": palette.muted, "--wc-dark": palette.dark,
    "--wc-heading": getInvitationFont(design.typography).family, "--wc-body": getInvitationFont(design.bodyTypography).family,
    "--wc-botanical": art.topLeft ? `url("${art.topLeft}")` : "none",
    "--wc-flower": art.flower ? `url("${art.flower}")` : "none",
    "--wc-stock": originalArt.texture ? `url("${originalArt.texture}")` : "url('/textures/wedding/cotton.webp')",
  } as CSSProperties;
  const root = useCollectionReveal();
  return <article className="wedding-collection" data-design={design.kind} data-long-names={title.length > 25 ? "true" : undefined} style={style} ref={root}>
    <CollectionCover kind={design.kind} title={title} names={names} date={date} time={time} venue={props.venue} imageUrl={props.imageUrl} art={art} />
    <section className="wc-welcome" id="wedding-celebration"><span className="wc-kicker">{copy[0]}</span><h2>{copy[1]}</h2><p>{props.message.trim() || "Hay momentos que se vuelven inolvidables cuando los compartimos. Nos encantará tenerte cerca para celebrar el comienzo de esta nueva etapa."}</p><span className="wc-welcome-flourish" aria-hidden="true" /></section>
    {props.eventDateKey && ["minimal", "garden", "mediterranean"].includes(design.kind) && <CollectionCalendar dateKey={props.eventDateKey} />}
    {(props.venue || props.address) && <section className="wc-section wc-location" id="wedding-location"><SectionHeading kicker={design.kind === "mediterranean" ? "EL DESTINO DE NUESTRA CELEBRACIÓN" : "AQUÍ COMIENZA NUESTRO SIEMPRE"} title="La celebración" /><div className="wc-section-content"><FiMapPin className="wc-location-mark" aria-hidden="true" /><h3>{props.venue || "Nos vemos aquí"}</h3>{props.eventDateKey && <p>{date}{time && ` · ${time}`}</p>}{props.address && <p>{props.address}</p>}<a className="wc-button" href={invitationMapUrl(props.venue, props.address)} target="_blank" rel="noopener noreferrer">Cómo llegar <FiArrowUpRight aria-hidden="true" /></a></div></section>}
    {sections.map(section => <CollectionSection key={section.id} section={section} publicEventId={props.publicEventId} />)}
    {props.eventDateKey && <section className="wc-finale"><span className="wc-kicker">CADA DÍA MÁS CERCA DE ENCONTRARNOS</span><h2>{design.kind === "starlight" ? "Una noche bajo\nel mismo cielo." : "Lo mejor\nestá por venir."}</h2><WeddingCountdown date={props.eventDateKey} time={props.eventTime ?? ""} /><p>{date}</p></section>}
    <footer className="wc-footer"><span className="wc-footer-art" aria-hidden="true" /><span className="wc-kicker">CON TODO NUESTRO AMOR</span><strong>{title}</strong><p>Gracias por ser parte de nuestra historia.</p><small>Hecho con cariño · Cheetah Invite</small></footer>
  </article>;
}

function SectionHeading({ kicker, title }: { kicker?: string; title: string }) {
  return <div className="wc-section-heading">{kicker && <span className="wc-kicker">{kicker}</span>}<h2>{title}</h2><span className="wc-section-flourish" aria-hidden="true" /></div>;
}

function hasContent(s: InviteSection) {
  return s.content.trim() || s.detail.trim() || invitationSectionUrl(s.type, s.link) || s.imageUrl || s.imageUrls?.length || (s.type === "rsvp" && s.rsvpMode === "integrated");
}

function CollectionSection({ section: s, publicEventId }: { section: InviteSection; publicEventId?: string }) {
  const images = s.imageUrls?.length ? s.imageUrls : s.imageUrl ? [s.imageUrl] : [];
  const url = invitationSectionUrl(s.type, s.link);
  return <section className={`wc-section wc-${s.type}`} id={`wedding-${s.type}`}><SectionHeading kicker={eyebrows[s.type]} title={s.title} /><div className="wc-section-content">
    {s.detail && <p className="wc-detail">{s.detail}</p>}
    {s.type === "program" ? <ol className="wc-timeline">{s.content.split("\n").filter(line => line.trim()).map((line, index) => {
      const parts = line.split(/\s+[—–-]\s+/);
      const time = parts.length > 1 ? parts.shift()! : "";
      const label = parts.join(" — ");
      const Icon = /foto/i.test(label) ? FiCamera : /baile|fiesta|música/i.test(label) ? FiMusic : /ceremonia|votos/i.test(label) ? FiHeart : /regalo/i.test(label) ? FiGift : FiClock;
      return <li key={index} data-without-time={!time || undefined}><span className="wc-timeline-symbol"><Icon aria-hidden="true" /></span>{time && <time>{time}</time>}<p>{label}</p></li>;
    })}</ol> : s.content && <p>{s.content}</p>}
    {images.length > 0 && <div className="wc-gallery-grid">{images.map((src, i) => <a key={`${src}-${i}`} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Abrir fotografía ${i + 1} de ${s.title}`}><Image src={src} alt={`${s.title} · fotografía ${i + 1}`} width={800} height={1000} sizes="(max-width:760px) 90vw, 45vw" unoptimized /></a>)}</div>}
    {s.type === "rsvp" && s.rsvpMode === "integrated" ? <RsvpForm eventId={publicEventId} /> : url && <a className="wc-button" href={url} target="_blank" rel="noopener noreferrer">{s.type === "rsvp" ? "Confirmar asistencia" : s.type === "gifts" ? "Ver mesa de regalos" : "Ver ubicación"}<FiArrowUpRight aria-hidden="true" /></a>}
  </div></section>;
}

function CollectionCalendar({ dateKey }: { dateKey: string }) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  const blanks = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return <section className="wc-calendar" aria-label={`Reserva la fecha: ${date.toLocaleDateString("es-MX", { dateStyle: "long", timeZone: "UTC" })}`}><span className="wc-kicker">UN DÍA QUE LO CAMBIA TODO</span><h2>{date.toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" })}</h2><div className="wc-calendar-grid" aria-hidden="true">{["L", "M", "M", "J", "V", "S", "D"].map((day, i) => <b key={`day-${i}`}>{day}</b>)}{Array.from({ length: blanks }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => <span key={i} className={i + 1 === date.getUTCDate() ? "is-wedding-day" : undefined}>{i + 1}</span>)}</div><FiHeart aria-hidden="true" /></section>;
}

function useCollectionReveal() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const view = root.current?.ownerDocument.defaultView;
    if (!root.current || !view?.IntersectionObserver || view.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new view.IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        entry.target.animate?.([{ opacity: .3, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 700, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    }, { rootMargin: "0px 0px -24px 0px", threshold: .05 });
    root.current.querySelectorAll(".wc-section-heading,.wc-welcome h2,.wc-gallery-grid a,.wc-timeline li").forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return root;
}
