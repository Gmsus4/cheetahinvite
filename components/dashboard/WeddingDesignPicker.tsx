"use client";

import { FiCheck, FiArrowUpRight } from "react-icons/fi";
import type { CSSProperties } from "react";
import { getWeddingDesign, weddingArtwork, weddingDesigns } from "@/lib/wedding-designs";
import { getInvitationFont } from "@/lib/invitation-fonts";
import styles from "./WeddingDesignPicker.module.css";

export function WeddingDesignPicker({ value, onChange }: { value: string; onChange(id: string): void }) {
  const current = getWeddingDesign(value);
  return <fieldset className={styles.picker}>
    <legend>¿Cuál se siente más como ustedes?</legend>
    <p>Elige el estilo que cuenta su historia. Tus fotos y datos se conservan al cambiar de diseño.</p>
    {current && !current.edition && <p className="guided-legacy-design">Tu invitación conserva su diseño original. Elegir uno de esta colección aplica su nueva composición.</p>}
    <div className={styles.grid}>{weddingDesigns.map(design => {
      const selected = value === design.id;
      const palette = design.palettes[0];
      const art = weddingArtwork(design);
      const style = { "--paper": palette.paper, "--panel": palette.panel, "--ink": palette.ink, "--accent": palette.accent, "--dark": palette.dark, "--heading": getInvitationFont(design.typography).family, "--art-top": art.topLeft ? `url("${art.topLeft}")` : "none", "--art-bottom": art.bottomRight ? `url("${art.bottomRight}")` : "none", "--flower": art.flower ? `url("${art.flower}")` : "none" } as CSSProperties;
      return <div className={styles.option} key={design.id}>
        <label className={`${styles.card}${selected ? ` ${styles.selected}` : ""}`} style={style}>
          <input type="radio" name="wedding-design" value={design.id} aria-label={design.label} checked={selected} onChange={() => onChange(design.id)} />
          <span className={styles.scene} data-design={design.kind} aria-hidden="true">
            <span className={styles.paper} /><span className={styles.artTop} /><span className={styles.artBottom} />
            <span className={styles.motif} /><span className={styles.kicker}>NOS ELEGIMOS PARA SIEMPRE</span>
            <span className={styles.names}>Sofía <i>y</i> Mateo</span><span className={styles.rule} /><span className={styles.date}>12 · OCTUBRE · 2027</span>
          </span>
          <span className={styles.caption}><strong>{design.label}</strong><span className={styles.check} aria-hidden="true">{selected && <FiCheck />}</span></span>
        </label>
        <a className={styles.explore} href={`/ejemplo-invitacion/boda-${design.kind}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver invitación completa: ${design.label}`}>Ver invitación <FiArrowUpRight aria-hidden="true" /></a>
      </div>;
    })}</div>
  </fieldset>;
}
