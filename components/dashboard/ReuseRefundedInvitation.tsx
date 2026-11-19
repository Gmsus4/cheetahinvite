"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import { reuseRefundedEvent } from "@/app/dashboard/eventos/[id]/pago/reuse-actions";
import styles from "./ReuseRefundedInvitation.module.css";

export function ReuseRefundedInvitation({ eventId, eventName, className }: { eventId: string; eventName: string; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return <div className={styles.container}>
    <p>Puedes conservar los textos, fotografías y diseño en un nuevo borrador usando este mismo espacio. Publicarlo requiere un nuevo pago.</p>
    <button className={className} type="button" aria-haspopup="dialog" disabled={pending} onClick={() => { setConfirmed(false); setError(null); dialog.current?.showModal(); }}>Reutilizar como nuevo borrador</button>
    <dialog ref={dialog} className="invitation-delete-modal" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { if (pending) event.preventDefault(); }}>
      <form aria-busy={pending} onSubmit={event => {
        event.preventDefault();
        if (!confirmed || pending) return;
        setError(null);
        startTransition(async () => {
          try {
            const result = await reuseRefundedEvent(eventId, true);
            if (result.error || !result.eventId) { setError(result.error || "No pudimos crear el borrador."); return; }
            dialog.current?.close();
            router.replace(`/dashboard/eventos/${result.eventId}`);
            router.refresh();
          } catch { setError("No pudimos confirmar el resultado. Inténtalo de nuevo; el reemplazo no se duplicará."); }
        });
      }}>
        <button className="invitation-delete-close" type="button" aria-label="Cerrar" disabled={pending} onClick={() => dialog.current?.close()}><FiX aria-hidden="true" /></button>
        <h2 id={`${id}-title`}>¿Reutilizar como nuevo borrador?</h2>
        <p id={`${id}-description`}>Reemplazaremos «{eventName}» conservando textos, fecha, lugares, fotografías y diseño. Se usará el mismo espacio, aunque tengas los tres ocupados.</p>
        <p>Las respuestas de asistencia y los accesos anteriores se eliminarán. El enlace anterior seguirá desactivado. El historial de compra y reembolso permanecerá en Mis compras.</p>
        <p>El borrador tendrá seis meses iniciales de conservación. Deberás elegir su privacidad y realizar un nuevo pago para publicarlo.</p>
        <label className={styles.confirmation}><input type="checkbox" checked={confirmed} disabled={pending} onChange={event => setConfirmed(event.target.checked)} /> Entiendo que se eliminarán las respuestas y se reemplazará la invitación reembolsada.</label>
        {error && <p className="invitation-delete-error" role="alert">{error}</p>}
        <div className="invitation-delete-buttons">
          <button type="button" disabled={pending} onClick={() => dialog.current?.close()}>Cancelar</button>
          <button className="invitation-delete-confirm" type="submit" disabled={!confirmed || pending}>{pending ? "Creando borrador…" : "Reutilizar como nuevo borrador"}</button>
        </div>
      </form>
    </dialog>
  </div>;
}
