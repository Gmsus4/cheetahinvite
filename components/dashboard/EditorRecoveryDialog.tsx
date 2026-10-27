"use client";

import { useEffect, useRef } from "react";

export function EditorRecoveryDialog({ onRecover, onDiscard }: { onRecover(): void; onDiscard(): void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return <dialog ref={ref} className="editor-leave-dialog" aria-labelledby="editor-recovery-title" aria-describedby="editor-recovery-description" onCancel={event => event.preventDefault()}>
    <h2 id="editor-recovery-title">Tienes cambios sin guardar</h2>
    <p id="editor-recovery-description">Encontramos cambios de una visita anterior en este dispositivo. Recupéralos para seguir editando o descártalos para continuar con la última versión guardada.</p>
    <div>
      <button type="button" autoFocus onClick={onRecover}>Recuperar cambios</button>
      <button type="button" onClick={onDiscard}>Descartar cambios</button>
    </div>
  </dialog>;
}
