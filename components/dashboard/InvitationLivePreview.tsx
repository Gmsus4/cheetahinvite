"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiEdit3, FiEye, FiMonitor, FiSmartphone } from "react-icons/fi";

const previewDocument = '<!doctype html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0"><div id="invitation-preview-root"></div></body></html>';

export type InvitationPreviewFocus = { target: string; label: string; fallback?: string; sequence?: number };

export function InvitationLivePreview({ children, focus, expanded = false, onClose, onExpand, expandLabel = "Ampliar vista previa", expandDisabled = false, publicLink, initialDevice = "desktop", fitViewport = false }: { children: ReactNode; focus?: InvitationPreviewFocus; expanded?: boolean; onClose?: () => void; onExpand?: () => void; expandLabel?: string; expandDisabled?: boolean; publicLink?: ReactNode; initialDevice?: "desktop" | "mobile"; fitViewport?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">(initialDevice);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previewContainer = useRef<HTMLDivElement>(null);
  const width = device === "desktop" ? 1280 : 390;
  const scale = Math.min(1, availableWidth / width);
  const height = fitViewport && !expanded && availableHeight && scale > 0 ? Math.floor(availableHeight / scale) : 860;

  useEffect(() => {
    if (!expanded) return;
    const focused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose?.(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(previewContainer.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),iframe') ?? []);
      const insideFrame = event.currentTarget === root?.ownerDocument;
      const frameControls = Array.from(root?.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex="0"]') ?? []);
      if (insideFrame) {
        const active = root?.ownerDocument.activeElement;
        if ((!event.shiftKey && active === frameControls.at(-1)) || (event.shiftKey && active === frameControls[0])) {
          event.preventDefault();
          (event.shiftKey ? controls.at(-2) : controls[0])?.focus();
        }
      } else if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        (frameControls.at(-1) ?? controls.at(-1))?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    root?.ownerDocument.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      root?.ownerDocument.removeEventListener("keydown", onKeyDown);
      focused?.focus();
    };
  }, [expanded, onClose, root]);

  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    const connect = () => {
      const target = iframe.contentDocument?.getElementById("invitation-preview-root");
      if (target) setRoot(target);
    };
    // srcDoc can finish loading before React hydrates and attaches onLoad.
    iframe.addEventListener("load", connect);
    connect();
    return () => iframe.removeEventListener("load", connect);
  }, []);

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => { setAvailableWidth(entry.contentRect.width); setAvailableHeight(entry.contentRect.height); });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!root) return;
    const preview = root.ownerDocument;
    const syncStyles = () => {
      preview.head.querySelectorAll("[data-preview-style]").forEach((node) => node.remove());
      document.querySelectorAll('link[rel="stylesheet"],style').forEach((node) => {
        const copy = node.cloneNode(true) as HTMLElement;
        copy.setAttribute("data-preview-style", "");
        preview.head.appendChild(copy);
      });
    };
    syncStyles();
    const observer = new MutationObserver(syncStyles);
    if (document.head) observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true });
    const navigateWithinPreview = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a");
      const href = link?.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const target = preview.getElementById(href.slice(1));
      if (target) {
        event.preventDefault();
        const reducedMotion = preview.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" });
      }
    };
    preview.addEventListener("click", navigateWithinPreview);
    return () => { observer.disconnect(); preview.removeEventListener("click", navigateWithinPreview); };
  }, [root]);

  const focusTarget = focus?.target;
  const focusFallback = focus?.fallback;
  const focusSequence = focus?.sequence;
  useEffect(() => {
    const view = root?.ownerDocument.defaultView;
    if (!root || !view || !focusTarget) return;
    let active: HTMLElement | undefined;
    let animationFrame = 0;
    const find = (key?: string) => key ? Array.from(root.querySelectorAll<HTMLElement>("[data-invitation-field]"))
      .find(element => element.dataset.invitationField?.split(" ").includes(key)) : undefined;
    const position = (smooth: boolean) => {
      if (!active || !active.getClientRects().length) return;
      const rect = active.getBoundingClientRect();
      const top = view.scrollY + rect.top - Math.max(24, (view.innerHeight - rect.height) / 2);
      // Scroll only the iframe document; never move the form or steal input focus.
      view.scrollTo({ top: Math.max(0, top), behavior: smooth && !view.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
    };
    const resize = new ResizeObserver(() => {
      view.cancelAnimationFrame(animationFrame);
      animationFrame = view.requestAnimationFrame(() => {
        const rect = active?.getBoundingClientRect();
        if (rect && (rect.bottom < 24 || rect.top > view.innerHeight - 24)) position(false);
      });
    });
    const sync = () => {
      const next = find(focusTarget) ?? find(focusFallback);
      if (next === active) return;
      if (active) { active.removeAttribute("data-preview-active"); resize.unobserve(active); }
      active = next;
      if (active) {
        active.setAttribute("data-preview-active", "true");
        resize.observe(active);
        view.cancelAnimationFrame(animationFrame);
        animationFrame = view.requestAnimationFrame(() => position(true));
      }
    };
    sync();
    const mutations = new MutationObserver(sync);
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      resize.disconnect();
      view.cancelAnimationFrame(animationFrame);
      active?.removeAttribute("data-preview-active");
    };
  }, [root, focusTarget, focusFallback, focusSequence, device, height]);

  return <div ref={previewContainer} className={`editor-live-preview${expanded ? " is-expanded" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} aria-label={expanded ? "Vista previa completa" : undefined}>
    {expanded && <div className="editor-expanded-preview-header"><strong>Vista previa completa</strong><button ref={closeButton} type="button" onClick={onClose}>Cerrar vista previa ✕</button></div>}
    <div className="editor-preview-devices" role="group" aria-label="Dispositivo de vista previa">
      <button className="editor-preview-device" type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><FiMonitor aria-hidden="true" />Escritorio</button>
      <button className="editor-preview-device" type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><FiSmartphone aria-hidden="true" />Móvil</button>
      {onExpand && !expanded && <button className="editor-preview-expand" type="button" onClick={onExpand} disabled={expandDisabled} aria-label={expandLabel} title={expandLabel}><FiEye aria-hidden="true" /></button>}
      {publicLink}
    </div>
    {focus && <div className="editor-preview-focus" role="status">
      <span className="editor-preview-focus-icon" aria-hidden="true"><FiEdit3 /></span>
      <span className="editor-preview-focus-copy"><small>Editando ahora</small><strong>{focus.label}</strong></span>
      <span className="editor-preview-focus-live" aria-hidden="true"><i />En vivo</span>
    </div>}
    <div className="editor-preview-viewport" ref={container}>
      <div className="editor-preview-frame-space" style={{ width: width * scale, height: height * scale }}>
        {!root && <p className="editor-preview-loading" role="status">Preparando tu invitación…</p>}
        <iframe ref={frame} title="Vista previa interactiva de tu invitación" srcDoc={previewDocument} style={{ width, height, transform: `scale(${scale})`, visibility: availableWidth ? "visible" : "hidden" }} />
      </div>
    </div>
    {root && createPortal(<>{focus && <style>{`
      #invitation-preview-root [data-preview-active] {
        position: relative;
        isolation: isolate;
        z-index: 1;
      }
      #invitation-preview-root [data-preview-active]::before {
        content: "";
        position: absolute;
        z-index: -1;
        inset: -10px -8px;
        border-radius: 20px;
        background: radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--wa-ink, #fffaf2) 14%, transparent), transparent 78%);
        box-shadow: 0 14px 40px -22px #00000055;
        pointer-events: none;
        animation: preview-focus-reveal 240ms ease-out both;
      }
      #invitation-preview-root [data-preview-active]::after {
        content: "";
        position: absolute;
        bottom: -8px;
        left: calc(50% - 18px);
        width: 36px;
        height: 2px;
        border-radius: 999px;
        background: var(--wa-ink, #fffaf2);
        opacity: .55;
        pointer-events: none;
      }
      @keyframes preview-focus-reveal {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        #invitation-preview-root [data-preview-active]::before { animation: none; }
      }
    `}</style>}{children}</>, root)}
  </div>;
}
