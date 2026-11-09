"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FiArrowUpRight, FiGift, FiX } from "react-icons/fi";
import { acknowledgeCourtesyNotice } from "@/app/dashboard/actions";

export function CourtesyNotice({ grantId, eventId, name, expiresAt, published }: { grantId: string; eventId: string; name: string; expiresAt: Date; published: boolean }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function acknowledge(openInvitation: boolean) {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await acknowledgeCourtesyNotice(grantId);
        if (!result.ok) { setError(result.error); return; }
        setHidden(true);
        if (openInvitation) router.push(`/dashboard/eventos/${eventId}`);
      } catch {
        setError("No pudimos cerrar el aviso. Inténtalo de nuevo.");
      }
    });
  }

  if (hidden) return null;
  return <article className="dashboard-courtesy-notice" aria-labelledby={`courtesy-${grantId}`} aria-busy={pending}>
    <span className="dashboard-courtesy-icon"><FiGift aria-hidden="true" /></span>
    <div className="dashboard-courtesy-copy">
      <h2 id={`courtesy-${grantId}`}>¡Te regalamos la publicación de tu invitación!</h2>
      <p><strong>{name}</strong> · Disponible hasta el <time dateTime={expiresAt.toISOString()}>{new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" }).format(expiresAt)}</time>.</p>
      <p>{published ? "Ya está publicada. Puedes compartirla sin realizar un pago." : "Completa los datos y publica sin realizar un pago."}</p>
      {error && <p className="dashboard-courtesy-error" role="alert">{error}</p>}
    </div>
    <Link className="dashboard-courtesy-action" href={`/dashboard/eventos/${eventId}`} aria-label={`Abrir invitación de cortesía: ${name}`} aria-disabled={pending} onNavigate={event => { event.preventDefault(); acknowledge(true); }}>Abrir mi invitación <FiArrowUpRight aria-hidden="true" /></Link>
    <button className="dashboard-courtesy-close" type="button" disabled={pending} aria-label={`Marcar como leído el aviso de cortesía de ${name}`} title="Cerrar aviso" onClick={() => acknowledge(false)}><FiX aria-hidden="true" /></button>
  </article>;
}
