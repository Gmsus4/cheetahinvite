"use client";

import Image from "next/image";
import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { InvitationExampleFrame } from "./InvitationExampleFrame";
import { trackLandingEvent } from "@/lib/client-analytics";

type Example = { slug: string; label: string };
type EventExample = Example & { available: boolean; typeLabel: string; eventType: string };

export function HeroInvitationExamples({ examples }: { examples: EventExample[] }) {
  const [selectedSlug, setSelectedSlug] = useState(examples[0]?.slug || "");
  const selected = examples.find(({ slug }) => slug === selectedSlug) ?? examples[0];
  if (!selected) return <div className="hero-example-caption"><span className="eyebrow">TU HISTORIA, TU ESTILO</span><p>Crea una invitación tan especial como tu celebración.</p></div>;

  const categories = examples.filter((item, index) => examples.findIndex(other => other.eventType === item.eventType) === index);
  const variants = examples.filter(example => example.eventType === selected.eventType);

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
    <div className="hero-example-phone" id="hero-invitation-example">
      <div className="hero-example-phone-screen">
        <InvitationExampleFrame key={selected.slug} styleSlug={selected.slug} label={selected.label} viewportHeight={830} hideScrollbar loading="eager" preview />
      </div>
      <Image
        className="hero-phone-frame"
        src="/iphone.png"
        alt=""
        aria-hidden="true"
        width={541}
        height={1114}
        sizes="(max-width: 760px) 280px, 320px"
        loading="eager"
      />
    </div>
  </>;
}
