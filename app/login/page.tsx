import type { Metadata } from "next";
import Image from "next/image";
import { FiArrowLeft } from "react-icons/fi";
import { LoginForm } from "@/components/login/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Iniciar sesión | Cheetah Invite",
  description: "Accede a tu espacio de Cheetah Invite.",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <header className="login-topbar">
        <a className="brand" href="/" aria-label="Cheetah Invite, inicio">
          <Image
            className="brand-mascot"
            src="/cheetah-mascot.png"
            alt=""
            width={40}
            height={44}
            priority
          />
          <span className="brand-name">
            Cheetah<span>Invite</span>
          </span>
        </a>
        <a className="login-back" href="/">
          <FiArrowLeft aria-hidden="true" /> Volver al inicio
        </a>
      </header>

      <div className="login-layout">
        <section className="login-visual" aria-label="Bienvenida">
          <span className="login-kicker">QUÉ BUENO VERTE DE NUEVO</span>
          <h1>
            Tus momentos
            <br />
            especiales,
            <br />
            <em>siempre a la mano.</em>
          </h1>
          <p>
            Entra a tu espacio para continuar creando, editar tus invitaciones
            y mantener cada detalle bajo control.
          </p>
          <div className="login-decoration" aria-hidden="true">
            <div className="login-ticket">
              <span>UNA FECHA PARA RECORDAR</span>
              <strong>Sofía <i>&</i> Mateo</strong>
              <small>12 · OCTUBRE · 2026</small>
              <div className="ticket-rule" />
              <b>ACOMPÁÑANOS</b>
            </div>
            <div className="login-orbit orbit-one" />
            <div className="login-orbit orbit-two" />
          </div>
          <div className="login-visual-footer">CELEBRA CADA HISTORIA</div>
        </section>

        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-form-wrap">
            <span className="login-kicker">TU ESPACIO CHEETAH INVITE</span>
            <h2 id="login-title">Inicia sesión</h2>
            <p className="login-description">
              Ingresa tus datos para volver a tus invitaciones.
            </p>
            <GoogleSignInButton />
            <div className="auth-divider"><span>o inicia con tu correo</span></div>
            <LoginForm />
            <p className="login-help">
              ¿Aún no tienes cuenta? <a href="/registro">Regístrate con tu correo</a>
            </p>
          </div>
          <small className="login-legal">
            Al continuar, aceptas nuestros <a href="/terminos">Términos y condiciones</a> y <a href="/aviso-de-privacidad">Aviso de privacidad</a>.
          </small>
        </section>
      </div>
    </main>
  );
}
