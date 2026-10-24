"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FiArrowUpRight, FiLock, FiMail, FiUser } from "react-icons/fi";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmPassword") ?? "");

    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "No pudimos crear tu cuenta. Intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      const login = await signIn("credentials", {
        email: data.get("email"),
        password,
        redirect: false,
        redirectTo: "/dashboard",
      });

      if (login?.error) {
        router.push("/login?registered=1");
        return;
      }
      window.location.assign(login?.url ?? "/dashboard");
    } catch {
      setMessage("No pudimos conectar con el servicio. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="register-name">Nombre</label>
      <div className="login-input-wrap">
        <FiUser aria-hidden="true" />
        <input autoComplete="name" id="register-name" name="name" placeholder="Tu nombre" minLength={2} maxLength={80} required />
      </div>

      <label className="register-field-label" htmlFor="register-email">Correo electrónico</label>
      <div className="login-input-wrap">
        <FiMail aria-hidden="true" />
        <input autoComplete="email" id="register-email" name="email" placeholder="tu@correo.com" type="email" required />
      </div>

      <label className="register-field-label" htmlFor="register-password">Contraseña</label>
      <div className="login-input-wrap">
        <FiLock aria-hidden="true" />
        <input autoComplete="new-password" id="register-password" name="password" placeholder="Al menos 12 caracteres" type="password" minLength={12} maxLength={128} required />
      </div>

      <label className="register-field-label" htmlFor="register-confirm-password">Confirmar contraseña</label>
      <div className="login-input-wrap">
        <FiLock aria-hidden="true" />
        <input autoComplete="new-password" id="register-confirm-password" name="confirmPassword" placeholder="Escribe tu contraseña de nuevo" type="password" minLength={12} maxLength={128} required />
      </div>

      <button className="button login-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        {!isSubmitting && <FiArrowUpRight aria-hidden="true" />}
      </button>
      <p className="login-notice" role="status" aria-live="polite">{message}</p>
      <p className="register-password-note">Usa al menos 12 caracteres para proteger tu cuenta.</p>
    </form>
  );
}
