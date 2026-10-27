import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { BrandLoader } from "@/components/BrandLoader";

export const metadata: Metadata = { title: "Ajustes de cuenta | Cheetah Invite" };
export default function AccountSettingsPage() {
  return <Suspense fallback={<BrandLoader message="Cargando tu cuenta…" />}><AccountSettings /></Suspense>;
}
async function AccountSettings() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard%2Fajustes");
  const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, passwordHash: true, accounts: { select: { provider: true } } } });
  if (!account) redirect("/login");
  return <main className="purchase-history">
    <Link className="purchase-history-action" href="/dashboard"><FiArrowLeft aria-hidden="true" /> Volver a mis invitaciones</Link>
    <p className="dashboard-eyebrow">TU CUENTA</p><h1>Ajustes de cuenta</h1>
    <section className="purchase-history-card"><h2>Información de tu cuenta</h2><dl className="account-settings-details">
      <dt>Nombre</dt><dd>{account.name || "Sin nombre"}</dd><dt>Correo electrónico</dt><dd>{account.email}</dd>
    </dl></section>
    <section className="purchase-history-card"><h2>Acceso y seguridad</h2>
      {account.passwordHash ? <><p>Para cambiar tu contraseña, solicita un enlace de recuperación en el correo de tu cuenta.</p><Link className="purchase-history-action" href="/recuperar-contrasena">Cambiar contraseña</Link></> : <p>{account.accounts.some(a => a.provider === "google") ? "Inicias sesión con Google. Gestiona tu contraseña y la seguridad de acceso desde tu cuenta de Google." : "Contacta con soporte si necesitas ayuda con tu acceso."}</p>}
    </section>
    <Link className="purchase-history-action" href="/ayuda">Ayuda con mi cuenta</Link>
  </main>;
}
