"use client";

import Image from "next/image";
import { useState } from "react";
import { FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { InvitationExampleFrame } from "./InvitationExampleFrame";

type Example = { slug: string; label: string };

export function HeroInvitationExamples({ examples, weddingDesigns }: { examples: Example[]; weddingDesigns: Example[] }) {
  const [selectedSlug, setSelectedSlug] = useState(examples[0].slug);
  const [weddingIndex, setWeddingIndex] = useState(0);
  const selected = examples.find(({ slug }) => slug === selectedSlug)!;
  const isWedding = selected.slug === "boda";
  const preview = isWedding ? weddingDesigns[weddingIndex] : selected;
  const changeWedding = (direction: number) => setWeddingIndex((current) =>
    (current + direction + weddingDesigns.length) % weddingDesigns.length);

  return <>
    <div className="hero-example-caption">
      <span className="eyebrow">UNA INVITACIÓN PARA CADA MOMENTO</span>
      <p>Así la verán tus invitados.</p>
      {isWedding && <div className="hero-design-switcher" role="group" aria-label="Cambiar diseño de boda">
        <button type="button" onClick={() => changeWedding(-1)} aria-label="Diseño de boda anterior" aria-controls="hero-invitation-example"><FiChevronLeft aria-hidden="true" /></button>
        <span role="status" aria-live="polite"><strong>{preview.label}</strong><small>{weddingIndex + 1} de {weddingDesigns.length} diseños</small></span>
        <button type="button" onClick={() => changeWedding(1)} aria-label="Siguiente diseño de boda" aria-controls="hero-invitation-example"><FiChevronRight aria-hidden="true" /></button>
      </div>}
      <div className="hero-example-selector" role="group" aria-label="Tipo de evento de ejemplo">
        {examples.map(({ slug, label }) => <button
          key={slug}
          type="button"
          aria-pressed={selectedSlug === slug}
          aria-controls="hero-invitation-example"
          onClick={() => setSelectedSlug(slug)}
        >{label}</button>)}
      </div>
      <span className="hero-example-hint" role="status"><FiCheck aria-hidden="true" /> {selected.label} · datos de ejemplo</span>
    </div>
    <div className="hero-example-phone" id="hero-invitation-example">
      <div className="hero-example-phone-screen">
        <InvitationExampleFrame key={preview.slug} styleSlug={preview.slug} label={preview.label} viewportHeight={830} />
      </div>
      <Image
        className="hero-phone-frame"
        src="/iphone.png"
        alt=""
        aria-hidden="true"
        width={541}
        height={1114}
        sizes="(max-width: 760px) 220px, 234px"
        loading="eager"
      />
    </div>
  </>;
}
