"use client";

import { useEffect, useRef, useState } from "react";
import { BrandLoader } from "@/components/BrandLoader";

export function InvitationExampleFrame({ styleSlug, label, viewportHeight }: {
  styleSlug: string;
  label: string;
  viewportHeight?: number;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const height = viewportHeight ?? 740;

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
    aria-busy={!loaded}
    style={{ aspectRatio: `390 / ${height}` }}
  >
    {!loaded && <BrandLoader className="invitation-example-loader" message="Preparando tu invitación…" />}
    <div>
      <iframe
        title={`Invitación de ejemplo · ${label}`}
        src={`/ejemplo-invitacion/${styleSlug}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        tabIndex={!loaded ? -1 : undefined}
        aria-hidden={!loaded || undefined}
        style={{ width: 390, height, opacity: loaded ? 1 : 0, pointerEvents: loaded ? undefined : "none", transform: `scale(${width ? width / 390 : 1})` }}
      />
    </div>
  </div>;
}
