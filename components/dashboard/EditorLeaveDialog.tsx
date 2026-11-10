"use client";

import { useEffect, useRef } from "react";

export function EditorLeaveDialog({ onStay, onLeave, onSaveAndLeave, saving = false, saveDisabled = false, uploading = false, error = "", saveLabel = "Guardar y salir", publishesChanges = false }: {
  onStay(): void; onLeave(): void; onSaveAndLeave?(): void; saving?: boolean; saveDisabled?: boolean; uploading?: boolean; error?: string; saveLabel?: string; publishesChanges?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="editor-leave-dialog" aria-labelledby="editor-leave-title" aria-describedby="editor-leave-description" aria-busy={saving} onCancel={event => { event.preventDefault(); if (!saving) onStay(); }}>
    <h2 id="editor-leave-title">¿Salir del editor?</h2>
    <p id="editor-leave-description">Hay cambios pendientes o fotos en proceso. {onSaveAndLeave && (publishesChanges ? "«Publicar cambios y salir» actualiza la invitación que ven tus invitados. " : "Guarda en tu cuenta para continuar después, incluso desde otro dispositivo. ")}Si sales sin guardar, solo podrás recuperar los cambios que tengan copia local en este dispositivo; las fotos que todavía se estén subiendo deberán seleccionarse de nuevo.</p>
    {error && <p className="image-upload-error" role="alert">{error}</p>}
    {uploading && onSaveAndLeave && <p role="status">Espera a que terminen las fotos para guardar y salir.</p>}
    <div><button type="button" autoFocus disabled={saving} onClick={onStay}>Seguir editando</button><button type="button" disabled={saving} onClick={onLeave}>{onSaveAndLeave ? "Salir sin guardar" : "Salir del editor"}</button>{onSaveAndLeave && <button type="button" disabled={saving || saveDisabled} onClick={onSaveAndLeave}>{saving ? publishesChanges ? "Publicando…" : "Guardando…" : saveLabel}</button>}</div>
  </dialog>;
}
