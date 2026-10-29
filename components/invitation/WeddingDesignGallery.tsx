"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { weddingDesigns } from "@/lib/wedding-designs";

export function WeddingDesignGallery() {
  const [id, setId] = useState(weddingDesigns[0].id);
  const design = weddingDesigns.find(d => d.id === id)!;
  const [accent, setAccent] = useState(design.palettes[0].accent);
  const [photo, setPhoto] = useState(true);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 720 });
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const width = device === "mobile" ? 390 : 1280;
  const scale = Math.min(1, size.width / width);
  const url = `/ejemplo-invitacion/boda-${design.kind}?paleta=${accent.slice(1)}${photo ? "" : "&foto=no"}`;
  return <main className="wedding-gallery-page">
    <header><Link href="/">Cheetah Invite</Link><Link href="/crear">Crear mi invitación ↗</Link></header>
    <div className="wedding-gallery-layout"><aside>
      <span className="wedding-gallery-eyebrow">LA COLECCIÓN DE BODAS</span><h1>Su historia.<br /><em>Su manera de contarla.</em></h1><p>Doce invitaciones, doce formas de celebrar. Encuentren la que se siente como ustedes.</p>
      <label htmlFor="gallery-design">Elige un diseño</label><select id="gallery-design" value={id} onChange={event => { const next = weddingDesigns.find(d => d.id === event.target.value)!; setId(next.id); setAccent(next.palettes[0].accent); }}>{weddingDesigns.map(d => <option value={d.id} key={d.id}>{d.label}</option>)}</select>
      <h2>{design.concept}</h2><p>{design.description}</p>
      <fieldset><legend>El color de su día</legend><div className="wedding-gallery-palettes">{design.palettes.map(palette => <button type="button" key={palette.accent} aria-pressed={accent === palette.accent} onClick={() => setAccent(palette.accent)} title={palette.label}><span style={{ background: palette.paper }} /><span style={{ background: palette.panel }} /><span style={{ background: palette.accent }} /><small>{palette.label}</small></button>)}</div></fieldset>
      <label className="wedding-gallery-photo"><input type="checkbox" checked={photo} onChange={e => setPhoto(e.target.checked)} /> Mostrar fotografía de la pareja</label>
      <a className="wedding-gallery-open" href={url} target="_blank" rel="noopener noreferrer">Abrir invitación completa ↗</a>
      <p className="wedding-gallery-note">Los nombres, fotografías y lugares son de ejemplo.</p>
    </aside><div className="wedding-gallery-preview"><div className="editor-live-preview"><div className="editor-preview-devices" role="group" aria-label="Dispositivo de vista previa"><button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Escritorio</button><button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>Móvil</button></div><div className="editor-preview-viewport" ref={viewport}><div className="editor-preview-frame-space" style={{ width: width * scale, height: size.height }}><iframe key={url} title={`Invitación completa: ${design.label}`} src={url} style={{ width, height: scale ? size.height / scale : 860, transform: `scale(${scale})` }} /></div></div></div></div></div>
  </main>;
}
