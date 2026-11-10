"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { FiCheck, FiChevronDown, FiMinus, FiPlus, FiUsers, FiX } from "react-icons/fi";
import { RSVP_LIMITS, rsvpCompanionLimit, validRsvpToken, type RsvpValues } from "@/lib/rsvp";

export function RsvpForm({ eventId, maxCompanions = 5 }: { eventId?: string; maxCompanions?: number }) {
  const maximum = rsvpCompanionLimit(maxCompanions);
  const id = useId();
  const token = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [companions, setCompanions] = useState(0);
  const [showCompanions, setShowCompanions] = useState(false);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const endpoint = eventId ? `/api/events/${encodeURIComponent(eventId)}/rsvp` : "";

  useEffect(() => {
    if (!eventId) return;
    const abort = new AbortController();
    async function load() {
      try {
        const stored = window.localStorage.getItem(`cheetahinvite:rsvp:${eventId}`);
        if (!validRsvpToken(stored)) return;
        token.current = stored;
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${stored}` }, cache: "no-store", signal: abort.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No pudimos consultar tu respuesta anterior.");
        const previous: RsvpValues | null = data.response;
        if (previous) {
          setName(previous.name); setAttending(previous.attending); setCompanions(previous.companions); setShowCompanions(previous.companions > 0);
          setNotice("Ya tenemos tu respuesta. Puedes actualizarla aquí.");
        }
      } catch (failure) {
        if (abort.signal.aborted) return;
        if (failure instanceof DOMException && failure.name === "SecurityError") setStorageWarning(true);
        else setError(failure instanceof Error ? failure.message : "No pudimos consultar tu respuesta anterior.");
      } finally { if (!abort.signal.aborted) setLoading(false); }
    }
    void load();
    return () => { abort.abort(); controller.current?.abort(); };
  }, [endpoint, eventId]);

  function choose(value: boolean) {
    setAttending(value); setNotice(""); setError("");
    if (!value) { setCompanions(0); setShowCompanions(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading) return;
    if (attending === null) { setError("Elige si asistirás o no podrás acompañarnos."); return; }
    if (attending && companions > maximum) { setError(`El límite actual es de ${maximum} acompañantes. Ajusta tu respuesta antes de guardarla.`); return; }
    if (!eventId) { setNotice("Vista previa: aquí se guardará la respuesta cuando la invitación esté publicada."); return; }
    setError(""); setNotice(""); setSaving(true);
    try {
      if (!token.current) {
        if (!window.crypto?.getRandomValues) throw new Error("Abre el enlace seguro de la invitación en un navegador actualizado para confirmar tu asistencia.");
        const bytes = new Uint8Array(32);
        window.crypto.getRandomValues(bytes);
        token.current = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
        try { window.localStorage.setItem(`cheetahinvite:rsvp:${eventId}`, token.current); }
        catch { setStorageWarning(true); }
      }
      // Reuse this private browser key on retries, even if a response is lost.
      controller.current = new AbortController();
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.current.signal,
        body: JSON.stringify({ token: token.current, name, attending, companions: attending ? companions : 0, website: new FormData(event.currentTarget).get("website") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pudimos guardar tu respuesta.");
      setName(data.response.name);
      setNotice(attending ? `¡Gracias! Registramos ${1 + companions} ${companions ? "asistentes" : "asistente"}.` : "Gracias por avisarnos que no podrás asistir.");
    } catch (failure) {
      if (controller.current?.signal.aborted) return;
      setError(failure instanceof Error ? failure.message : "No pudimos guardar tu respuesta. Inténtalo de nuevo.");
    } finally { setSaving(false); }
  }
  return <form className="invite-rsvp-form" onSubmit={submit} aria-label="Confirmar asistencia" aria-busy={loading || saving}>
    {!eventId && <p className="invite-rsvp-note">Vista previa del formulario. No se enviarán respuestas.</p>}
    <div className="invite-rsvp-field"><label htmlFor={`${id}-name`}>Tu nombre y apellido</label>
      <input id={`${id}-name`} name="name" type="text" autoComplete="name" placeholder="Escribe tu nombre completo" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={RSVP_LIMITS.nameLength} disabled={loading || saving} />
    </div>
    <div className="invite-rsvp-honeypot" aria-hidden="true"><label htmlFor={`${id}-website`}>Sitio web</label><input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" /></div>
    <fieldset className="invite-rsvp-attendance"><legend>¿Podremos contar contigo?</legend><div className="invite-rsvp-choices">
      <button className="invite-rsvp-button invite-rsvp-choice" type="button" aria-pressed={attending === true} onClick={() => choose(true)} disabled={loading || saving}><span className="invite-rsvp-choice-icon" aria-hidden="true"><FiCheck /></span><span>Sí asistiré</span></button>
      <button className="invite-rsvp-button invite-rsvp-choice" type="button" aria-pressed={attending === false} onClick={() => choose(false)} disabled={loading || saving}><span className="invite-rsvp-choice-icon" aria-hidden="true"><FiX /></span><span>No asistiré</span></button>
    </div></fieldset>
    {attending && maximum === 0 && <p className="invite-rsvp-note">Esta invitación es individual, sin acompañantes extra.</p>}
    {attending && companions > maximum && <p className="invite-rsvp-error" role="alert">El organizador cambió el límite a {maximum}. Tu respuesta anterior se conserva; reduce los acompañantes antes de actualizarla.</p>}
    {attending && (maximum > 0 || companions > 0) && <>
      <button className="invite-rsvp-button invite-rsvp-companions-toggle" type="button" aria-expanded={showCompanions} aria-controls={`${id}-companions`} onClick={() => setShowCompanions(shown => !shown)} disabled={saving}>
        <FiUsers aria-hidden="true" /><span className="invite-rsvp-companions-copy"><strong>Acompañantes{companions > 0 ? ` (${companions})` : ""}</strong><small>Puedes sumar hasta {maximum} {maximum === 1 ? "persona" : "personas"}.</small></span><FiChevronDown className="invite-rsvp-chevron" aria-hidden="true" />
      </button>
      <div id={`${id}-companions`} hidden={!showCompanions} className="invite-rsvp-companions">
        <div className="invite-rsvp-companions-heading"><span>Acompañantes extra</span><small>Máximo {maximum}</small></div><div className="invite-rsvp-counter">
          <button type="button" aria-label="Quitar acompañante" onClick={() => setCompanions(count => Math.max(0, count - 1))} disabled={saving || companions === 0}><FiMinus aria-hidden="true" /></button>
          <output aria-live="polite" aria-label="Número de acompañantes extra">{companions}</output>
          <button type="button" aria-label="Agregar acompañante" onClick={() => setCompanions(count => Math.min(maximum, count + 1))} disabled={saving || companions >= maximum}><FiPlus aria-hidden="true" /></button>
        </div>
      </div>
      <p className="invite-rsvp-total">Contándote a ti<span>{1 + companions} {companions ? "personas" : "persona"}</span></p>
    </>}
    {loading && <p role="status">Consultando tu respuesta…</p>}
    {error && <p className="invite-rsvp-error" role="alert">{error}</p>}
    {notice && <p className="invite-rsvp-success" role="status">{notice}</p>}
    <button className="invite-rsvp-button invite-rsvp-submit" type="submit" disabled={loading || saving}>{saving ? "Guardando…" : "Guardar confirmación"}</button>
    <small>Tu nombre y respuesta solo serán visibles para el organizador. <Link href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer">Aviso de privacidad</Link>.</small>
    {storageWarning && <small>Este navegador no permite recordar tu respuesta. Si cierras o recargas esta página, podrías registrarte de nuevo.</small>}
  </form>;
}
