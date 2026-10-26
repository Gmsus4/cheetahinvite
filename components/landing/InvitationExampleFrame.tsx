"use client";

import { useEffect, useRef, useState } from "react";
import { BrandLoader } from "@/components/BrandLoader";

export function InvitationExampleFrame({ styleSlug, label, decorationOnly = false, viewportHeight }: {
  styleSlug: string;
  label: string;
  decorationOnly?: boolean;
  viewportHeight?: number;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const decorationObserver = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [decorationHeight, setDecorationHeight] = useState(400);
  const height = viewportHeight ?? (decorationOnly ? decorationHeight : 740);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => {
      observer.disconnect();
      decorationObserver.current?.disconnect();
    };
  }, []);

  return <div
    ref={viewport}
    className="invitation-example-viewport"
    aria-busy={!loaded}
    style={{ aspectRatio: `390 / ${height}` }}
    role={decorationOnly ? "img" : undefined}
    aria-label={decorationOnly ? `Invitación de boda con decoración ${label}` : undefined}
  >
    {!loaded && <BrandLoader className="invitation-example-loader" message="Preparando tu invitación…" />}
    <div inert={decorationOnly || undefined} aria-hidden={decorationOnly || undefined}>
      <iframe
        title={`Invitación de ejemplo · ${label}`}
        src={`/ejemplo-invitacion/${styleSlug}${decorationOnly ? "?vista=decoracion" : ""}`}
        loading="lazy"
        onLoad={(event) => {
          setLoaded(true);
          decorationObserver.current?.disconnect();
          if (!decorationOnly || viewportHeight !== undefined) return;
          const welcome = event.currentTarget.contentDocument?.querySelector(".invite-welcome");
          if (!welcome) return;
          // Follow the actual section, including changes after its fonts load.
          const updateHeight = () => setDecorationHeight(Math.ceil(welcome.getBoundingClientRect().height));
          decorationObserver.current = new ResizeObserver(updateHeight);
          decorationObserver.current.observe(welcome);
          updateHeight();
        }}
        tabIndex={decorationOnly || !loaded ? -1 : undefined}
        aria-hidden={!loaded || undefined}
        style={{ width: 390, height, opacity: loaded ? 1 : 0, pointerEvents: loaded ? undefined : "none", transform: `scale(${width ? width / 390 : 1})` }}
      />
    </div>
  </div>;
}
