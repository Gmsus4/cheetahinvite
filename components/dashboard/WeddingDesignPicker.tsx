"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { FiCheck } from "react-icons/fi";
import { weddingArtwork, weddingDesigns } from "@/lib/wedding-designs";
import { getInvitationFont } from "@/lib/invitation-fonts";

export function WeddingDesignPicker({ value, onChange }: { value: string; onChange(id: string): void }) {
  return <fieldset className="guided-designs">
    <legend>¿Cuál se siente más como ustedes?</legend>
    <p>{weddingDesigns.length} diseños completos. Cambia de estilo conservando tus fotos y los datos de tu boda.</p>
    <div>{weddingDesigns.map(design => {
      const art = weddingArtwork(design);
      const palette = design.palettes[0];
      const selected = value === design.id;
      return <label key={design.id} className={`guided-design-card${selected ? " is-selected" : ""}`}>
        <input type="radio" name="wedding-design" value={design.id} aria-label={design.label} checked={selected} onChange={() => onChange(design.id)} />
        <span className="guided-design-sample" data-design={design.kind} data-artwork={design.artwork} style={{ "--sample-heading": getInvitationFont(design.typography).family, "--sample-paper": palette.paper, "--sample-panel": palette.panel, "--sample-ink": palette.ink, "--sample-accent": palette.accent, "--sample-texture": art.texture ? `url("${art.texture}")` : "none" } as CSSProperties}>
          {art.topLeft && <Image className="guided-sample-art guided-sample-art-top" src={art.topLeft} alt="" width={160} height={160} unoptimized />}
          {art.bottomRight && <Image className="guided-sample-art guided-sample-art-bottom" src={art.bottomRight} alt="" width={160} height={160} unoptimized />}
          <small>NOS CASAMOS</small><span className="guided-sample-title">Nosotros<br /><i>y el mundo.</i></span><small>UN DÍA PARA RECORDAR</small>
        </span>
        <span className="guided-design-label"><strong>{design.label}</strong>{selected && <FiCheck aria-hidden="true" />}</span>
        <span className="guided-design-description">{design.description}</span>
      </label>;
    })}</div>
  </fieldset>;
}
