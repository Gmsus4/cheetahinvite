import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { FiCreditCard, FiUsers } from "react-icons/fi";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BrandLoader } from "@/components/BrandLoader";
import { InvitationPrivacySettings } from "@/components/dashboard/InvitationPrivacySettings";
import { InvitationActionLink } from "@/components/dashboard/InvitationActionLink";
import styles from "@/components/dashboard/InvitationSettings.module.css";

export const metadata = { title: "Ajustes de la invitación | Cheetah Invite" };
export default function InvitationSettingsPage({ params }: PageProps<"/dashboard/eventos/[id]/ajustes">) {
  return <Suspense fallback={<BrandLoader message="Abriendo ajustes…" />}><SettingsData params={params} /></Suspense>;
}
async function SettingsData({ params }: Pick<PageProps<"/dashboard/eventos/[id]/ajustes">, "params">) {
  await connection();
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${id}/ajustes`)}`);
  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id }, select: { name: true, privacy: true, privacyVersion: true, pinHash: true } });
  if (!event) notFound();
  return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} />
    <div className={styles.content}>
      <header className={styles.heading}><span className={styles.eyebrow}>TU INVITACIÓN · AJUSTES</span><h1>Todo bajo tu control</h1><p>{event.name}</p></header>
      <div className={styles.grid}><InvitationPrivacySettings eventId={id} initialPrivacy={event.privacy} initialVersion={event.privacyVersion} hasPin={Boolean(event.pinHash)} />
        <nav className={styles.links} aria-label="Administrar invitación">
          <InvitationActionLink href={`/dashboard/eventos/${id}/asistencias`} title="Confirmaciones de asistencia" description="Consulta respuestas y acompañantes." icon={<FiUsers />} tone="lavender" />
          <InvitationActionLink href={`/dashboard/eventos/${id}/pago`} title="Pago y soporte" description="Revisa tu compra y encuentra ayuda." icon={<FiCreditCard />} />
        </nav>
      </div>
    </div>
  </main>;
}
