"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

export function WeddingPhotoCarousel({ images, title }: { images: string[]; title: string }) {
  const photos = [...new Set(images.filter(Boolean))];
  const [selected, setSelected] = useState<string | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const viewportId = useId();
  const active = Math.max(0, photos.indexOf(selected ?? photos[0]));
  const multiple = photos.length > 1;

  function move(step: number) {
    setSelected(current => {
      const index = Math.max(0, photos.indexOf(current ?? photos[0]));
      return photos[(index + step + photos.length) % photos.length];
    });
  }

  if (!photos.length) return null;

  return <div className="wa-photo-carousel" role="region" aria-roledescription="carrusel" aria-label={`Fotografías de ${title}`} onKeyDown={event => {
    if (!multiple) return;
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "Home") { event.preventDefault(); setSelected(photos[0]); }
    if (event.key === "End") { event.preventDefault(); setSelected(photos[photos.length - 1]); }
  }}>
    <div id={viewportId} className="wa-carousel-viewport" role="group" tabIndex={multiple ? 0 : undefined} aria-label={multiple ? "Usa las flechas del teclado o desliza para cambiar de fotografía" : undefined}
      onTouchStart={event => {
        if (event.touches.length !== 1) { touch.current = null; return; }
        touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchCancel={() => { touch.current = null; }}
      onTouchEnd={event => {
        const start = touch.current;
        touch.current = null;
        if (!multiple || !start || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
      }}>
      <div className="wa-carousel-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {photos.map((src, index) => <figure key={src} className="wa-carousel-slide" role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${photos.length}`} aria-hidden={index !== active}>
          <Image src={src} alt={`${title} · fotografía ${index + 1}`} width={1200} height={800} sizes="(max-width:600px) 90vw, 520px" unoptimized draggable={false} />
        </figure>)}
      </div>
      {multiple && <div className="wa-carousel-controls">
        <button type="button" aria-label="Fotografía anterior" aria-controls={viewportId} onClick={() => move(-1)}><FiArrowLeft aria-hidden="true" /></button>
        <span className="wa-carousel-counter" role="status" aria-live="polite" aria-atomic="true"><span className="wa-carousel-sr-only">Fotografía </span>{active + 1} / {photos.length}</span>
        <button type="button" aria-label="Fotografía siguiente" aria-controls={viewportId} onClick={() => move(1)}><FiArrowRight aria-hidden="true" /></button>
      </div>}
    </div>
    {multiple && <>
      <div className="wa-carousel-dots" role="group" aria-label="Elegir fotografía">{photos.map((src, index) => <button key={src} type="button" aria-label={`Ver fotografía ${index + 1}`} aria-controls={viewportId} aria-current={index === active ? "true" : undefined} onClick={() => setSelected(src)}><span /></button>)}</div>
    </>}
  </div>;
}
