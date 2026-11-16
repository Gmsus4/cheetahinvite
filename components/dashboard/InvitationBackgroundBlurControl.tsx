"use client";

import { useId, type CSSProperties } from "react";
import styles from "./InvitationBackgroundControl.module.css";

export function InvitationBackgroundBlurControl({ value = 0, onChange, compact = false }: { value?: number; onChange(value: number): void; compact?: boolean }) {
  const id = useId();
  return <section className={`${styles.control}${compact ? ` ${styles.compact}` : ''}`} style={{ "--background-effect-progress": `${value}%` } as CSSProperties} aria-label="Desenfoque del fondo de la invitación">
    <label htmlFor={id}>{compact ? 'Desenfoque' : 'Desenfoque del fondo de la invitación'} <output htmlFor={id}>{value}%</output></label>
    {!compact && <p>Suaviza la foto o el color de fondo de toda la página.</p>}
    <input id={id} type="range" min={0} max={100} step={1} value={value} aria-valuetext={value === 0 ? "Sin desenfoque" : `${value}% de desenfoque del fondo`} onChange={event => onChange(Number(event.target.value))} />
    {!compact && <div className={styles.scale} aria-hidden="true"><span>Sin desenfoque</span><span>Más suave</span></div>}
  </section>;
}
