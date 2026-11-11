"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FiArrowRight, FiCheck, FiCopy, FiExternalLink, FiLock, FiMessageCircle, FiUsers } from "react-icons/fi";
import { invitationShareMessage, type PublicationResponses } from "@/lib/publication-next-steps";
import styles from "./PublicationReady.module.css";

const subscribe = () => () => {};
const originSnapshot = () => window.location.origin;
const serverOrigin = () => "";

export function PublicationReady({ eventId, name, path, privateInvitation, responses }: { eventId: string; name: string; path: string; privateInvitation: boolean; responses: PublicationResponses }) {
  const origin = useSyncExternalStore(subscribe, originSnapshot, serverOrigin);
  const url = `${origin}${path}`;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timeout);
  }, [copied]);
  async function copy() {
    setError("");
    try { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setCopied(true); }
    catch { setError("No pudimos copiarlo automáticamente. Selecciona el enlace de arriba para copiarlo."); }
  }
  return <div className={styles.ready}>
    <div className={styles.linkBox}>
      <label htmlFor="published-invitation-link">El enlace de tu invitación</label>
      <input id="published-invitation-link" type="text" readOnly value={url} onFocus={event => event.currentTarget.select()} spellCheck={false} />
      <button className={styles.primary} type="button" aria-label={copied ? "Enlace copiado" : "Copiar enlace"} onClick={() => void copy()}>{copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}<span className={styles.copyLabel}>{copied ? "Enlace copiado" : "Copiar enlace"}</span></button>
      <span className={styles.feedback} role="status" aria-live="polite">{error || (copied ? "Enlace copiado." : "")}</span>
    </div>
    <div className={styles.actions}>
      <a href={origin ? `https://wa.me/?text=${encodeURIComponent(invitationShareMessage(name, url))}` : undefined} aria-disabled={!origin} target="_blank" rel="noopener noreferrer"><FiMessageCircle aria-hidden="true" />Enviar por WhatsApp</a>
      <Link href={path} target="_blank" rel="noopener noreferrer"><FiExternalLink aria-hidden="true" />Ver invitación</Link>
    </div>
    <p className={styles.hint}>Tú eliges a quién enviar el mensaje en WhatsApp.</p>
    {privateInvitation && <div className={styles.reminder}><FiLock aria-hidden="true" /><div><h3>Recuerda compartir el PIN</h3><p>Tu invitación está protegida. Envía también el PIN de seis dígitos a tus invitados; no se incluye en el mensaje de WhatsApp.</p><Link href={`/dashboard/eventos/${eventId}/ajustes`}>¿No recuerdas el PIN? Cámbialo en Ajustes<FiArrowRight aria-hidden="true" /></Link></div></div>}
    <div className={styles.responses}><FiUsers aria-hidden="true" /><div><h3>{responses === "integrated" ? "Aquí empiezan las confirmaciones" : "Las respuestas de tus invitados"}</h3><p>{responses === "integrated" ? "Consulta quién confirmó y cuántas personas asistirán. Las respuestas aparecerán en cuanto tus invitados completen el formulario." : responses === "whatsapp" ? "Elegiste confirmar por WhatsApp. Recibirás las respuestas en el número configurado en tu invitación." : responses === "external" ? "Elegiste un enlace externo para confirmar asistencia. Consulta las respuestas en el servicio que configuraste." : "Tu invitación no tiene un bloque de confirmación activo. Puedes agregarlo desde el editor cuando lo necesites."}</p><Link href={responses === "integrated" ? `/dashboard/eventos/${eventId}/asistencias` : `/dashboard/eventos/${eventId}`}>{responses === "integrated" ? "Ver respuestas" : "Ajustar confirmaciones"}<FiArrowRight aria-hidden="true" /></Link></div></div>
  </div>;
}
