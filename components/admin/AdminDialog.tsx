"use client";

import { useId, useRef, type ReactNode } from "react";
import { FiArrowUpRight, FiX } from "react-icons/fi";
import styles from "./AdminDialog.module.css";

export function AdminDialog({ label, title, children, primary = false, icon, triggerClassName }: { label: string; title: string; children: ReactNode; primary?: boolean; icon?: ReactNode; triggerClassName?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <button className={triggerClassName ?? `admin-button${primary ? "" : " secondary"}`} type="button" aria-label={icon ? label : undefined} title={icon ? label : undefined} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{icon ?? <>{label}<FiArrowUpRight aria-hidden="true" /></>}</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId}>
      <header className={styles.header}><h2 id={titleId}>{title}</h2><button type="button" className={styles.close} aria-label="Cerrar ventana" autoFocus onClick={() => dialog.current?.close()}><FiX aria-hidden="true" /></button></header>
      <div className={styles.content}>{children}</div>
    </dialog>
  </>;
}
