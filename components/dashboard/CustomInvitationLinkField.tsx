"use client";

import { useEffect, useState } from "react";
import { checkInvitationSlug } from "@/app/dashboard/eventos/[id]/actions";
import { isValidInvitationSlug, normalizeInvitationSlug } from "@/lib/invitation-url";

export function CustomInvitationLinkField({ eventId, value, savedValue, onChange }: {
  eventId: string; value: string; savedValue: string | null; onChange: (value: string) => void;
}) {
  const slug = normalizeInvitationSlug(value);
  const [availability, setAvailability] = useState<{ slug: string; status: "available" | "unavailable" | "pending" | "error" } | null>(null);
  useEffect(() => {
    if (!slug || !isValidInvitationSlug(slug) || slug === savedValue) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkInvitationSlug(eventId, slug);
        if (!cancelled) setAvailability({ slug, status: result.migrationPending ? "pending" : result.available ? "available" : "unavailable" });
      } catch {
        if (!cancelled) setAvailability({ slug, status: "error" });
      }
    }, 400);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [eventId, slug, savedValue]);
  const status = !slug ? "empty" : !isValidInvitationSlug(slug) ? "invalid" : slug === savedValue ? "available" : availability?.slug === slug ? availability.status : "checking";
  return <div className="editor-field editor-group-wide editor-custom-link">
    <label htmlFor="custom-slug">Personaliza tu enlace <span>(opcional)</span></label>
    <input id="custom-slug" name="customSlug" maxLength={80} value={value} onChange={(event) => onChange(event.target.value)} onBlur={() => onChange(slug)} placeholder="nombre-personalizado" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="custom-slug-help custom-slug-status" aria-invalid={status === "invalid" || status === "unavailable"} aria-busy={status === "checking"} />
    <small id="custom-slug-help" className="editor-field-help">Elige el nombre final del enlace. Ajustamos espacios y acentos automáticamente. Cada enlace es único en la plataforma.</small>
    <code className="editor-custom-link-path">/event/{slug || "nombre-personalizado"}</code>
    {status === "pending" && <button className="editor-link-suggestion" type="button" onClick={() => onChange(savedValue || "")}>Conservar mi enlace actual</button>}
    <small id="custom-slug-status" className={`editor-field-help link-status-${status}`} role="status" aria-live="polite">{status === "empty" ? "Si lo dejas vacío, conservamos tu enlace actual. Solo se puede compartir después del pago." : status === "invalid" ? "El nombre debe tener entre 2 y 80 caracteres, con letras, números y guiones." : status === "checking" ? "Comprobando disponibilidad…" : status === "available" ? "Enlace disponible. Guarda los cambios para aplicarlo." : status === "pending" ? "Puedes guardar el contenido con tu enlace actual. La personalización de enlaces estará disponible en breve." : status === "unavailable" ? "Este enlace ya está ocupado. Elige otro nombre." : "No pudimos comprobarlo ahora. Lo verificaremos al guardar."}</small>
  </div>;
}
