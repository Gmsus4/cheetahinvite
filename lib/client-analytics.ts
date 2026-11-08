"use client";

export function trackLandingEvent(kind: "landing_view" | "example_select", exampleSlug = "") {
  if (navigator.doNotTrack === "1" || ("globalPrivacyControl" in navigator && navigator.globalPrivacyControl)) return;
  try {
    const key = "cheetahinvite:analytics-session";
    let visitor = sessionStorage.getItem(key);
    if (!visitor) { visitor = crypto.randomUUID(); sessionStorage.setItem(key, visitor); }
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, exampleSlug, visitor }), keepalive: true }).catch(() => {});
  } catch { /* Optional measurement must never interrupt the page. */ }
}
