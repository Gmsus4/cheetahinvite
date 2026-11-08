"use client";
import { useFormStatus } from "react-dom";
import { FiArrowUpRight, FiLoader } from "react-icons/fi";

export function AdminSubmit({ children, pendingLabel = "Guardando…", secondary = false, confirmMessage }: { children: React.ReactNode; pendingLabel?: string; secondary?: boolean; confirmMessage?: string }) {
  const { pending } = useFormStatus();
  return <button className={`admin-button${secondary ? " secondary" : ""}`} type="submit" disabled={pending} onClick={event => { if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault(); }}>{pending ? <><FiLoader aria-hidden="true" />{pendingLabel}</> : <>{children}<FiArrowUpRight aria-hidden="true" /></>}</button>;
}
