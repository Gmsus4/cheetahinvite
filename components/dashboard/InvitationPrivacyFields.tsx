"use client";

import { useState } from "react";
import { FiCheck, FiCopy, FiGlobe, FiLock, FiRefreshCw } from "react-icons/fi";
import type { InvitationPrivacy } from "@/lib/invitation-privacy";
import styles from "./InvitationSettings.module.css";

function generatePin() {
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= 4_294_000_000);
  return (values[0] % 1_000_000).toString().padStart(6, "0");
}

export function InvitationPrivacyFields({ privacy, pin, pinPending, hasPin, disabled, onChange }: {
  privacy: InvitationPrivacy; pin: string; pinPending: boolean; hasPin: boolean; disabled: boolean;
  onChange(changes: { privacy?: InvitationPrivacy; pin?: string; pinPending?: boolean }): void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  function select(value: InvitationPrivacy) {
    setCopied(false); setCopyError(false);
    onChange(value === "PUBLIC" ? { privacy: value, pin: "", pinPending: false }
      : { privacy: value, ...(!hasPin && !pin ? { pin: generatePin(), pinPending: true } : {}) });
  }
  return <section className={`${styles.privacy} ${styles.compactPrivacy}`} aria-label="Privacidad de la invitación">
    <div className={styles.sectionHeading}><div><h2>¿Quién puede ver tu invitación?</h2><p>Se guarda al guardar tu invitación o continuar al pago.</p></div></div>
    <div className={styles.choices} role="group" aria-label="Privacidad">
      <button type="button" aria-pressed={privacy === "PUBLIC"} disabled={disabled} onClick={() => select("PUBLIC")}><FiGlobe aria-hidden="true" /><strong>Pública</strong><span>Cualquier persona con el enlace puede verla.</span></button>
      <button type="button" aria-pressed={privacy === "PRIVATE"} disabled={disabled} onClick={() => select("PRIVATE")}><FiLock aria-hidden="true" /><strong>Protegida con PIN</strong><span>Solo se abre al introducir un PIN de seis dígitos.</span></button>
    </div>
    <p className={styles.hint} role="status">{privacy === "UNSET" ? "Elige una opción antes de continuar al pago." : privacy === "PUBLIC" ? "Acceso elegido: público, sin PIN." : "Acceso elegido: protegido con PIN. Compártelo con tus invitados."}</p>
    {privacy === "PRIVATE" && <div className={styles.pinArea}>
      {hasPin && !pinPending && !pin ? <p>Conservaremos tu PIN actual. Por seguridad, no mostramos el PIN guardado.</p> : <>
        <label htmlFor="invitation-access-pin">PIN para tus invitados</label>
        <input id="invitation-access-pin" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" value={pin} disabled={disabled} aria-describedby="invitation-access-pin-help" onChange={event => { setCopied(false); onChange({ pin: event.target.value.replace(/\D/g, ""), pinPending: true }); }} />
        <small id="invitation-access-pin-help">Guarda o copia este PIN antes de continuar. No lo incluimos en el enlace.</small>
        {pinPending && !pin && <small>La copia recuperada conserva la privacidad, pero debes volver a escribir o generar el PIN.</small>}
      </>}
      <button className={styles.textButton} type="button" disabled={disabled} onClick={() => { setCopied(false); setCopyError(false); onChange({ pin: generatePin(), pinPending: true }); }}><FiRefreshCw aria-hidden="true" />{hasPin && !pinPending && !pin ? "Cambiar PIN" : "Generar otro PIN"}</button>
      {pin.length === 6 && <button className={styles.textButton} type="button" disabled={disabled} onClick={async () => {
        try { await navigator.clipboard.writeText(pin); setCopied(true); setCopyError(false); }
        catch { setCopyError(true); }
      }}>{copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}{copied ? "PIN copiado" : "Copiar PIN"}</button>}
      {copyError && <small role="status">Copia el PIN que aparece en pantalla.</small>}
      {hasPin && pinPending && <small>Si cambias el PIN al guardar, tus invitados tendrán que introducir el nuevo.</small>}
    </div>}
  </section>;
}
