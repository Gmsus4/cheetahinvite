"use client";

import { useEffect, useRef } from "react";

export function EditorLeaveDialog({ onStay, onLeave }: { onStay(): void; onLeave(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="editor-leave-dialog" aria-labelledby="editor-leave-title" aria-describedby="editor-leave-description" onCancel={event => { event.preventDefault(); onStay(); }}>
    <h2 id="editor-leave-title">¿Salir del editor?</h2>
    <p id="editor-leave-description">Hay cambios pendientes o fotos en proceso. Podrás recuperar los cambios con copia local en este dispositivo; las fotos que todavía se estén subiendo deberán seleccionarse de nuevo.</p>
    <div><button type="button" autoFocus onClick={onStay}>Seguir editando</button><button type="button" onClick={onLeave}>Salir del editor</button></div>
  </dialog>;
}
