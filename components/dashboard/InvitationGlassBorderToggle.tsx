"use client";

import { useId } from "react";
import styles from "./InvitationGlassBorderToggle.module.css";

export function InvitationGlassBorderToggle({ value = true, onChange }: { value?: boolean; onChange(value: boolean): void }) {
  const id = useId();
  return <label className={styles.toggle} htmlFor={id}>
    <span><strong>Mostrar borde del cristal</strong><small>Se aplica a todos los bloques con acabado Cristal.</small></span>
    <input id={id} type="checkbox" role="switch" checked={value} onChange={event => onChange(event.target.checked)} />
  </label>;
}
