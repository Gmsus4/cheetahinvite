import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { authDestinationFromRequest } from "@/lib/auth-destination-server";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandWordmark } from "@/components/BrandWordmark";
import { LoginForm } from "@/components/login/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthAccountSwitch } from "@/components/login/AuthAccountSwitch";
import styles from "./login-split.module.css";
import "./login.css";

export const metadata: Metadata = {
  title: "Iniciar sesión | Soccasion",
  description: "Accede a tu espacio de Soccasion.",
};

export default function LoginPage(props: PageProps<"/login">) {
  return <Suspense fallback={<BrandLoader message="Preparando el acceso…" />}><LoginContent {...props} /></Suspense>;
}

async function LoginContent({ searchParams }: PageProps<"/login">) {
  const redirectTo = await authDestinationFromRequest((await searchParams).callbackUrl);
  return (
    <main className={styles.page}>
      <section className={styles.formPanel} aria-labelledby="login-title">
        <div className={styles.identity}>
          <ThemeToggle variant="subtle" />
        </div>

        <div className={styles.content}>
          <Link className={styles.brand} href="/" aria-label="Soccasion, inicio">
            <BrandWordmark priority compact />
          </Link>
          <h1 id="login-title">Qué bueno<br />verte de nuevo.</h1>
          <p className={styles.description}>Inicia sesión y sigue preparando ese gran día.</p>
          <GoogleSignInButton redirectTo={redirectTo} />
          <div className={styles.divider}><span>o inicia sesión con tu correo</span></div>
          <LoginForm redirectTo={redirectTo} />
          <AuthAccountSwitch mode="login" redirectTo={redirectTo} inline className={styles.signup} />
        </div>

        <p className={styles.legal}>
          Al continuar, aceptas nuestros <Link href="/terminos">Términos y condiciones</Link> y <Link href="/aviso-de-privacidad">Aviso de privacidad</Link>.
        </p>
      </section>

      <aside className={styles.visual} aria-labelledby="login-visual-title">
        <Image
          className={styles.photo}
          src="/demo/boda/celebracion.webp"
          alt="Mesas de celebración en un jardín iluminado al atardecer"
          fill
          sizes="(max-width: 760px) 100vw, 48vw"
          loading="eager"
          unoptimized
        />
        <span className={styles.visualKicker}>PARA TODO LO QUE MERECE CELEBRARSE</span>
        <div className={styles.visualCopy}>
          <h2 id="login-visual-title">Los mejores días<br />empiezan con un «ven».</h2>
          <p>Tu historia, tu gente y una invitación que los reúne.</p>
        </div>
      </aside>
    </main>
  );
}
