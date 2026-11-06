"use client";
import { useState } from "react";
import { FiGlobe, FiLock, FiRefreshCw, FiCopy, FiCheck } from "react-icons/fi";
import { saveInvitationPrivacy } from "@/app/dashboard/eventos/[id]/ajustes/actions";
import styles from "./InvitationSettings.module.css";

function generatePin() {
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= 4_294_000_000);
  return (values[0] % 1_000_000).toString().padStart(6, "0");
}

export function InvitationPrivacySettings({ eventId, initialPrivacy = "UNSET", initialVersion = 0, hasPin = false, ensureEvent }: {
  eventId: string; initialPrivacy?: string; initialVersion?: number; hasPin?: boolean; ensureEvent?: () => Promise<string>;
}) {
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [savedPrivacy, setSavedPrivacy] = useState(initialPrivacy);
  const [version, setVersion] = useState(initialVersion);
  const [configuredPin, setConfiguredPin] = useState(hasPin);
  const [pin, setPin] = useState("");
  const [lastPin, setLastPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  function select(value: string) {
    setPrivacy(value); setError(""); setNotice(""); setLastPin("");
    if (value === "PRIVATE" && !configuredPin && !pin) setPin(generatePin());
  }
  async function save() {
    setBusy(true); setError(""); setNotice("");
    try {
      const id = eventId || await ensureEvent?.();
      if (!id) { setError("Guarda primero el borrador de tu invitación."); return; }
      const result = await saveInvitationPrivacy(id, privacy, pin, version);
      if (!result.ok) { setError(result.error); return; }
      setVersion(result.version); setSavedPrivacy(result.privacy); setConfiguredPin(result.hasPin);
      setLastPin(result.privacy === "PRIVATE" ? pin : ""); setPin(""); setCopied(false);
      setNotice(result.privacy === "PRIVATE" ? "Invitación protegida. Comparte el PIN con tus invitados." : "Invitación pública. Se podrá consultar sin PIN cuando esté publicada.");
    } catch { setError("No pudimos guardar los ajustes. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  return <section className={styles.privacy} aria-label="Privacidad de la invitación">
    <div className={styles.sectionHeading}><span className={styles.icon}><FiLock aria-hidden="true" /></span><div><h2>¿Quién puede ver tu invitación?</h2><p>Elige cómo entrarán tus invitados. Puedes cambiarlo cuando quieras.</p></div></div>
    <div className={styles.choices} role="group" aria-label="Privacidad">
      <button type="button" aria-pressed={privacy === "PUBLIC"} disabled={busy} onClick={() => select("PUBLIC")}><FiGlobe aria-hidden="true" /><strong>Pública</strong><span>Cualquier persona con el enlace puede verla.</span></button>
      <button type="button" aria-pressed={privacy === "PRIVATE"} disabled={busy} onClick={() => select("PRIVATE")}><FiLock aria-hidden="true" /><strong>Protegida con PIN</strong><span>Solo se abre al introducir un PIN de seis dígitos.</span></button>
    </div>
    {privacy === "PRIVATE" && <div className={styles.pinArea}>
      {configuredPin && !pin && <p>Ya tienes un PIN configurado. Por seguridad, no mostramos el PIN guardado.</p>}
      {(!configuredPin || pin) && <><label htmlFor={`pin-${eventId || "draft"}`}>PIN para tus invitados</label><input id={`pin-${eventId || "draft"}`} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" value={pin} disabled={busy} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} /><small>Guárdalo y compártelo con tus invitados. No lo incluimos en el enlace.</small></>}
      <button className={styles.textButton} type="button" disabled={busy} onClick={() => { setPin(generatePin()); setLastPin(""); setNotice(""); }}><FiRefreshCw aria-hidden="true" />{configuredPin && !pin ? "Cambiar PIN" : "Generar otro PIN"}</button>
      {configuredPin && pin && <small>Al guardar el cambio, los invitados tendrán que introducir el nuevo PIN.</small>}
    </div>}
    {privacy === "UNSET" && <p className={styles.hint}>Elige una opción antes de publicar tu invitación.</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.success} role="status">{notice}</p>}
    {lastPin && <div className={styles.savedPin}><span>Tu nuevo PIN: <strong>{lastPin}</strong></span><button type="button" className={styles.textButton} onClick={async () => { try { await navigator.clipboard.writeText(lastPin); setCopied(true); } catch { setError("Copia el PIN que aparece en pantalla."); } }}>{copied ? <FiCheck /> : <FiCopy />}{copied ? "Copiado" : "Copiar PIN"}</button><small>Solo lo mostramos aquí después de guardarlo. Si lo olvidas, puedes cambiarlo.</small></div>}
    <button className={styles.primary} type="button" onClick={() => void save()} disabled={busy || privacy === "UNSET" || (privacy === savedPrivacy && !pin) || (privacy === "PRIVATE" && (!configuredPin || Boolean(pin)) && pin.length !== 6)}>{busy ? "Guardando…" : "Guardar privacidad"}</button>
  </section>;
}
