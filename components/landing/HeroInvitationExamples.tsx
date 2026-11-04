"use client";

import Image from "next/image";
import { useState } from "react";
import { FiCheck, FiChevronLeft, FiChevronRight, FiClock } from "react-icons/fi";
import { InvitationExampleFrame } from "./InvitationExampleFrame";

type Example = { slug: string; label: string };
type EventExample = Example & { available: boolean };

export function HeroInvitationExamples({ examples, weddingDesigns, birthdayDesigns }: { examples: EventExample[]; weddingDesigns: Example[]; birthdayDesigns: Example[] }) {
  const [selectedSlug, setSelectedSlug] = useState(examples[0].slug);
  const [weddingIndex, setWeddingIndex] = useState(0);
  const [birthdayIndex, setBirthdayIndex] = useState(0);
  const selected = examples.find(({ slug }) => slug === selectedSlug)!;
  const isWedding = selected.slug === "boda";
  const isBirthday = selected.slug === "cumpleanos";
  const designs = isWedding ? weddingDesigns : isBirthday ? birthdayDesigns : [];
  const designIndex = isWedding ? weddingIndex : birthdayIndex;
  const preview = designs[designIndex] ?? selected;
  const designType = isWedding ? "boda" : "cumpleaños";
  const changeDesign = (direction: number) => {
    const setIndex = isWedding ? setWeddingIndex : setBirthdayIndex;
    setIndex((current) => (current + direction + designs.length) % designs.length);
  };

  return <>
    <div className="hero-example-caption">
      <span className="eyebrow">UNA INVITACIÓN PARA CADA MOMENTO</span>
      <p>Así la verán tus invitados.</p>
      {designs.length > 0 && <div className="hero-design-switcher" role="group" aria-label={`Cambiar diseño de ${designType}`}>
        <button type="button" onClick={() => changeDesign(-1)} aria-label={`Diseño de ${designType} anterior`} aria-controls="hero-invitation-example"><FiChevronLeft aria-hidden="true" /></button>
        <span role="status" aria-live="polite"><strong>{preview.label}</strong><small>{designIndex + 1} de {designs.length} diseños</small></span>
        <button type="button" onClick={() => changeDesign(1)} aria-label={`Siguiente diseño de ${designType}`} aria-controls="hero-invitation-example"><FiChevronRight aria-hidden="true" /></button>
      </div>}
      <div className="hero-example-selector" role="group" aria-label="Tipo de evento de ejemplo">
        {examples.map(({ slug, label, available }) => <button
          key={slug}
          type="button"
          disabled={!available}
          title={!available ? `${label} · Próximamente` : undefined}
          aria-label={!available ? `${label} · Próximamente` : undefined}
          aria-pressed={selectedSlug === slug}
          aria-controls="hero-invitation-example"
          onClick={() => setSelectedSlug(slug)}
        >{label}</button>)}
      </div>
      <div className="hero-example-meta">
        <span className="hero-example-hint" role="status"><FiCheck aria-hidden="true" /> {selected.label} · datos de ejemplo</span>
        <span className="event-availability-note"><FiClock aria-hidden="true" /> Más celebraciones, próximamente</span>
      </div>
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
