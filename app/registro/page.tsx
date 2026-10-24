import type { Metadata } from "next";
import { FiArrowLeft } from "react-icons/fi";
import { BrandEmblem } from "@/components/BrandEmblem";
import { RegisterForm } from "@/components/login/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta | Cheetah Invite",
  description: "Crea tu cuenta para diseñar y administrar invitaciones digitales.",
};

export default function RegisterPage() {
  return (
    <main className="login-page">
      <header className="login-topbar">
        <a className="brand" href="/" aria-label="Cheetah Invite, inicio">
          <BrandEmblem size={40} priority />
          <span className="brand-name">Cheetah<span>Invite</span></span>
        </a>
        <a className="login-back" href="/"><FiArrowLeft aria-hidden="true" /> Volver al inicio</a>
      </header>

      <div className="login-layout register-layout">
        <section className="login-visual" aria-label="Bienvenida">
          <span className="login-kicker">EMPIEZA A CELEBRAR</span>
          <h1>
            Cada gran día
            <br />
            merece una
            <br />
            <em>invitación única.</em>
          </h1>
          <p>Crea tu cuenta y prepara un espacio especial para cada momento que quieras compartir.</p>
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

        <section className="login-form-panel register-form-panel" aria-labelledby="register-title">
          <div className="login-form-wrap">
            <span className="login-kicker">TU ESPACIO CHEETAH INVITE</span>
            <h2 id="register-title">Crea tu cuenta</h2>
            <p className="login-description">Regístrate con tu correo para comenzar a crear.</p>
            <RegisterForm />
            <p className="login-help">¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
          </div>
          <small className="login-legal">Al continuar, aceptas nuestros <a href="/terminos">Términos y condiciones</a> y <a href="/aviso-de-privacidad">Aviso de privacidad</a>.</small>
        </section>
      </div>
    </main>
  );
}
