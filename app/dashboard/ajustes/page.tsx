import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { FiArrowUpRight, FiKey, FiMail, FiMessageCircle, FiShield } from "react-icons/fi";
import { SiGoogle } from "react-icons/si";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { BrandLoader } from "@/components/BrandLoader";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import styles from "./settings.module.css";

export const metadata: Metadata = { title: "Ajustes de cuenta | Cheetah Invite" };
export default function AccountSettingsPage() {
  return <Suspense fallback={<BrandLoader message="Cargando tu cuenta…" />}><AccountSettings /></Suspense>;
}
async function AccountSettings() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard%2Fajustes");
  const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, image: true, passwordHash: true, accounts: { select: { provider: true } } } });
  if (!account) redirect("/login");
  const usesGoogle = account.accounts.some(a => a.provider === "google");
  const name = account.name || session.user.name || "Usuario";
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "C";
  return <main className={styles.page}>
    <DashboardHeader name={name} email={account.email || ""} image={account.image || session.user.image} />
    <div className={styles.content}>
      <div className={styles.heading}><span className={styles.eyebrow}>TU ESPACIO PERSONAL</span><h1>Ajustes de cuenta</h1><p>Tu perfil y tus formas de entrar, en un solo lugar.</p></div>
      <div className={styles.grid}>
        <section className={styles.profileCard} aria-labelledby="account-details-heading">
          <span className={styles.eyebrow}>TU PERFIL</span>
          <div className={styles.profileIdentity}><span className={styles.avatar} aria-hidden="true">{initials}</span><div><h2 id="account-details-heading">{name}</h2><span className={styles.profileCaption}>Tu cuenta de Cheetah Invite</span></div></div>
          <dl className={styles.details}><div><dt><FiMail aria-hidden="true" />Correo de tu cuenta</dt><dd>{account.email || "Sin correo registrado"}</dd></div></dl>
        </section>
        <section className={styles.security} aria-labelledby="account-security-heading">
          <div className={styles.sectionHeading}><span className={styles.securityIcon}><FiShield aria-hidden="true" /></span><div><h2 id="account-security-heading">Acceso y seguridad</h2><p>Así puedes iniciar sesión en tu cuenta.</p></div></div>
          <ul className={styles.methods} aria-label="Métodos de acceso">
            {account.passwordHash && <li><span className={styles.methodIcon}><FiKey aria-hidden="true" /></span><div><strong>Correo y contraseña</strong><span>Usa el correo asociado a tu perfil.</span></div></li>}
            {usesGoogle && <li><span className={styles.methodIcon}><SiGoogle aria-hidden="true" /></span><div><strong>Cuenta de Google</strong><span>Accede con «Continuar con Google».</span></div></li>}
          </ul>
          {account.passwordHash ? <div className={styles.passwordAction}><p>¿Quieres cambiar tu contraseña? Te enviaremos un enlace de recuperación.</p><Link className={styles.primary} href="/recuperar-contrasena">Cambiar contraseña <FiArrowUpRight aria-hidden="true" /></Link></div> : <p className={styles.accessNote}>{usesGoogle ? "Gestiona tu contraseña y seguridad desde tu cuenta de Google." : "Contacta con soporte si necesitas ayuda con tu acceso."}</p>}
        </section>
      </div>
      <aside className={styles.help}><span className={styles.helpIcon}><FiMessageCircle aria-hidden="true" /></span><div><h2>¿Necesitas una mano?</h2><p>Te ayudamos con tus datos o el acceso a tu cuenta.</p></div><Link href="/ayuda">Contactar al equipo <FiArrowUpRight aria-hidden="true" /></Link></aside>
      <footer className={styles.footer}><nav aria-label="Información legal"><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Privacidad</Link></nav></footer>
    </div>
  </main>;
}
