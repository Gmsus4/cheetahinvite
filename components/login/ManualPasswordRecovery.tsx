"use client";

import { type FormEvent, useState } from "react";
import { FiArrowUpRight, FiMail } from "react-icons/fi";

const supportEmail = "cheetahinvite@gmail.com";

export function ManualPasswordRecovery() {
  const [email, setEmail] = useState("");
  const [prepared, setPrepared] = useState(false);
  const body = [
    "Hola, equipo de Cheetah Invite:",
    "",
    "Motivo: recuperar mi contraseña.",
    `Correo electrónico de mi cuenta: ${email.trim().toLowerCase()}`,
    "",
    "Solicito un código para comprobar que tengo acceso al correo de mi cuenta. Responderé a su mensaje con ese código para continuar con la recuperación y recibir una nueva contraseña.",
    "",
    "Gracias.",
  ].join("\n");
  const mailto = `mailto:${supportEmail}?${new URLSearchParams({ subject: "Recuperación de contraseña — Cheetah Invite", body }).toString().replace(/\+/g, "%20")}`;

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPrepared(true);
    window.location.href = mailto;
  }

  return <section className="manual-recovery" aria-labelledby="manual-recovery-title">
    <h3 id="manual-recovery-title">Recuperar con ayuda del equipo</h3>
    <p>Escríbenos desde el correo con el que registraste tu cuenta a <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
    <ol>
      <li>Indica que necesitas recuperar tu contraseña y el correo electrónico de tu cuenta.</li>
      <li>El equipo enviará un código de verificación al correo registrado.</li>
      <li>Responde a ese mensaje con el código recibido para comprobar que tienes acceso a tu correo.</li>
      <li>Una vez verificado, el equipo te asignará una nueva contraseña y te la enviará al correo de tu cuenta.</li>
    </ol>
    <form className="login-form" onSubmit={prepareEmail}>
      <label htmlFor="manual-recovery-email">Correo electrónico de tu cuenta</label>
      <div className="login-input-wrap"><FiMail aria-hidden="true" /><input id="manual-recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); setPrepared(false); }} placeholder="tu@correo.com" /></div>
      <button className="button login-submit" type="submit">Preparar correo para soporte <FiArrowUpRight aria-hidden="true" /></button>
      <p className="manual-recovery-note">Se abrirá tu aplicación de correo con el mensaje preparado. Revísalo y envíalo para iniciar la solicitud. Nunca incluyas tu contraseña actual.</p>
      {prepared && <p role="status" className="recovery-result">Si no se abrió tu aplicación, escribe directamente a <a href={`mailto:${supportEmail}`}>{supportEmail}</a> con el asunto «Recuperación de contraseña» e incluye el correo de tu cuenta. La solicitud se inicia cuando envías el mensaje.</p>}
    </form>
  </section>;
}
