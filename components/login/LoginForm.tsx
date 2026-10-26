"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FiArrowUpRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
        redirectTo: "/dashboard",
      });

      if (result?.error) {
        setMessage("No encontramos una cuenta con esos datos. Revisa tu correo y contraseña.");
        return;
      }

      window.location.assign(result?.url ?? "/");
    } catch {
      setMessage("No pudimos conectar con el servicio. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }

  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="login-email">Correo electrónico</label>
      <div className="login-input-wrap">
        <FiMail aria-hidden="true" />
        <input
          autoComplete="email"
          id="login-email"
          name="email"
          placeholder="tu@correo.com"
          required
          type="email"
        />
      </div>

      <div className="login-password-heading">
        <label htmlFor="login-password">Contraseña</label>
        <Link className="login-forgot-password" href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
      </div>
      <div className="login-input-wrap">
        <FiLock aria-hidden="true" />
        <input
          autoComplete="current-password"
          id="login-password"
          name="password"
          placeholder="Tu contraseña"
          required
          type={showPassword ? "text" : "password"}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </div>

      <button className="button login-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
        {!isSubmitting && <FiArrowUpRight aria-hidden="true" />}
      </button>
      <p className="login-notice" role="status" aria-live="polite">
        {message || ""}
      </p>
      <p className="login-security">
        <FiLock aria-hidden="true" /> Tu información se mantiene privada y segura.
      </p>
    </form>
  );
}
