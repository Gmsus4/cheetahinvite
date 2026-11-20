import { InvitationNavigation } from "@/components/dashboard/InvitationNavigation";
import { Suspense } from "react";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { FiCreditCard, FiImage, FiUsers } from "react-icons/fi";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { canEditInvitation, draftDeletionDate } from "@/lib/invitation-lifecycle";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BrandLoader } from "@/components/BrandLoader";
import { InvitationPrivacySettings } from "@/components/dashboard/InvitationPrivacySettings";
import { InvitationActionLink } from "@/components/dashboard/InvitationActionLink";
import { InvitationTerm } from "@/components/dashboard/InvitationTerm";
import styles from "@/components/dashboard/InvitationSettings.module.css";

export const metadata = { title: "Ajustes de la invitación | Soccasion" };
export default function InvitationSettingsPage({ params }: PageProps<"/dashboard/eventos/[id]/ajustes">) {
  return <Suspense fallback={<BrandLoader message="Abriendo ajustes…" />}><SettingsData params={params} /></Suspense>;
}
async function SettingsData({ params }: Pick<PageProps<"/dashboard/eventos/[id]/ajustes">, "params">) {
  await connection();
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${id}/ajustes`)}`);
  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id }, select: { name: true, imageUrl: true, privacy: true, privacyVersion: true, pinHash: true, paidAt: true, complimentaryAt: true, expiresAt: true, status: true, isExample: true, stripePaymentIntentId: true, draftLastSavedAt: true } });
  if (!event) notFound();
  const editable = canEditInvitation(event);
  // eslint-disable-next-line react-hooks/purity -- Request-time server clock.
  const now = Date.now();
  const deletesAt = draftDeletionDate(event);
  const termEvent = { id, status: event.status, paidAt: event.paidAt, complimentaryAt: event.complimentaryAt, expiresAt: event.expiresAt, isExample: event.isExample, stripePaymentIntentId: event.stripePaymentIntentId };
  return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} />
    <div className={styles.content}>
      <InvitationNavigation eventId={id} />
      <header className={styles.heading}><span className={styles.eyebrow}>TU INVITACIÓN</span><h1>Ajustes de la invitación</h1><div className={styles.eventIdentity}><span className={styles.eventThumbnail}>{event.imageUrl ? <Image src={event.imageUrl} alt="" width={40} height={40} unoptimized /> : <FiImage aria-hidden="true" />}</span><p>{event.name}</p></div></header>
      <div className={styles.grid}>
        {editable && <InvitationPrivacySettings eventId={id} initialPrivacy={event.privacy} initialVersion={event.privacyVersion} hasPin={Boolean(event.pinHash)} />}
        <div className={styles.sidebar}>
          {deletesAt && <section className={styles.termSection} aria-labelledby="draft-retention-heading">
            <h2 id="draft-retention-heading">Conservación del borrador</h2>
            <p className={styles.hint}>Eliminación prevista: <strong>{new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" }).format(deletesAt)}</strong>.</p>
            {deletesAt.getTime() <= now && <p className={styles.hint} role="status">Este borrador está pendiente de eliminación por inactividad.</p>}
            <p className={styles.hint}>Guarda cambios para conservarlo otros seis meses. Abrirlo o iniciar sesión no reinicia el plazo. Esta eliminación por inactividad aplica mientras siga sin pagar.</p>
          </section>}
          <section className={styles.termSection} aria-labelledby="invitation-term-heading">
            <h2 id="invitation-term-heading">Vigencia y renovación</h2>
            {event.expiresAt && (event.paidAt || event.complimentaryAt) ? <InvitationTerm event={termEvent} now={now} compact /> : <p className={styles.hint}>Tu año de vigencia comenzará cuando se confirme el pago. Después tendrás un mes de archivo para renovar antes de la eliminación automática.</p>}
          </section>
          {!editable && <p className={styles.hint} role="status">Los cambios de esta invitación están desactivados. Revisa su estado en Pago y soporte.</p>}
          <nav className={styles.links} aria-label="Administrar invitación">
            <InvitationActionLink href={`/dashboard/eventos/${id}/asistencias`} title="Confirmaciones de asistencia" description="Consulta respuestas y acompañantes." icon={<FiUsers />} tone="lavender" compact />
            <InvitationActionLink href={`/dashboard/eventos/${id}/pago`} title="Pago y soporte" description="Revisa tu compra y encuentra ayuda." icon={<FiCreditCard />} compact />
          </nav>
        </div>
      </div>
    </div>
  </main>;
}
