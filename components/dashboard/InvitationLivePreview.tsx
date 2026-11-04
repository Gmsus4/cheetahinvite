"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiEye } from "react-icons/fi";

const previewDocument = '<!doctype html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0"><div id="invitation-preview-root"></div></body></html>';

export function InvitationLivePreview({ children, expanded = false, onClose, onExpand, publicLink, initialDevice = "desktop", fitViewport = false }: { children: ReactNode; expanded?: boolean; onClose?: () => void; onExpand?: () => void; publicLink?: ReactNode; initialDevice?: "desktop" | "mobile"; fitViewport?: boolean }) {
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

  return <div ref={previewContainer} className={`editor-live-preview${expanded ? " is-expanded" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} aria-label={expanded ? "Vista previa completa" : undefined}>
    {expanded && <div className="editor-expanded-preview-header"><strong>Vista previa completa</strong><button ref={closeButton} type="button" onClick={onClose}>Cerrar vista previa ✕</button></div>}
    <div className="editor-preview-devices" role="group" aria-label="Dispositivo de vista previa">
      <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Escritorio</button>
      <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>Móvil</button>
      {onExpand && !expanded && <button className="editor-preview-expand" type="button" onClick={onExpand} aria-label="Ampliar vista previa" title="Ampliar vista previa"><FiEye aria-hidden="true" /></button>}
      {publicLink}
    </div>
    <div className="editor-preview-viewport" ref={container}>
      <div className="editor-preview-frame-space" style={{ width: width * scale, height: height * scale }}>
        {!root && <p className="editor-preview-loading" role="status">Preparando tu invitación…</p>}
        <iframe ref={frame} title="Vista previa interactiva de tu invitación" srcDoc={previewDocument} style={{ width, height, transform: `scale(${scale})`, visibility: availableWidth ? "visible" : "hidden" }} />
      </div>
    </div>
    {root && createPortal(children, root)}
  </div>; 
}
