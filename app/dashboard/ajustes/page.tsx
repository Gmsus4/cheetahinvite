import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { FiArrowUpRight, FiCheck, FiHelpCircle, FiLock, FiMail, FiShield, FiUser } from "react-icons/fi";
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
      <div className={styles.heading}><span className={styles.eyebrow}>TU ESPACIO · TU CUENTA</span><h1>Ajustes de cuenta</h1><p>Consulta tus datos y las opciones de acceso a tu espacio para celebrar.</p></div>
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="account-details-heading">
          <div className={styles.sectionHeading}><span className={styles.icon}><FiUser aria-hidden="true" /></span><div><span className={styles.eyebrow}>TUS DATOS</span><h2 id="account-details-heading">Información de tu cuenta</h2></div></div>
          <div className={styles.profile}><span className={styles.avatar} aria-hidden="true">{initials}</span><div><strong>{name}</strong><span>Tu cuenta de Cheetah Invite</span></div></div>
          <dl className={styles.details}><div><dt><FiUser aria-hidden="true" /> Nombre</dt><dd>{account.name || "Sin nombre"}</dd></div><div><dt><FiMail aria-hidden="true" /> Correo electrónico</dt><dd>{account.email || "Sin correo registrado"}</dd></div></dl>
        </section>
        <section className={styles.card} aria-labelledby="account-security-heading">
          <div className={styles.sectionHeading}><span className={styles.icon}><FiShield aria-hidden="true" /></span><div><span className={styles.eyebrow}>TU ACCESO</span><h2 id="account-security-heading">Acceso y seguridad</h2></div></div>
          <div className={styles.methods}>{account.passwordHash && <span><FiLock aria-hidden="true" /> Correo y contraseña</span>}{usesGoogle && <span><FiCheck aria-hidden="true" /> Cuenta de Google</span>}</div>
          {account.passwordHash ? <><p>Para cambiar tu contraseña, solicita un enlace de recuperación en el correo de tu cuenta.</p><Link className={styles.primary} href="/recuperar-contrasena"><FiLock aria-hidden="true" /> Cambiar contraseña <FiArrowUpRight aria-hidden="true" /></Link></> : <p>{usesGoogle ? "Inicias sesión con Google. Gestiona tu contraseña y la seguridad de acceso desde tu cuenta de Google." : "Contacta con soporte si necesitas ayuda con tu acceso."}</p>}
        </section>
      </div>
      <aside className={styles.help}><span className={styles.helpIcon}><FiHelpCircle aria-hidden="true" /></span><div><h2>Estamos para ayudarte</h2><p>Si tienes un problema con tus datos o con el acceso a tu cuenta, escríbenos.</p></div><Link href="/ayuda">Ayuda con mi cuenta <FiArrowUpRight aria-hidden="true" /></Link></aside>
      <footer className={styles.footer}><span>Todo listo para celebrar contigo.</span><nav aria-label="Información legal"><Link href="/terminos">Términos y condiciones</Link><Link href="/aviso-de-privacidad">Privacidad</Link></nav></footer>
    </div>
  </main>;
}
