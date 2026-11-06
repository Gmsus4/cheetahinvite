"use client";

import { useEffect, useRef, useState } from "react";
import { BrandLoader } from "@/components/BrandLoader";

export function InvitationExampleFrame({ styleSlug, label, viewportHeight, hideScrollbar = false, loading = "lazy", preview = false }: {
  styleSlug: string;
  label: string;
  viewportHeight?: number;
  hideScrollbar?: boolean;
  loading?: "eager" | "lazy";
  preview?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const height = viewportHeight ?? 740;
  const ready = loaded && width > 0;

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div
    ref={viewport}
    className="invitation-example-viewport"
    aria-busy={!ready}
    style={{ aspectRatio: `390 / ${height}` }}
  >
    {!ready && <BrandLoader className="invitation-example-loader" message="Preparando tu invitación…" />}
    <iframe
      title={`Invitación de ejemplo · ${label}`}
      src={`/ejemplo-invitacion/${styleSlug}${preview ? "/hero" : ""}`}
      loading={loading}
      onLoad={(event) => {
        const document = event.currentTarget.contentDocument;
        if (hideScrollbar && document) {
          const style = document.createElement("style");
          style.textContent = "html { scrollbar-width: none; } html::-webkit-scrollbar { display: none; }";
          document.head.appendChild(style);
        }
        setLoaded(true);
      }}
      tabIndex={!ready ? -1 : undefined}
      aria-hidden={!ready || undefined}
      style={{ width: 390, height, opacity: ready ? 1 : 0, pointerEvents: ready ? undefined : "none", transform: `scale(${width / 390})` }}
    />
  </div>;
}
