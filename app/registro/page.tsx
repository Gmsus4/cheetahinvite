import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { authDestinationFromRequest } from "@/lib/auth-destination-server";
import Image from "next/image";
import Link from "next/link";
import { AuthAccountSwitch } from "@/components/login/AuthAccountSwitch";
import { BrandWordmark } from "@/components/BrandWordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RegisterForm } from "@/components/login/RegisterForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import styles from "../login/login-split.module.css";
import "../login/login.css";

export const metadata: Metadata = {
  title: "Crear cuenta | Soccasion",
  description: "Crea tu cuenta para diseñar y administrar invitaciones digitales.",
};

export default function RegisterPage(props: PageProps<"/registro">) {
  return <Suspense fallback={<BrandLoader message="Preparando el registro…" />}><RegisterContent {...props} /></Suspense>;
}

async function RegisterContent({ searchParams }: PageProps<"/registro">) {
  const redirectTo = await authDestinationFromRequest((await searchParams).callbackUrl);
  return (
    <main className={`${styles.page} ${styles.registerPage}`}>
      <section className={styles.formPanel} aria-labelledby="register-title">
        <div className={styles.identity}>
          <ThemeToggle variant="subtle" />
        </div>

        <div className={styles.content}>
          <Link className={styles.brand} href="/" aria-label="Soccasion, inicio">
            <BrandWordmark priority compact />
          </Link>
          <h1 id="register-title">Tu gran día<br />empieza aquí.</h1>
          <p className={styles.description}>Crea tu cuenta gratis y dale vida a tu invitación.</p>
          <GoogleSignInButton redirectTo={redirectTo} />
          <div className={styles.divider}><span>o regístrate con tu correo</span></div>
          <RegisterForm redirectTo={redirectTo} />
          <AuthAccountSwitch mode="register" redirectTo={redirectTo} inline className={styles.signup} />
        </div>

        <p className={styles.legal}>
          Al continuar, aceptas nuestros <Link href="/terminos">Términos y condiciones</Link> y <Link href="/aviso-de-privacidad">Aviso de privacidad</Link>.
        </p>
      </section>

      <aside className={styles.visual} aria-labelledby="register-visual-title">
        <Image
          className={styles.photo}
          src="/demo/boda/celebracion.webp"
          alt="Mesas de celebración en un jardín iluminado al atardecer"
          fill
          sizes="(max-width: 760px) 100vw, 48vw"
          loading="eager"
          unoptimized
        />
        <span className={styles.visualKicker}>EMPIEZA A CELEBRAR</span>
        <div className={styles.visualCopy}>
          <h2 id="register-visual-title">Cada gran día<br />merece una invitación única.</h2>
          <p>Haz espacio para los momentos que quieres compartir.</p>
        </div>
      </aside>
    </main>
  );
}
