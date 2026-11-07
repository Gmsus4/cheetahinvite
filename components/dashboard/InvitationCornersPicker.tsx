"use client";

import type { InvitationSectionCorners } from "@/lib/invitation-editor";
import styles from "./InvitationCornersPicker.module.css";

const options = [
  { value: "square", label: "Cuadradas", radius: 0 },
  { value: "soft", label: "Suavizadas", radius: 8 },
  { value: "rounded", label: "Redondeadas", radius: 18 },
] as const;

export function InvitationCornersPicker({ value = "rounded", onChange }: { value?: InvitationSectionCorners; onChange(value: InvitationSectionCorners): void }) {
  return <fieldset className={styles.picker}>
    <legend>Esquinas de la invitación</legend>
    <p>Elige la forma de los bloques, imágenes y botones.</p>
    <div className={styles.options} role="group" aria-label="Esquinas de bloques y botones">
      {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
        <span className={styles.sample} style={{ borderRadius: option.radius }} aria-hidden="true"><i /><i /><i /></span>
        <span>{option.label}</span>
      </button>)}
    </div>
  </fieldset>;
}
