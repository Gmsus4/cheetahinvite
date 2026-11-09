"use client";

import type { CSSProperties } from "react";
import { invitationCoverLayouts, type InvitationCoverLayout } from "@/lib/invitation-cover-layout";
import styles from "./InvitationCoverLayoutPicker.module.css";

export function InvitationCoverLayoutPicker({ value = "split", imageUrl, onChange }: { value?: InvitationCoverLayout; imageUrl?: string; onChange(value: InvitationCoverLayout): void }) {
  return <fieldset className={styles.picker}>
    <legend>Diseño de la portada</legend>
    <p>Elige cómo presentar los nombres, la foto y la cuenta regresiva.</p>
    <div className={styles.options} role="group" aria-label="Diseño de la portada">
      {invitationCoverLayouts.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
        <span className={styles.sample} data-layout={option.value} style={imageUrl ? { "--cover-sample-photo": `url(${JSON.stringify(imageUrl)})` } as CSSProperties : undefined} aria-hidden="true">
          <span className={styles.sampleText}><i /><i /><i /></span><span className={styles.samplePhoto} /><span className={styles.sampleCountdown}><i /><i /><i /><i /></span>
        </span>
        <strong>{option.label}</strong><small>{option.description}</small>
      </button>)}
    </div>
    {value === "overlay" && !imageUrl && <p className={styles.help} role="status">Agrega una foto de portada para ver este diseño. Mientras tanto, se muestra la portada centrada.</p>}
  </fieldset>;
}
