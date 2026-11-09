import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { authDestinationFromRequest } from "@/lib/auth-destination-server";
// import Image from "next/image";
import Link from "next/link";
import { AuthAccountSwitch } from "@/components/login/AuthAccountSwitch";
import { BrandEmblem } from "@/components/BrandEmblem";
import { LoginForm } from "@/components/login/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
// import loginIllustration from "@/public/login.webp";
import "./login.css";

export const metadata: Metadata = {
  title: "Iniciar sesión | Cheetah Invite",
  description: "Accede a tu espacio de Cheetah Invite.",
};

export default function LoginPage(props: PageProps<"/login">) {
  return <Suspense fallback={<BrandLoader message="Preparando el acceso…" />}><LoginContent {...props} /></Suspense>;
}

async function LoginContent({ searchParams }: PageProps<"/login">) {
  const redirectTo = await authDestinationFromRequest((await searchParams).callbackUrl);
  return (
    <main className="login-page login-home-style">
      <header className="login-topbar">
        <Link className="brand" href="/" aria-label="Cheetah Invite, inicio">
          <BrandEmblem size={40} priority />
          <span className="brand-name">
            Cheetah<span>Invite</span>
          </span>
        </Link>
        <AuthAccountSwitch mode="login" redirectTo={redirectTo} />
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
          {/* <div className="login-illustration" aria-hidden="true">
            <Image src={loginIllustration} alt="" sizes="(max-width: 620px) 260px, 380px" loading="eager" />
          </div> */}
          <div className="login-decoration" aria-hidden="true">
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
            <GoogleSignInButton redirectTo={redirectTo} />
            <div className="auth-divider"><span>o inicia con tu correo</span></div>
            <LoginForm redirectTo={redirectTo} />
          </div>
          <small className="login-legal">
            Al continuar, aceptas nuestros <Link href="/terminos">Términos y condiciones</Link> y <Link href="/aviso-de-privacidad">Aviso de privacidad</Link>.
          </small>
        </section>
      </div>
    </main>
  );
}
