"use client";

import { useEffect, useState } from "react";
import { checkInvitationSlug } from "@/app/dashboard/eventos/[id]/actions";
import { isValidInvitationSlug, normalizeInvitationSlug } from "@/lib/invitation-url";

export function CustomInvitationLinkField({ eventId, ownerId, value, savedValue, suggestion, onChange }: {
  eventId: string; ownerId: string; value: string; savedValue: string | null; suggestion: string; onChange: (value: string) => void;
}) {
  const slug = normalizeInvitationSlug(value);
  const [availability, setAvailability] = useState<{ slug: string; status: "available" | "unavailable" | "error" } | null>(null);
  useEffect(() => {
    if (!slug || !isValidInvitationSlug(slug) || slug === savedValue) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkInvitationSlug(eventId, slug);
        if (!cancelled) setAvailability({ slug, status: result.available ? "available" : "unavailable" });
      } catch {
        if (!cancelled) setAvailability({ slug, status: "error" });
      }
    }, 400);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [eventId, slug, savedValue]);
  const status = !slug ? "empty" : !isValidInvitationSlug(slug) ? "invalid" : slug === savedValue ? "available" : availability?.slug === slug ? availability.status : "checking";
  return <div className="editor-field editor-group-wide editor-custom-link">
    <label htmlFor="custom-slug">Personaliza tu enlace <span>(opcional)</span></label>
    <input id="custom-slug" name="customSlug" maxLength={80} value={value} onChange={(event) => onChange(event.target.value)} onBlur={() => onChange(slug)} placeholder={suggestion || "nuestra-celebracion"} autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="custom-slug-help custom-slug-status" aria-invalid={status === "invalid" || status === "unavailable"} />
    <small id="custom-slug-help" className="editor-field-help">Elige el nombre final del enlace. Ajustamos espacios y acentos automáticamente. Puedes usar el mismo nombre que otra cuenta.</small>
    <code className="editor-custom-link-path">/invitacion/{ownerId}/{slug || "nombre-personalizado"}</code>
    {suggestion && suggestion !== slug && <button className="editor-link-suggestion" type="button" onClick={() => onChange(suggestion)}>Usar sugerencia: {suggestion}</button>}
    <small id="custom-slug-status" className={`editor-field-help link-status-${status}`} role="status" aria-live="polite">{status === "empty" ? "Si lo dejas vacío, conservamos tu enlace actual. Solo se puede compartir después del pago." : status === "invalid" ? "El nombre debe tener entre 2 y 80 caracteres, con letras, números y guiones." : status === "checking" ? "Comprobando disponibilidad…" : status === "available" ? "Enlace disponible en tu cuenta. Guarda los cambios para aplicarlo." : status === "unavailable" ? "Ya tienes otra invitación con ese enlace. Elige otro nombre." : "No pudimos comprobarlo ahora. Lo verificaremos al guardar."}</small>
  </div>;
}
