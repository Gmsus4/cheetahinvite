import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiArrowUpRight, FiCheck, FiChevronDown, FiCreditCard, FiEye, FiLock } from "react-icons/fi";
import { invitationPath } from "@/lib/invitation-url";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { paymentProviderConfigured } from "@/lib/payment-providers";
import { reconcilePurchase } from "@/lib/payment-reconciliation";
import { PaymentMethods } from "@/components/dashboard/PaymentMethods";
import { isInvitationPublished } from "@/lib/invitation-payment";
import { canRenewInvitation, invitationLifecycle } from "@/lib/invitation-lifecycle";
import { InvitationDateNotice } from "@/components/dashboard/InvitationDateNotice";
import { InvitationTerm } from "@/components/dashboard/InvitationTerm";
import { getCurrentPrice } from "@/lib/site-pricing";
import { PaymentRefresh } from "@/components/dashboard/PaymentRefresh";
import { SupportRequest } from "@/components/SupportRequest";
import { PaymentReceipt } from "@/components/dashboard/PaymentReceipt";
import { PublicationReady } from "@/components/dashboard/PublicationReady";
import { publicationResponses } from "@/lib/publication-next-steps";
import "@/app/ayuda/soporte.css";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { InvitationActionLink } from "@/components/dashboard/InvitationActionLink";
import styles from "./payment.module.css";

export const metadata: Metadata = { title: "Pago y soporte | Cheetah Invite" };

export default function PaymentPage(props: PageProps<"/dashboard/eventos/[id]/pago">) {
  return <Suspense fallback={<BrandLoader message="Preparando el pago…" />}><PaymentData {...props} /></Suspense>;
}

async function PaymentData({ params, searchParams }: PageProps<"/dashboard/eventos/[id]/pago">) {
  await connection();
  const { id } = await params;
  const query = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${id}/pago`)}`);
  let event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id } });
  if (!event) notFound();
  if (event.isExample) notFound();
  const currentPrice = await getCurrentPrice();
  const invitationPriceLabel = currentPrice.label;
  // URL parameters never prove settlement. Reconcile only server-owned attempts.
  if (query.payment === "received") {
    const pending = await prisma.invitationPayment.findMany({ where: { eventId: id, ownerId: session.user.id, status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 10 });
    for (const attempt of pending) {
      if (!paymentProviderConfigured(attempt.provider)) continue;
      try { await reconcilePurchase(attempt.id, 30000); }
      catch { console.error("Unable to verify invitation purchase"); }
    }
    event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id } });
  }
  if (!event) notFound();
  const published = isInvitationPublished(event);
  const publication = published ? <PublicationReady eventId={event.id} name={event.name} path={invitationPath(event)!} privateInvitation={event.privacy === "PRIVATE"} responses={publicationResponses(event.sections)} /> : null;
  const renewal = canRenewInvitation(event);
  // eslint-disable-next-line react-hooks/purity -- Request-time server clock.
  const now = Date.now();
  const termEvent = { id: event.id, status: event.status, paidAt: event.paidAt, complimentaryAt: event.complimentaryAt, expiresAt: event.expiresAt, isExample: event.isExample, stripePaymentIntentId: event.stripePaymentIntentId };
  const term = invitationLifecycle(event, new Date(now));
  const renewalWindowOpen = renewal && term!.deletesAt.getTime() - now >= 31 * 60 * 1000;
  if (event.complimentaryAt && !event.paidAt) return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} />
    <div className={styles.content}>
      <div className={styles.heading}><span className={styles.eyebrow}>TU CELEBRACIÓN</span><h1>Pago y soporte</h1><p className={styles.eventName}>{event.name}</p></div>
      <section className={`${styles.card} ${styles.paymentCard}`} aria-labelledby="courtesy-heading" data-published={published || undefined}>
        <div className={styles.cardHeading}><h2 id="courtesy-heading">{published ? "Comparte tu invitación" : event.expiresAt && event.expiresAt > new Date() ? "Publica cuando esté lista" : "La cortesía ha vencido"}</h2><span className={styles.status}>Cortesía</span></div>
        <p>Publicación sin cobro.{!published && " Completa los datos y elige la privacidad desde el editor."}</p>
        {publication}
        <div className={styles.courtesyActions}><Link className={styles.primary} href={`/dashboard/eventos/${id}`}>Ir al editor<FiArrowRight aria-hidden="true" /></Link></div>
        {term && <div className={styles.termSummary}><InvitationTerm event={termEvent} now={now} compact /></div>}
      </section>
    </div>
  </main>;
  const providers = { stripe: paymentProviderConfigured("stripe"), paypal: paymentProviderConfigured("paypal"), mercadopago: paymentProviderConfigured("mercadopago") };
  const ready = Object.values(providers).some(Boolean);
  const payment = await prisma.invitationPayment.findFirst({ where: { eventId: id, ownerId: session.user.id,
    ...(event.stripePaymentIntentId && !renewal ? { OR: [{ stripePaymentIntentId: event.stripePaymentIntentId }, { providerPaymentId: event.stripePaymentIntentId }] } : {}) }, orderBy: { createdAt: "desc" } });
  const waiting = !published && query.payment === "received" && payment?.status === "PENDING";
  return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} />
    <div className={styles.content}>
      <div className={styles.heading}><span className={styles.eyebrow}>TU CELEBRACIÓN</span><h1>Pago y soporte</h1><p className={styles.eventName}>{event.name}</p></div>
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={`${styles.card} ${styles.paymentCard}`} aria-labelledby="payment-heading" data-published={published || undefined}>
            <div className={styles.cardHeading}><h2 id="payment-heading">{renewal ? "Renovar invitación" : published ? "Comparte tu invitación" : event.paidAt ? "Estado de la invitación" : "Publicar invitación"}</h2><span className={`${styles.status} ${published ? styles.confirmed : ""}`}>{published ? "Publicada" : waiting ? "Verificando pago" : renewal ? "Por renovar" : event.paidAt ? "Pago registrado" : "Pendiente de pago"}</span></div>
            {(!event.paidAt || renewal) && <InvitationDateNotice date={event.eventDate?.toISOString().slice(0, 10) ?? ""} time={event.eventTime ?? ""} now={now} />}
            {renewal ? <>
              <p>Conservamos tu invitación durante un mes después de vencer. Compra otro año para recuperar su contenido, sus fotos y el mismo enlace.</p>
              <div className={styles.price}>{invitationPriceLabel} <small>MXN</small></div>
              <p className={styles.priceNote}>12 meses desde la confirmación del nuevo pago. Sin renovación automática.</p>
              {query.error === "checkout" && <p className={styles.notice} role="alert">No pudimos abrir la renovación. Inténtalo nuevamente.</p>}
              {query.payment === "cancelled" && <p className={styles.notice} role="status">La renovación no se completó. Tu invitación sigue archivada hasta la fecha indicada.</p>}
              {waiting ? <PaymentRefresh /> : ready && renewalWindowOpen ? <PaymentMethods eventId={id} providers={providers} oxxo={process.env.STRIPE_OXXO_ENABLED === "true" && term!.deletesAt.getTime() - now > 5 * 86400000} renewal /> : <p className={styles.notice}>{!renewalWindowOpen ? "El plazo para iniciar un nuevo pago ha cerrado: Stripe necesita al menos 31 minutos antes de la eliminación. Si ya pagaste, estamos verificando tu renovación." : "Los pagos no están disponibles por el momento. Inténtalo más tarde o contacta con soporte."}</p>}
            </> : published ? publication : event.paidAt ? <p className={styles.notice}>{event.status === "REFUNDED" ? "El reembolso total está confirmado. El enlace público fue retirado." : event.status === "SUSPENDED" ? "El enlace está suspendido por una disputa del pago. Si se resuelve a favor, se reactivará con la vigencia original." : "La invitación terminó su vigencia. Consulta el plazo de conservación a continuación."}</p> : <>
              <div className={styles.priceSummary}>
                <div className={styles.price}>{invitationPriceLabel} <small>MXN</small></div>
                <p className={styles.priceNote}>IVA incluido · Pago único · Sin renovación automática.</p>
              </div>
              <p className={styles.duration}><FiCheck aria-hidden="true" /> 12 meses desde la confirmación del pago.</p>
              <div className={styles.checkout}>{waiting ? <PaymentRefresh /> : <>
                {query.payment === "cancelled" && <p className={styles.notice} role="status">El pago no se completó. Tu borrador sigue guardado.</p>}
                {query.error === "checkout" && <p className={styles.notice} role="alert">No pudimos abrir el pago. Inténtalo nuevamente.</p>}
                {event.privacy === "UNSET" ? <><p className={styles.notice}>Elige primero si tu invitación será pública o protegida con PIN.</p><Link className={styles.primary} href={`/dashboard/eventos/${id}/ajustes`}>Elegir privacidad <FiArrowRight aria-hidden="true" /></Link></> : ready ? <PaymentMethods eventId={id} providers={providers} oxxo={process.env.STRIPE_OXXO_ENABLED === "true"} /> : <p className={styles.notice} role="status">Los pagos aún no están disponibles. Puedes seguir editando y previsualizando tu invitación.</p>}
              </>}</div>
              <p className={styles.privateNote}><FiLock aria-hidden="true" /> Tu borrador sigue privado hasta confirmar el pago.</p>
              <details className={styles.purchaseDetails}>
                <summary>Qué incluye y condiciones <FiChevronDown aria-hidden="true" /></summary>
                <ul className={styles.benefits}>
                  <li><FiCheck aria-hidden="true" /> Enlace para compartir con la privacidad que elijas.</li>
                  <li><FiCheck aria-hidden="true" /> 12 meses a partir de la confirmación del pago.</li>
                  <li><FiCheck aria-hidden="true" /> Edición disponible durante la vigencia.</li>
                  <li><FiCheck aria-hidden="true" /> Un mes de archivo para renovar; después, eliminación automática.</li>
                </ul>
              </details>
            </>}
            {term && <div className={styles.termSummary}><InvitationTerm event={termEvent} now={now} compact /></div>}
            <details className={styles.purchaseDetails}><summary>Referencia de la invitación <FiChevronDown aria-hidden="true" /></summary><div className={styles.reference}><strong>{event.id}</strong></div></details>
          </section>
          {payment && <details className={styles.receiptDetails}><summary><h2>Detalle de tu compra</h2><FiChevronDown aria-hidden="true" /></summary><PaymentReceipt payment={payment} /></details>}
          <div className={styles.quickLinksContainer}>
            <nav className={styles.quickLinks} aria-label="Más opciones de tu invitación">
              <InvitationActionLink href="/dashboard/compras" title="Historial de compras" description="Consulta y actualiza el estado." icon={<FiCreditCard />} compact />
              <InvitationActionLink href={`/dashboard/eventos/${id}/show`} title="Vista previa privada" description="Revisa tu invitación completa." icon={<FiEye />} tone="lavender" compact />
            </nav>
          </div>
        </div>
        <aside className={styles.sidebar} aria-labelledby="support-heading">
          <section className={styles.supportArea}>
            <h2 id="support-heading">Ayuda con tu compra</h2>
            <details className={styles.support}><summary>Contactar soporte <FiChevronDown aria-hidden="true" /></summary><p>Cuéntanos qué ocurrió. Incluiremos las referencias de tu invitación en el correo.</p><SupportRequest initialEmail={session.user.email ?? ""} eventId={event.id} eventName={event.name} paymentId={payment?.id} /></details>
            <Link className={styles.helpLink} href="/ayuda">Ver preguntas frecuentes <FiArrowUpRight aria-hidden="true" /></Link>
          </section>
        </aside>
      </div>
      <footer className={styles.footer}><span>Todo listo para celebrar contigo.</span><Link href="/dashboard">Mis invitaciones <FiArrowRight aria-hidden="true" /></Link></footer>
    </div>
  </main>;
}
