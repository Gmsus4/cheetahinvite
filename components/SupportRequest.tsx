"use client";

import { type FormEvent, useId, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { SUPPORT_EMAIL, supportMailto, supportReasons } from "@/lib/support";

export function SupportRequest({ initialEmail = "", eventId = "", eventName = "", paymentId = "" }: { initialEmail?: string; eventId?: string; eventName?: string; paymentId?: string }) {
  const id = useId();
  const [prepared, setPrepared] = useState(false);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const href = supportMailto({
      email: String(data.get("email") || ""),
      eventId: eventId || String(data.get("reference") || "").trim(),
      eventName,
      paymentId,
      reason: String(data.get("reason") || ""),
      message: String(data.get("message") || ""),
    });
    setPrepared(true);
    window.location.href = href;
  }
  return <form className="support-request" onSubmit={prepare}>
    <label htmlFor={`${id}-reason`}>¿En qué podemos ayudarte?</label>
    <select id={`${id}-reason`} name="reason">{supportReasons.map(reason => <option key={reason}>{reason}</option>)}</select>
    <label htmlFor={`${id}-email`}>Correo de tu cuenta</label>
    <input id={`${id}-email`} name="email" type="email" autoComplete="email" defaultValue={initialEmail} required maxLength={254} placeholder="tu@correo.com" />
    {eventId ? <p className="support-reference">Referencia de tu invitación: <strong>{eventId}</strong></p> : <>
      <label htmlFor={`${id}-reference`}>Referencia de la invitación <span>(opcional)</span></label>
      <input id={`${id}-reference`} name="reference" maxLength={100} placeholder="Puedes encontrarla en la pantalla de pago" />
    </>}
    {paymentId && <p className="support-reference">Referencia de compra: <strong>{paymentId}</strong></p>}
    <label htmlFor={`${id}-message`}>Cuéntanos qué ocurrió</label>
    <textarea id={`${id}-message`} name="message" rows={4} maxLength={2000} required placeholder="Describe el problema y cuándo ocurrió." />
    <button className="button" type="submit">Preparar correo para soporte <FiArrowUpRight aria-hidden="true" /></button>
    <p className="support-note">Se abrirá tu aplicación de correo. Revisa el mensaje y envíalo desde el correo de tu cuenta. No incluyas contraseñas, códigos de acceso ni datos completos de tu tarjeta.</p>
    {prepared && <p role="status" className="support-feedback">Si no se abrió tu aplicación, escribe directamente a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Incluye el motivo, el correo de tu cuenta{eventId ? ` y la referencia ${eventId}` : " y la referencia de la invitación, si la tienes"}. La solicitud se inicia cuando envías el correo.</p>}
  </form>;
}
