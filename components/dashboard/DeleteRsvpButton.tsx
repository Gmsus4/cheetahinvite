"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiTrash2, FiX } from "react-icons/fi";
import { deleteRsvpResponse } from "@/app/dashboard/eventos/[id]/asistencias/actions";

export function DeleteRsvpButton({ eventId, responseId, name }: { eventId: string; responseId: string; name: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteRsvpResponse(eventId, responseId);
        if (result.error) setError(result.error);
        else {
          dialogRef.current?.close();
          router.refresh();
        }
      } catch {
        setError("No se pudo eliminar la respuesta. Inténtalo de nuevo.");
      }
    });
  }

  return <div className="rsvp-delete-action" aria-busy={pending}>
    <button type="button" className="purchase-history-action rsvp-delete-icon" aria-label={`Eliminar respuesta de ${name}`} title="Eliminar respuesta" aria-haspopup="dialog" disabled={pending} onClick={() => { setError(null); dialogRef.current?.showModal(); }}><FiTrash2 aria-hidden="true" /></button>
    <dialog ref={dialogRef} className="invitation-delete-modal" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { if (pending) event.preventDefault(); }}>
      <form onSubmit={(event) => { event.preventDefault(); remove(); }} aria-busy={pending}>
        <button type="button" className="invitation-delete-close" aria-label="Cerrar" disabled={pending} onClick={() => dialogRef.current?.close()}><FiX aria-hidden="true" /></button>
        <span className="invitation-delete-icon"><FiTrash2 aria-hidden="true" /></span>
        <h2 id={`${id}-title`}>¿Eliminar respuesta?</h2>
        <p id={`${id}-description`}>Se eliminará la respuesta de <strong>{name}</strong>, incluidos sus acompañantes. Dejará de aparecer en los totales y en futuras descargas de Excel. Esta acción no se puede deshacer.</p>
        {error && <p className="invitation-delete-error" role="alert">{error}</p>}
        <div className="invitation-delete-buttons">
          <button type="button" autoFocus disabled={pending} onClick={() => dialogRef.current?.close()}>Cancelar</button>
          <button type="submit" className="invitation-delete-confirm" disabled={pending}>{pending ? "Eliminando…" : "Eliminar"}</button>
        </div>
      </form>
    </dialog>
  </div>;
}
