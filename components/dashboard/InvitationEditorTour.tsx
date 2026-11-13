"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FiHelpCircle, FiX } from "react-icons/fi";
import type { Driver } from "driver.js";
import { invitationEditorTourSteps } from "@/lib/invitation-editor-tour";
import "driver.js/dist/driver.css";
import "./InvitationEditorTour.css";

const preferenceEvent = "invitation-tour-preference";
const subscribe = (listener: () => void) => {
  window.addEventListener('storage', listener);
  window.addEventListener(preferenceEvent, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(preferenceEvent, listener); };
};
const serverSnapshot = () => undefined;

export function InvitationEditorTour({ ownerId, enabled, published, example, returnsToCreation, returnsToDashboard = false, allIncluded }: { ownerId: string; enabled: boolean; published: boolean; example: boolean; returnsToCreation: boolean; returnsToDashboard?: boolean; allIncluded: boolean }) {
  const key = `cheetahinvite:editor-tour:v2:${ownerId}`;
  const getSeen = useCallback(() => { try { return window.localStorage.getItem(key) === 'seen'; } catch { return true; } }, [key]);
  const seen = useSyncExternalStore(subscribe, getSeen, serverSnapshot);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const tour = useRef<Driver | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const generation = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => () => { generation.current++; tour.current?.destroy(); }, []);
  useEffect(() => { enabledRef.current = enabled; if (!enabled) tour.current?.destroy(); }, [enabled]);

  function dismiss() {
    setDismissed(key); setError('');
    try { window.localStorage.setItem(key, 'seen'); window.dispatchEvent(new Event(preferenceEvent)); } catch { /* Help remains available without device storage. */ }
  }
  async function start() {
    if (!enabled || loading || active) return;
    const root = button.current?.closest<HTMLElement>('[data-editor-tour-root]');
    if (!root) return;
    const request = ++generation.current;
    setLoading(true); setError('');
    try {
      const { driver } = await import('driver.js');
      if (request !== generation.current || !enabledRef.current) return;
      const scrollY = window.scrollY;
      const steps = invitationEditorTourSteps({ published, example, returnsToCreation, returnsToDashboard, allIncluded, mobile: window.matchMedia("(max-width: 600px)").matches })
        .filter(step => typeof step.element === 'string' && root.querySelector(step.element))
        .map(step => ({ ...step, element: root.querySelector(step.element as string)! }));
      root.dataset.editorTourActive = 'true';
      tour.current = driver({
        steps, animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        smoothScroll: false, overlayOpacity: 0.62, stagePadding: 8, stageRadius: 14,
        disableActiveInteraction: true, allowClose: true, overlayClickBehavior: 'none',
        showProgress: true, progressText: '{{current}} de {{total}}',
        nextBtnText: 'Siguiente', prevBtnText: 'Anterior', doneBtnText: 'Terminar', closeBtnLabel: 'Salir del recorrido',
        popoverClass: 'invitation-tour-popover',
        onPopoverRender: popover => {
          popover.wrapper.setAttribute('lang', 'es');
          popover.closeButton.setAttribute('title', 'Salir del recorrido');
        },
        onHighlighted: element => {
          if (!element || !window.matchMedia('(max-width: 600px)').matches) return;
          const rect = element.getBoundingClientRect();
          const sheetTop = document.querySelector('.invitation-tour-popover')?.getBoundingClientRect().top ?? window.innerHeight * 0.55;
          if (element.closest('[data-tour-toolbar]')) element.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          else if (rect.bottom > sheetTop - 16 && rect.top > 16) window.scrollBy({ top: Math.min(rect.top - 16, rect.bottom - sheetTop + 16), behavior: 'instant' });
        },
        onDestroyed: () => {
          delete root.dataset.editorTourActive;
          tour.current = null;
          setActive(false);
          window.scrollTo({ top: scrollY, behavior: 'instant' });
          button.current?.focus({ preventScroll: true });
        },
      });
      dismiss(); setActive(true); tour.current.drive();
    } catch {
      tour.current?.destroy();
      delete root.dataset.editorTourActive;
      setError('No pudimos abrir la guía. Pulsa Ayuda para intentarlo de nuevo.');
    } finally { if (request === generation.current) setLoading(false); }
  }

  return <>
    <button ref={button} data-tour="help" type="button" disabled={!enabled || loading} onClick={() => void start()} title="Ayuda: recorrido guiado" aria-label={loading ? 'Preparando la guía…' : 'Ayuda: iniciar recorrido guiado'}><FiHelpCircle aria-hidden="true" /><span>Ayuda</span></button>
    {seen !== undefined && enabled && !active && ((!seen && dismissed !== key) || error) && createPortal(
      <aside className="invitation-tour-welcome" aria-labelledby="invitation-tour-welcome-title">
        <button className="invitation-tour-dismiss" type="button" aria-label="Cerrar ayuda" onClick={() => { dismiss(); setError(''); }}><FiX aria-hidden="true" /></button>
        <span className="invitation-tour-eyebrow">TU INVITACIÓN, A TU MANERA</span>
        <h2 id="invitation-tour-welcome-title">¿Te mostramos cómo editar?</h2>
        <p>Descubre qué hace cada icono y dónde cambiar fotos, colores y textos, guardar y regresar. Te guiamos paso a paso.</p>
        {error && <p role="alert">{error}</p>}
        <div className="invitation-tour-welcome-actions"><button type="button" disabled={loading} onClick={() => void start()}>{loading ? 'Preparando…' : 'Mostrarme cómo'}</button><button type="button" onClick={dismiss}>Ahora no</button></div>
        <small>Puedes volver al recorrido desde el botón ? Ayuda.</small>
      </aside>, document.body,
    )}
  </>;
}
