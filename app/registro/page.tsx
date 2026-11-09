import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { authDestinationFromRequest } from "@/lib/auth-destination-server";
import Link from "next/link";
import { AuthAccountSwitch } from "@/components/login/AuthAccountSwitch";
import { BrandEmblem } from "@/components/BrandEmblem";
import { RegisterForm } from "@/components/login/RegisterForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import "../login/login.css";

export const metadata: Metadata = {
  title: "Crear cuenta | Cheetah Invite",
  description: "Crea tu cuenta para diseñar y administrar invitaciones digitales.",
};

export default function RegisterPage(props: PageProps<"/registro">) {
  return <Suspense fallback={<BrandLoader message="Preparando el registro…" />}><RegisterContent {...props} /></Suspense>;
}

async function RegisterContent({ searchParams }: PageProps<"/registro">) {
  const redirectTo = await authDestinationFromRequest((await searchParams).callbackUrl);
  return (
    <main className="login-page login-home-style">
      <header className="login-topbar">
        <Link className="brand" href="/" aria-label="Cheetah Invite, inicio">
          <BrandEmblem size={40} priority />
          <span className="brand-name">Cheetah<span>Invite</span></span>
        </Link>
        <AuthAccountSwitch mode="register" redirectTo={redirectTo} />
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
            <div className="login-orbit orbit-one" />
            <div className="login-orbit orbit-two" />
          </div>
          <div className="login-visual-footer">CELEBRA CADA HISTORIA</div>
        </section>

        <section className="login-form-panel register-form-panel" aria-labelledby="register-title">
          <div className="login-form-wrap">
            <span className="login-kicker">TU ESPACIO CHEETAH INVITE</span>
            <h2 id="register-title">Crea tu cuenta</h2>
            <p className="login-description">Regístrate con Google o con tu correo para comenzar a crear.</p>
            <GoogleSignInButton redirectTo={redirectTo} />
            <div className="auth-divider"><span>o regístrate con tu correo</span></div>
            <RegisterForm redirectTo={redirectTo} />
          </div>
          <small className="login-legal">Al continuar, aceptas nuestros <Link href="/terminos">Términos y condiciones</Link> y <Link href="/aviso-de-privacidad">Aviso de privacidad</Link>.</small>
        </section>
      </div>
    </main>
  );
}
