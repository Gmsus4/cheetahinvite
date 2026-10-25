"use client";

import Image from "next/image";
import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { InvitationExampleFrame } from "./InvitationExampleFrame";

export function HeroInvitationExamples({ examples }: { examples: { slug: string; label: string }[] }) {
  const [selectedSlug, setSelectedSlug] = useState(examples[0].slug);
  const selected = examples.find(({ slug }) => slug === selectedSlug)!;

  return <>
    <div className="hero-example-caption">
      <span className="eyebrow">UNA INVITACIÓN PARA CADA MOMENTO</span>
      <p>Así la verán tus invitados.</p>
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
        <InvitationExampleFrame key={selected.slug} styleSlug={selected.slug} label={selected.label} viewportHeight={830} />
      </div>
      <Image
        className="hero-phone-frame"
        src="/iphone.png"
        alt=""
        aria-hidden="true"
        width={541}
        height={1114}
        sizes="(max-width: 760px) 300px, 320px"
      />
    </div>
  </>;
}
