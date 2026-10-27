"use client";

import { useId, useRef, useState, useTransition } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import { deleteEvent } from "@/app/dashboard/eventos/[id]/actions";

export function DeleteInvitationButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const confirmed = confirmation.trim().toLocaleUpperCase("es-MX") === "ENTENDIDO";

  function openDialog() {
    setConfirmation("");
    setError(null);
    dialogRef.current?.showModal();
  }

  function handleDelete() {
    if (!confirmed || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteEvent(eventId);
        setError(result.error);
        if (!result.error) dialogRef.current?.close();
      } catch {
        setError("No se pudo eliminar la invitación. Inténtalo de nuevo.");
      }
    });
  }

  return <div className="dashboard-delete-action">
    <button className="dashboard-event-delete" type="button" onClick={openDialog} disabled={pending} aria-label={`Eliminar invitación: ${eventName}`} title="Eliminar invitación" aria-haspopup="dialog">
      <FiTrash2 aria-hidden="true" /><span>{pending ? "Eliminando…" : "Eliminar"}</span>
    </button>
    <dialog ref={dialogRef} className="invitation-delete-modal" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { if (pending) event.preventDefault(); }}>
      <form onSubmit={(event) => { event.preventDefault(); handleDelete(); }} aria-busy={pending}>
        <button className="invitation-delete-close" type="button" aria-label="Cerrar" disabled={pending} onClick={() => dialogRef.current?.close()}><FiX aria-hidden="true" /></button>
        <span className="invitation-delete-icon"><FiTrash2 aria-hidden="true" /></span>
        <h2 id={`${id}-title`}>¿Eliminar invitación?</h2>
        <p id={`${id}-description`}>Vas a eliminar <strong>«{eventName}»</strong>. Esta acción no se puede deshacer y el enlace de la invitación dejará de estar disponible.</p>
        <p>El historial permanece en Mis compras. Eliminar la invitación no cancela un pago abierto ni solicita un reembolso.</p>
        <label htmlFor={`${id}-confirmation`}>Escribe <strong>ENTENDIDO</strong> para confirmar</label>
        <input id={`${id}-confirmation`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="ENTENDIDO" autoComplete="off" autoFocus disabled={pending} />
        {error && <p className="invitation-delete-error" role="alert">{error}</p>}
        <div className="invitation-delete-buttons">
          <button type="button" disabled={pending} onClick={() => dialogRef.current?.close()}>Cancelar</button>
          <button className="invitation-delete-confirm" type="submit" disabled={!confirmed || pending}>{pending ? "Eliminando…" : "Eliminar invitación"}</button>
        </div>
      </form>
    </dialog>
  </div>;
}
