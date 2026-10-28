import Image from "next/image";
import { FiArrowDown } from "react-icons/fi";

// Decorative constellations; these are not a map of the sky on the event date.
const stars = [[92,206],[146,169],[200,218],[178,284],[113,320],[367,342],[414,299],[471,339],[449,407],[384,439],[320,489],[252,457],[209,490],[137,416],[456,191],[414,139],[349,82],[264,101]];

export function CelestialChart({ moon }: { moon: string }) {
  return <svg className="starlight-chart" viewBox="0 0 600 600" fill="none" aria-hidden="true">
    <circle cx="300" cy="300" r="260" className="starlight-orbit-outer" />
    <circle cx="300" cy="300" r="224" className="starlight-orbit-inner" />
    <path className="starlight-constellations" d="m92 206 54-37 54 49-22 66-65 36m254 22 47-43 57 40-22 68-65 32m-64 50-68-32-43 33m247-299-42-52-65-57-85 19" />
    {stars.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?3.5:2} className="starlight-star" />)}
    <image className="starlight-moon-photo" href={moon} x="240" y="124" width="230" height="233" preserveAspectRatio="xMidYMid meet" />
    <path className="starlight-sparkle" d="m300 27 4 9-4 9-4-9Zm273 273-9 4-9-4 9-4ZM300 573l-4-9 4-9 4 9ZM27 300l9-4 9 4-9 4Zm192-163 3 10 10 3-10 3-3 10-3-10-10-3 10-3Zm155 351 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z" />
    <path className="starlight-axis" d="M300 50v12m0 476v12M50 300h12m476 0h12" />
  </svg>;
}

export function StarlightCover({ title, names, date, time, moon }: { title: string; names: string[]; date: string; time: string; moon: string }) {
  return <>
    <div className="starlight-masthead"><span>NOS CASAMOS</span><span aria-hidden="true">✦</span><span>BAJO LAS ESTRELLAS</span></div>
    <div className="wedding-hero-copy starlight-cover-copy">
      <span className="wedding-eyebrow">BAJO EL MISMO CIELO</span>
      <h1 aria-label={title}>{names.length===2 ? <><span>{names[0]}</span><i aria-hidden="true">&amp;</i><span>{names[1]}</span></> : <span>{title}</span>}</h1>
      <p>Entre todas las estrellas,<br />nos encontramos.</p>
      <div className="starlight-cover-date"><span>{date}</span>{time && <span>{time}</span>}</div>
      <a className="wedding-button" href="#wedding-celebration">Comparte nuestra noche <FiArrowDown aria-hidden="true" /></a>
    </div>
    <div className="starlight-celestial-scene"><CelestialChart moon={moon} /></div>
    <span className="starlight-cover-footnote" aria-hidden="true">UN ENCUENTRO · UN COMIENZO · NUESTRO SIEMPRE</span>
  </>;
}

export function StarlightPortrait({ src, title }: { src: string; title: string }) {
  return <div className="starlight-portrait-section">
    <div className="starlight-portrait"><Image src={src} alt={`La pareja: ${title}`} fill sizes="(max-width: 760px) 90vw, 60vw" unoptimized /></div>
    <div className="starlight-portrait-note"><span aria-hidden="true">✧</span><p>Lo mejor<br />de esta historia<br /><em>es compartirla.</em></p></div>
  </div>;
}
