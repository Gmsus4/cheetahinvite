"use client";

import { useFormStatus } from "react-dom";
import styles from "@/app/ejemplo-invitacion/[style]/utilizar/style-selection.module.css";

export function StyleSubmitButton({ children, disabled = false }: { children: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={styles.button} type="submit" disabled={disabled || pending}>{pending ? "Aplicando estilo…" : children}</button>;
}
