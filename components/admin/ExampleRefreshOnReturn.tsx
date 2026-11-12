"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ExampleRefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    let frame: number | undefined;
    function refresh() {
      if (document.visibilityState !== "visible" || frame !== undefined) return;
      // Returning from the design tab can dispatch both events together.
      frame = window.requestAnimationFrame(() => {
        frame = undefined;
        router.refresh();
      });
    }
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return null;
}
