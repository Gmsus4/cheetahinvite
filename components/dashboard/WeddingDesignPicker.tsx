"use client";

import { FiCheck, FiArrowUpRight } from "react-icons/fi";
import { getWeddingDesign, weddingDesigns } from "@/lib/wedding-designs";
import { WeddingDesignPreview } from "@/components/invitation/WeddingDesignPreview";
import styles from "./WeddingDesignPicker.module.css";

export function WeddingDesignPicker({ value, onChange }: { value: string; onChange(id: string): void }) {
  const current = getWeddingDesign(value);
  return <fieldset className={styles.picker}>
    <legend>¿Cuál se siente más como ustedes?</legend>
    <p>Elige el estilo que cuenta su historia. Tus fotos y datos se conservan al cambiar de diseño.</p>
    {current && !current.edition && <p className="guided-legacy-design">Tu invitación conserva su diseño original. Elegir uno de esta colección aplica su nueva composición.</p>}
    <div className={styles.grid}>{weddingDesigns.map(design => {
      const selected = value === design.id;
      return <div className={styles.option} key={design.id}>
        <label className={`${styles.card}${selected ? ` ${styles.selected}` : ""}`}>
          <input type="radio" name="wedding-design" value={design.id} aria-label={design.label} checked={selected} onChange={() => onChange(design.id)} />
          <WeddingDesignPreview design={design} />
          <span className={styles.caption}><strong>{design.label}</strong><span className={styles.check} aria-hidden="true">{selected && <FiCheck />}</span></span>
        </label>
        <a className={styles.explore} href={`/ejemplo-invitacion/boda-${design.kind}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver invitación completa: ${design.label}`}>Ver invitación <FiArrowUpRight aria-hidden="true" /></a>
      </div>;
    })}</div>
  </fieldset>;
}
