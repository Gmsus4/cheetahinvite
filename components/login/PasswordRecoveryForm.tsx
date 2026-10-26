"use client";

import Link from "next/link";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { FiArrowUpRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";

const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
const getToken = () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
const serverToken = () => null;

export function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const token = useSyncExternalStore(subscribe, getToken, serverToken);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const invalid = reset && token !== null && !/^[a-f0-9]{64}$/.test(token);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");
    setError("");
    setMessage("");
    if (reset && password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/password/${reset ? "reset" : "forgot"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset ? { token, password, confirmPassword } : { email: data.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "No pudimos procesar tu solicitud. Intenta nuevamente."); return; }
      if (reset) {
        setSuccess(true);
        window.history.replaceState(null, "", window.location.pathname);
      } else setMessage(result.message);
    } catch { setError("No pudimos conectar. Revisa tu conexión e intenta nuevamente."); }
    finally { setBusy(false); }
  }

  if (success) return <div role="status" className="recovery-result"><p>Tu contraseña se actualizó. Inicia sesión con tu nueva contraseña.</p><Link className="button login-submit" href="/login">Iniciar sesión <FiArrowUpRight aria-hidden="true" /></Link></div>;
  if (invalid) return <div className="recovery-result"><p role="alert">Este enlace no es válido. Solicita un nuevo enlace para recuperar tu cuenta.</p><Link className="button login-submit" href="/recuperar-contrasena">Solicitar otro enlace <FiArrowUpRight aria-hidden="true" /></Link></div>;

  return <>
    <form className="login-form" onSubmit={submit} aria-busy={busy}>
      {reset ? <>
        <label htmlFor="recovery-password">Nueva contraseña</label>
        <div className="login-input-wrap">
          <FiLock aria-hidden="true" />
          <input id="recovery-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required placeholder="Entre 12 y 128 caracteres" aria-describedby="recovery-password-help" disabled={busy} />
          <button type="button" className="password-toggle" aria-label={showPassword ? "Ocultar contraseñas" : "Mostrar contraseñas"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>
        </div>
        <small id="recovery-password-help" className="recovery-password-help">Usa entre 12 y 128 caracteres.</small>
        <div className="login-password-heading"><label htmlFor="recovery-confirm">Confirma tu nueva contraseña</label></div>
        <div className="login-input-wrap"><FiLock aria-hidden="true" /><input id="recovery-confirm" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy} /></div>
      </> : <>
        <label htmlFor="recovery-email">Correo electrónico</label>
        <div className="login-input-wrap"><FiMail aria-hidden="true" /><input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="tu@correo.com" disabled={busy} /></div>
      </>}
      <button className="button login-submit" type="submit" disabled={busy || (reset && token === null)}>{busy ? "Procesando…" : reset ? "Guardar nueva contraseña" : "Enviar enlace de recuperación"}<FiArrowUpRight aria-hidden="true" /></button>
      {error && <div role="alert" className="login-notice">{error}{reset && <p><Link href="/recuperar-contrasena">Solicitar otro enlace</Link></p>}</div>}
      {message && <p role="status" className="recovery-result">{message} Puedes solicitar hasta 3 enlaces por hora; si ya lo hiciste, utiliza el más reciente o inténtalo más tarde.</p>}
    </form>
    <p className="login-help">{reset ? <Link href="/recuperar-contrasena">Solicitar un nuevo enlace</Link> : <>¿Te registraste con Google? <Link href="/login">Continúa con Google</Link>.</>}</p>
    <p className="login-help"><Link href="/login">Volver a iniciar sesión</Link></p>
  </>;
}
