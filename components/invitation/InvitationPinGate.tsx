"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiLock } from "react-icons/fi";
import styles from "@/components/dashboard/InvitationSettings.module.css";

export function InvitationPinGate({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/invitations/${eventId}/unlock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "No pudimos verificar el PIN."); return; }
      setPin(""); router.refresh();
    } catch { setError("No pudimos conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  return <main className={styles.gate}><div className={styles.gateCard}><span className={styles.icon}><FiLock aria-hidden="true" /></span><h1>Una celebración privada</h1><p>Introduce el PIN que te compartió el organizador para ver la invitación.</p><form onSubmit={submit}><label htmlFor="invitation-pin">PIN de acceso</label><input id="invitation-pin" type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={pin} disabled={busy} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} aria-describedby={error ? "pin-error" : undefined} />{error && <p id="pin-error" className={styles.error} role="alert">{error}</p>}<button className={styles.primary} type="submit" disabled={busy || pin.length !== 6}>{busy ? "Comprobando…" : "Abrir invitación"}</button></form><small>¿No tienes el PIN? Pídeselo a la persona que te envió este enlace.</small></div></main>;
}
