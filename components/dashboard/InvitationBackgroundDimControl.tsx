"use client";

import { useId, type CSSProperties } from "react";
import styles from "./InvitationBackgroundControl.module.css";

export function InvitationBackgroundDimControl({ value = 0, onChange, compact = false }: { value?: number; onChange(value: number): void; compact?: boolean }) {
  const id = useId();
  return <section className={`${styles.control}${compact ? ` ${styles.compact}` : ''}`} style={{ "--background-effect-progress": `${value}%` } as CSSProperties} aria-label="Oscurecer el fondo de la invitación">
    <label htmlFor={id}>{compact ? 'Oscurecer' : 'Oscurecer el fondo de la invitación'} <output htmlFor={id}>{value}%</output></label>
    {!compact && <p>Añade una capa oscura sobre el fondo para resaltar el texto.</p>}
    <input id={id} type="range" min={0} max={100} step={1} value={value} aria-valuetext={value === 0 ? "Sin oscurecer" : `${value}% de oscurecimiento del fondo`} onChange={event => onChange(Number(event.target.value))} />
    {!compact && <div className={styles.scale} aria-hidden="true"><span>Sin oscurecer</span><span>Más oscuro</span></div>}
  </section>;
}
