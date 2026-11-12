"use client";

import { useState } from "react";
import { FiCheck, FiChevronLeft, FiChevronRight, FiExternalLink } from "react-icons/fi";
import { InvitationExampleFrame } from "./InvitationExampleFrame";
import { HeroInvitationPhone } from "./HeroInvitationPhone";
import { trackLandingEvent } from "@/lib/client-analytics";

type Example = { slug: string; label: string };
type EventExample = Example & { available: boolean; typeLabel: string; eventType: string };

export function HeroInvitationExamples({ examples }: { examples: EventExample[] }) {
  const [selectedSlug, setSelectedSlug] = useState(examples[0]?.slug || "");
  const selected = examples.find(({ slug }) => slug === selectedSlug) ?? examples[0];
  if (!selected) return <div className="hero-example-caption"><span className="eyebrow">TU HISTORIA, TU ESTILO</span><p>Crea una invitación tan especial como tu celebración.</p></div>;

  const categories = examples.filter((item, index) => examples.findIndex(other => other.eventType === item.eventType) === index);
  const variants = examples.filter(example => example.eventType === selected.eventType);
  const availableExamples = examples.filter(example => example.available);

  function changeDesign(direction: -1 | 1) {
    if (availableExamples.length < 2) return;
    const index = availableExamples.findIndex(example => example.slug === selected?.slug);
    const next = availableExamples[(index + direction + availableExamples.length) % availableExamples.length];
    setSelectedSlug(next.slug);
    trackLandingEvent("example_select", next.slug);
  }

  return <>
    <div className="hero-example-caption">
      <span className="eyebrow">UNA INVITACIÓN PARA CADA MOMENTO</span>
      <p>Así la verán tus invitados.</p>
      <div className="hero-example-selector" role="group" aria-label="Tipo de evento de ejemplo">
        {categories.map(({ slug, typeLabel, label: exampleLabel, eventType, available }) => <button
          key={slug}
          type="button"
          disabled={!available}
          title={!available ? `${typeLabel} · Próximamente` : exampleLabel}
          aria-label={!available ? `${typeLabel} · Próximamente` : typeLabel}
          aria-pressed={selected.eventType === eventType}
          aria-controls="hero-invitation-example"
          onClick={() => { setSelectedSlug(slug); trackLandingEvent("example_select", slug); }}
        >{typeLabel}</button>)}
      </div>
      {variants.length > 1 && <label className="hero-example-variants">Elige un diseño<select aria-label="Diseño de invitación de ejemplo" value={selected.slug} onChange={event => { setSelectedSlug(event.target.value); trackLandingEvent("example_select", event.target.value); }}>{variants.map(example => <option key={example.slug} value={example.slug}>{example.label}</option>)}</select></label>}
      <div className="hero-example-meta">
        <span className="hero-example-hint" role="status"><FiCheck aria-hidden="true" /> {selected.label} · datos de ejemplo</span>
      </div>
    </div>
    <HeroInvitationPhone action={<>
      <button className="hero-example-arrow hero-example-arrow-prev" type="button" aria-label="Diseño anterior" title="Diseño anterior" aria-controls="hero-invitation-example" disabled={availableExamples.length < 2} onClick={() => changeDesign(-1)}><FiChevronLeft aria-hidden="true" /></button>
      <button className="hero-example-arrow hero-example-arrow-next" type="button" aria-label="Diseño siguiente" title="Diseño siguiente" aria-controls="hero-invitation-example" disabled={availableExamples.length < 2} onClick={() => changeDesign(1)}><FiChevronRight aria-hidden="true" /></button>
      <a
        className="hero-example-open"
        href={`/ejemplo-invitacion/${selected.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Ver diseño completo (se abre en otra pestaña)"
        aria-label={`Ver diseño completo: ${selected.label} (se abre en otra pestaña)`}
      ><FiExternalLink aria-hidden="true" /></a></>}>
      <InvitationExampleFrame key={selected.slug} styleSlug={selected.slug} label={selected.label} viewportHeight={830} hideScrollbar loading="eager" preview />
    </HeroInvitationPhone>
  </>;
}
