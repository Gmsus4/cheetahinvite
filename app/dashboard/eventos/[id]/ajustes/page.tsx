import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { FiClock, FiCreditCard, FiUsers } from "react-icons/fi";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { canEditInvitation } from "@/lib/invitation-lifecycle";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BrandLoader } from "@/components/BrandLoader";
import { InvitationPrivacySettings } from "@/components/dashboard/InvitationPrivacySettings";
import { InvitationActionLink } from "@/components/dashboard/InvitationActionLink";
import { InvitationTerm } from "@/components/dashboard/InvitationTerm";
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
  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id }, select: { name: true, privacy: true, privacyVersion: true, pinHash: true, paidAt: true, complimentaryAt: true, expiresAt: true, status: true, isExample: true, stripePaymentIntentId: true } });
  if (!event) notFound();
  const editable = canEditInvitation(event);
  // eslint-disable-next-line react-hooks/purity -- Request-time server clock.
  const now = Date.now();
  const termEvent = { id, status: event.status, paidAt: event.paidAt, complimentaryAt: event.complimentaryAt, expiresAt: event.expiresAt, isExample: event.isExample, stripePaymentIntentId: event.stripePaymentIntentId };
  return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} />
    <div className={styles.content}>
      <header className={styles.heading}><span className={styles.eyebrow}>TU INVITACIÓN · AJUSTES</span><h1>Todo bajo tu control</h1><p>{event.name}</p></header>
      <div className={styles.grid}>
        {editable && <InvitationPrivacySettings eventId={id} initialPrivacy={event.privacy} initialVersion={event.privacyVersion} hasPin={Boolean(event.pinHash)} />}
        <div className={styles.sidebar}>
          <section className={styles.privacy} aria-labelledby="invitation-term-heading">
            <div className={styles.sectionHeading}><span className={styles.icon}><FiClock aria-hidden="true" /></span><div><h2 id="invitation-term-heading">Vigencia y renovación</h2><p>Tiempo disponible de tu invitación.</p></div></div>
            {event.expiresAt && (event.paidAt || event.complimentaryAt) ? <InvitationTerm event={termEvent} now={now} compact /> : <p className={styles.hint}>Tu año de vigencia comenzará cuando se confirme el pago. Después tendrás un mes de archivo para renovar antes de la eliminación automática.</p>}
            {!editable && <p className={styles.hint}>Los cambios de esta invitación están desactivados. Revisa su estado en Pago y soporte.</p>}
          </section>
          <nav className={styles.links} aria-label="Administrar invitación">
            <InvitationActionLink href={`/dashboard/eventos/${id}/asistencias`} title="Confirmaciones de asistencia" description="Consulta respuestas y acompañantes." icon={<FiUsers />} tone="lavender" compact />
            <InvitationActionLink href={`/dashboard/eventos/${id}/pago`} title="Pago y soporte" description="Revisa tu compra y encuentra ayuda." icon={<FiCreditCard />} compact />
          </nav>
        </div>
      </div>
    </div>
  </main>;
}
