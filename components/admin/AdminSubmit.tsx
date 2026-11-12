"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { FiArrowUpRight, FiCheckCircle, FiLoader, FiX } from "react-icons/fi";
import styles from "./AdminSubmit.module.css";

export function AdminSubmit({ children, pendingLabel = "Guardando…", secondary = false, confirmMessage, confirmTitle = "Confirmar acción", icon, iconLabel, className, disabled = false }: { children: ReactNode; pendingLabel?: string; secondary?: boolean; confirmMessage?: string; confirmTitle?: string; icon?: ReactNode; iconLabel?: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const button = useRef<HTMLButtonElement>(null);
  const submitted = useRef(false);
  const [confirming, setConfirming] = useState(false);

  function confirm() {
    if (pending || submitted.current) return;
    submitted.current = true;
    setConfirming(false);
    // Keep native validation and React's Server Action submission, including
    // the original submitter. requestSubmit does not dispatch another click.
    button.current?.form?.requestSubmit(button.current);
  }

  return <>
    <button ref={button} className={className ?? `admin-button${secondary ? " secondary" : ""}`} type="submit" disabled={pending || disabled} aria-label={iconLabel} title={iconLabel} aria-haspopup={confirmMessage ? "dialog" : undefined} onClick={event => {
      if (!confirmMessage) return;
      event.preventDefault();
      if (event.currentTarget.form?.reportValidity()) {
        submitted.current = false;
        setConfirming(true);
      }
    }}>{pending ? <><FiLoader aria-hidden="true" />{!iconLabel && pendingLabel}</> : icon ?? <>{children}<FiArrowUpRight aria-hidden="true" /></>}</button>
    {confirming && confirmMessage && createPortal(<AdminConfirmation title={confirmTitle} message={confirmMessage} label={children} onConfirm={confirm} onCancel={() => setConfirming(false)} />, document.body)}
  </>;
}

function AdminConfirmation({ title, message, label, onConfirm, onCancel }: { title: string; message: string; label: ReactNode; onConfirm(): void; onCancel(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); onCancel(); }} onClick={event => { if (event.target === event.currentTarget) onCancel(); }}>
    <div className={styles.content}>
      <button className={styles.close} type="button" aria-label="Cerrar confirmación" onClick={onCancel}><FiX aria-hidden="true" /></button>
      <span className={styles.icon}><FiCheckCircle aria-hidden="true" /></span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{message}</p>
      <div className={styles.actions}>
        <button className={styles.cancel} type="button" autoFocus onClick={onCancel}>Cancelar</button>
        <button className={styles.confirm} type="button" onClick={() => { dialog.current?.close(); onConfirm(); }}>{label}<FiArrowUpRight aria-hidden="true" /></button>
      </div>
    </div>
  </dialog>;
}
