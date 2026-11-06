import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiArrowUpRight, FiCheck, FiCheckCircle, FiCreditCard, FiExternalLink, FiEye, FiFileText, FiHelpCircle, FiLock, FiMessageCircle } from "react-icons/fi";
import { invitationPath } from "@/lib/invitation-url";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";
import { fulfillInvitationPayment } from "@/lib/payment-fulfillment";
import { INVITATION_PRICE, invitationPriceLabel, isInvitationPublished } from "@/lib/invitation-payment";
import { PaymentRefresh } from "@/components/dashboard/PaymentRefresh";
import { startCheckout } from "./actions";
import { SupportRequest } from "@/components/SupportRequest";
import { PaymentReceipt } from "@/components/dashboard/PaymentReceipt";
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
  // Recover a missed webhook using the stored session, never URL payment claims.
  if (!event.paidAt && event.stripeCheckoutSessionId && query.payment === "received" && stripeIsConfigured()) {
    try {
      const checkout = await getStripe().checkout.sessions.retrieve(event.stripeCheckoutSessionId);
      if (checkout.metadata?.eventId === event.id && checkout.metadata?.ownerId === session.user.id) {
        const fulfilled = await fulfillInvitationPayment(checkout);
        if (fulfilled) event = (await prisma.event.findFirst({ where: { id, ownerId: session.user.id } }))!;
      }
    } catch {
      console.error("Unable to verify invitation payment with Stripe");
    }
  }
  if (!event) notFound();
  const published = isInvitationPublished(event);
  const ready = stripeIsConfigured();
  const payment = await prisma.invitationPayment.findFirst({ where: { eventId: id, ownerId: session.user.id,
    ...(event.stripePaymentIntentId ? { stripePaymentIntentId: event.stripePaymentIntentId } : {}) }, orderBy: { createdAt: "desc" } });
  const waiting = !event.paidAt && query.payment === "received" && !["FAILED", "EXPIRED"].includes(payment?.status ?? "");
  return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} />
    <div className={styles.content}>
      <div className={styles.heading}><span className={styles.eyebrow}>TU CELEBRACIÓN · PAGO Y SOPORTE</span><h1>Todo para tu invitación.</h1><p className={styles.eventName}>{event.name}</p><p>Consulta tu compra, revisa su estado y encuentra ayuda cuando la necesites.</p></div>
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.card} aria-labelledby="payment-heading">
            <div className={styles.cardHeading}><span className={`${styles.icon} ${published ? styles.confirmed : ""}`}>{published ? <FiCheckCircle aria-hidden="true" /> : <FiCreditCard aria-hidden="true" />}</span><span className={`${styles.status} ${published ? styles.confirmed : ""}`}>{published ? "Publicada" : event.paidAt ? "Pago registrado" : waiting ? "Verificando pago" : "Pendiente de pago"}</span></div>
            <h2 id="payment-heading">{published ? "Lista para compartir" : event.paidAt ? "El estado de tu invitación" : "Un último paso para compartir"}</h2>
            {published ? <><p>Tu pago está confirmado y tu invitación está publicada. Ya puedes compartir este momento con tus invitados.</p><Link className={styles.primary} href={invitationPath(event)!} target="_blank" rel="noopener noreferrer">Abrir invitación <FiExternalLink aria-hidden="true" /></Link></> : event.paidAt ? <p className={styles.notice}>{event.status === "REFUNDED" ? "El reembolso total está confirmado. El enlace público fue retirado." : event.status === "SUSPENDED" ? "El enlace está suspendido por una disputa del pago. Si se resuelve a favor, se reactivará con la vigencia original." : "Tu pago está registrado. La invitación está vencida o archivada; consulta su vigencia y contacta con soporte si necesitas ayuda."}</p> : <>
              <div className={styles.price}>{invitationPriceLabel} <small>MXN</small></div><p className={styles.priceNote}>IVA incluido · Un pago por evento · Sin renovación automática.</p>
              <ul className={styles.benefits}><li><FiCheck aria-hidden="true" /> Enlace para compartir con la privacidad que elijas.</li><li><FiCheck aria-hidden="true" /> 12 meses a partir de la confirmación del pago.</li><li><FiCheck aria-hidden="true" /> Edición disponible durante la vigencia.</li></ul>
              <p className={styles.privateNote}><FiLock aria-hidden="true" /> Tu borrador y vista previa permanecen privados hasta confirmar el pago.</p>
              <div className={styles.checkout}>{waiting ? <PaymentRefresh /> : <>
                {query.payment === "cancelled" && <p className={styles.notice} role="status">El pago no se completó. Tu borrador sigue guardado.</p>}
                {query.error === "checkout" && <p className={styles.notice} role="alert">No pudimos abrir el pago. Inténtalo nuevamente.</p>}
                {event.privacy === "UNSET" ? <><p className={styles.notice}>Elige primero si tu invitación será pública o protegida con PIN.</p><Link className={styles.primary} href={`/dashboard/eventos/${id}/ajustes`}>Elegir privacidad <FiArrowRight aria-hidden="true" /></Link></> : ready ? <form action={startCheckout.bind(null, id)}><button className={styles.primary} type="submit">Pagar {invitationPriceLabel} MXN con Stripe <FiArrowRight aria-hidden="true" /></button><small>Te llevaremos a la página de pago de Stripe.</small></form> : <p className={styles.notice} role="status">Los pagos aún no están disponibles. Puedes seguir editando y previsualizando tu invitación.</p>}
              </>}</div>
            </>}
            <div className={styles.reference}><span>Referencia de tu invitación</span><strong>{event.id}</strong></div>
          </section>
          {payment && (payment.status !== "PENDING" || payment.amount === INVITATION_PRICE.amount) && <section className={styles.card} aria-labelledby="receipt-heading"><div className={styles.sectionTitle}><FiFileText aria-hidden="true" /><h2 id="receipt-heading">Detalle de tu compra</h2></div><PaymentReceipt payment={payment} /></section>}
          <div className={styles.quickLinksContainer}>
            <nav className={styles.quickLinks} aria-label="Más opciones de tu invitación">
              <InvitationActionLink href="/dashboard/compras" title="Historial de compras" description="Consulta y actualiza el estado." icon={<FiCreditCard />} />
              <InvitationActionLink href={`/dashboard/eventos/${id}/show`} title="Vista previa privada" description="Revisa tu invitación completa." icon={<FiEye />} tone="lavender" />
            </nav>
          </div>
        </div>
        <aside className={styles.sidebar} aria-labelledby="support-heading">
          <section className={styles.card}><span className={styles.icon}><FiMessageCircle aria-hidden="true" /></span><span className={styles.eyebrow}>ESTAMOS PARA AYUDARTE</span><h2 id="support-heading">¿Necesitas una mano?</h2><p>Si tienes un problema con tu compra, cuéntanos qué ocurrió. Las referencias de tu invitación se incluirán en el correo.</p><details className={styles.support}><summary>Tengo un problema con mi compra <FiArrowRight aria-hidden="true" /></summary><SupportRequest initialEmail={session.user.email ?? ""} eventId={event.id} eventName={event.name} paymentId={payment?.id} /></details></section>
          <section className={`${styles.card} ${styles.helpCard}`}><FiHelpCircle aria-hidden="true" /><h2>La respuesta puede estar aquí</h2><p>Consulta la ayuda sobre pagos, vigencia y publicación de tu invitación.</p><Link href="/ayuda">Ver preguntas frecuentes <FiArrowUpRight aria-hidden="true" /></Link></section>
        </aside>
      </div>
      <footer className={styles.footer}><span>Todo listo para celebrar contigo.</span><Link href="/dashboard">Mis invitaciones <FiArrowRight aria-hidden="true" /></Link></footer>
    </div>
  </main>;
}
