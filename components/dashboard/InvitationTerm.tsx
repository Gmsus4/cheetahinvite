"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { canRenewInvitation, invitationLifecycle } from "@/lib/invitation-lifecycle";
import styles from "./InvitationTerm.module.css";

type Props = {
  event: { id: string; status: string; paidAt: Date | null; complimentaryAt?: Date | null; expiresAt: Date | null; stripePaymentIntentId?: string | null; isExample?: boolean };
  now: number;
  compact?: boolean;
};
const date = (value: Date) => new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }).format(value);

export function InvitationTerm({ event, now, compact = false }: Props) {
  const [clock, setClock] = useState(now);
  useEffect(() => {
    const update = () => setClock(Date.now());
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [now]);
  const term = invitationLifecycle(event, new Date(clock));
  if (!term) return null;
  return <section className={styles.term} data-compact={compact || undefined} aria-label="Vigencia de la invitación">
    {term.phase === "active" ? <>
      <div className={styles.heading}>
        <div className={styles.remaining}><strong>{term.remainingDays}</strong><span>{term.remainingDays === 1 ? "día restante" : "días restantes"}</span></div>
        <span className={styles.elapsed}><strong>{term.elapsedDays}</strong> de {term.totalDays} días transcurridos</span>
      </div>
      <div className={styles.track}>
        <progress value={term.elapsedDays} max={Math.max(1, term.totalDays)} aria-label={`${term.elapsedDays} de ${term.totalDays} días de vigencia transcurridos`} />
        <span className={styles.markers} aria-hidden="true"><i /><i /><i /></span>
      </div>
      <div className={styles.dates}>
        <span>Inicio <time dateTime={term.startedAt.toISOString()}>{date(term.startedAt)}</time></span>
        <span>Vencimiento <time dateTime={term.expiresAt.toISOString()}>{date(term.expiresAt)}</time></span>
      </div>
      <p className={styles.note}>Después del vencimiento, tendrás un mes de archivo para renovar.</p>
    </> : <>
      <strong>{term.phase === "archived" ? "Invitación archivada" : "Vigencia finalizada"}</strong>
      <p>El enlace público y la edición están desactivados. {term.phase === "archived" ? `Se eliminará automáticamente el ${date(term.deletesAt)}; quedan ${term.archiveDaysRemaining} días para recuperarla.` : "El plazo para recuperarla terminó. La eliminación automática está pendiente."}</p>
      {canRenewInvitation(event, new Date(clock)) && <Link href={`/dashboard/eventos/${event.id}/pago`}>Renovar por otro año →</Link>}
    </>}
  </section>;
}
