"use client";

import { useId } from "react";
import { FiHeart } from "react-icons/fi";
import styles from "./InvitationIconsPicker.module.css";

export function InvitationIconsPicker({ value = true, onChange, embedded = false }: { embedded?: boolean; value?: boolean; onChange(value: boolean): void }) {
  const id = useId();
  return <section className={`${styles.picker} ${embedded ? styles.embedded : ""}`} aria-labelledby={`${id}-title`}>
    <div className={styles.heading}><span aria-hidden="true"><FiHeart /></span><h2 id={`${id}-title`}>Los iconos de tu invitación</h2></div>
    <p>Un detalle sobre cada título, o un diseño más limpio. Tú eliges.</p>
    <label className={styles.toggle} htmlFor={id}>
      <span><strong>Mostrar iconos en las secciones</strong><small>{value ? "Por defecto: respeta la elección de cada sección." : "Sin iconos: oculta todos los iconos sobre los títulos."}</small></span>
      <span className={styles.control}><input id={id} type="checkbox" role="switch" checked={value} onChange={event => onChange(event.target.checked)} /><span className={styles.track} aria-hidden="true" /></span>
    </label>
  </section>;
}
