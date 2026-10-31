"use client";

import Image from 'next/image';
import { useRef, useState, type CSSProperties } from 'react';

// Keep controls consistent with each invitation palette.
export const galleryThemes = {
  confetti: { paper: '#fffaf0', ink: '#354f50', border: '#bdd0c5', action: '#387d81' },
  pastel: { paper: '#fcf6eb', ink: '#4f5c63', border: '#c9d7de', action: '#526f87' },
  neon: { paper: '#100a1d', ink: '#f7f3ff', border: '#88519e', action: '#f46bde' },
  disco: { paper: '#f3f0f6', ink: '#282633', border: '#c6bad8', action: '#7154a1' },
  dinosaur: { paper: '#f7f3e7', ink: '#203e30', border: '#b8c7a2', action: '#c46a32' },
  gamer: { paper: '#faf6ed', ink: '#29213d', border: '#b6a2d0', action: '#7450cc' },
  cowboy: { paper: '#f5ead6', ink: '#452a20', border: '#b58b55', action: '#9b4b2b' },
  elegant: { paper: '#121315', ink: '#f5efe4', border: '#8c7549', action: '#d4b77a' },
  cinema: { paper: '#f1e9d8', ink: '#231c18', border: '#ae9f85', action: '#9d2135' },
} as const;
export type BirthdayGalleryTheme = keyof typeof galleryThemes;

export function BirthdayGallery({images,title,theme}:{images:string[];title:string;theme:BirthdayGalleryTheme}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const selected = active === null ? null : active % images.length;
  const appearance = galleryThemes[theme];
  const style = {
    "--photo-paper": appearance.paper, "--photo-ink": appearance.ink,
    "--photo-border": appearance.border, "--photo-action": appearance.action,
  } as CSSProperties;
  const [orientations, setOrientations] = useState<Record<string, 'horizontal' | 'vertical' | 'square'>>({});
  const move = (step: number) => setActive(current => ((current ?? 0) + step + images.length) % images.length);
  return <>
    <div className="birthday-photo-grid" data-photo-count={Math.min(images.length, 4)} style={style}>
      {images.map((url,index) => <button key={url} type="button" className="birthday-photo-tile" data-orientation={orientations[url] ?? 'square'} aria-label={`Ampliar foto ${index + 1} de ${title}`} aria-haspopup="dialog" onClick={() => {
        setActive(index);
        dialog.current?.showModal();
      }}><Image src={url} alt={`${title}, foto ${index + 1}`} width={500} height={600} unoptimized onLoad={event => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (!naturalWidth || !naturalHeight) return;
        const orientation = naturalWidth > naturalHeight ? 'horizontal' : naturalWidth < naturalHeight ? 'vertical' : 'square';
        setOrientations(current => current[url] === orientation ? current : { ...current, [url]: orientation });
      }} /><span aria-hidden="true">↗</span></button>)}
    </div>
    <dialog ref={dialog} className="birthday-photo-viewer" style={style} onClose={() => setActive(null)} aria-label={`Fotos de ${title}`} onClick={event => {
      if (event.target === event.currentTarget) dialog.current?.close();
    }} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    }}>
      <div className="birthday-photo-viewer-panel">
        <button type="button" className="birthday-photo-close" aria-label="Cerrar foto" onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        {selected !== null && <Image className="birthday-photo-expanded" src={images[selected]} alt={`${title}, foto ${selected + 1}`} width={1400} height={1000} unoptimized />}
        <div className="birthday-photo-controls">
          {images.length > 1 && <button type="button" aria-label="Foto anterior" onClick={() => move(-1)}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 12H5m7 7-7-7 7-7" /></svg></button>}
          <span aria-live="polite">{(selected ?? 0) + 1} / {images.length}</span>
          {images.length > 1 && <button type="button" aria-label="Foto siguiente" onClick={() => move(1)}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14m-7-7 7 7-7 7" /></svg></button>}
        </div>
      </div>
    </dialog>
  </>;
}
