import Image from "next/image";
import { FiArrowDown } from "react-icons/fi";

export function DecoFan() {
  return <svg className="deco-fan" viewBox="0 0 240 130" fill="none" aria-hidden="true">
    <path d="M120 120 14 85 27 51 53 25 86 10 120 4 154 10 187 25 213 51 226 85Z" />
    <path d="M120 120 27 51M120 120 53 25M120 120 86 10M120 120V4M120 120 154 10M120 120 187 25M120 120 213 51M14 85H226M27 51H213" />
    <path d="m100 120 20-27 20 27-20 7Z" />
  </svg>;
}

export function ArtDecoCover({ title, names, date, time }: { title: string; names: string[]; date: string; time: string }) {
  return <>
    <svg className="deco-cover-frame" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M24 88H88V24H912V88H976V912H912V976H88V912H24Z" />
      <path d="M38 102H102V38H898V102H962V898H898V962H102V898H38Z" />
      <path d="M0 56H56V0M944 0V56H1000M0 944H56V1000M944 1000V944H1000" />
    </svg>
    <div className="wedding-hero-copy deco-cover-copy">
      <DecoFan />
      <span className="wedding-eyebrow">EL COMIENZO DE NUESTRA HISTORIA</span>
      <h1 aria-label={title}>{names.length === 2 ? <><span>{names[0]}</span><i aria-hidden="true">&amp;</i><span>{names[1]}</span></> : <span>{title}</span>}</h1>
      <p className="deco-invitation-line">Nos casamos</p>
      <div className="deco-date"><span>{date}</span>{time && <span>{time}</span>}</div>
      <a className="wedding-button" href="#wedding-celebration">Acompáñanos <FiArrowDown aria-hidden="true" /></a>
      <span className="deco-cover-diamond" aria-hidden="true" />
    </div>
  </>;
}

export function ArtDecoPortrait({ src, title }: { src: string; title: string }) {
  return <div className="deco-portrait-wrap"><div className="deco-portrait"><Image src={src} alt={`La pareja: ${title}`} fill sizes="(max-width: 760px) 90vw, 75vw" unoptimized /></div><span aria-hidden="true">◆</span></div>;
}
