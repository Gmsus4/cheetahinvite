import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft, FiArrowUpRight, FiExternalLink } from "react-icons/fi";
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

export const metadata: Metadata = { title: "Publicar invitación | Cheetah Invite" };

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
  return <main className="invitation-payment-page"><div className="invitation-payment-card">
    <Link className="editor-back" href="/dashboard"><FiArrowLeft aria-hidden="true" /> Volver a mis invitaciones</Link>
    <p className="dashboard-eyebrow">PUBLICACIÓN DE TU INVITACIÓN</p>
    <h1>{published ? "Tu invitación está lista para compartir" : event.paidAt ? "Pago registrado" : "Un último paso para compartir"}</h1>
    <p>{event.name}</p>
    <p className="purchase-reference">Referencia de tu invitación: <strong>{event.id}</strong></p>
    {published ? <><p>Tu pago está confirmado y tu invitación está publicada.</p><Link className="button" href={invitationPath(event)!} target="_blank" rel="noopener noreferrer">Abrir invitación pública <FiExternalLink aria-hidden="true" /></Link></> : event.paidAt ? <p>{event.status === "REFUNDED" ? "El reembolso total está confirmado. El enlace público fue retirado." : event.status === "SUSPENDED" ? "El enlace está suspendido por una disputa del pago. Si se resuelve a favor, se reactivará con la vigencia original." : "Tu pago está registrado. La invitación está vencida o archivada; consulta su vigencia y contacta con soporte si necesitas ayuda."}</p> : <>
      <strong className="invitation-payment-price">{invitationPriceLabel} <small>MXN</small></strong>
      <p>IVA incluido · Un pago por evento · 12 meses a partir de la confirmación · Sin renovación automática.</p>
      <ul><li>Invitación publicada con enlace para compartir.</li><li>Edición disponible durante la vigencia.</li><li>Tu borrador y vista previa permanecen privados hasta confirmar el pago.</li></ul>
      {waiting ? <PaymentRefresh /> : <>
        {query.payment === "cancelled" && <p role="status">El pago no se completó. Tu borrador sigue guardado.</p>}
        {query.error === "checkout" && <p role="alert">No pudimos abrir el pago. Inténtalo nuevamente.</p>}
        {ready ? <form action={startCheckout.bind(null, id)}><button className="button" type="submit">Pagar {invitationPriceLabel} MXN con Stripe</button><small>Te llevaremos a la página de pago de Stripe.</small></form> : <p role="status">Los pagos aún no están disponibles. Puedes seguir editando y previsualizando tu invitación.</p>}
      </>}
    </>}
    {payment && (payment.status !== "PENDING" || payment.amount === INVITATION_PRICE.amount) && <PaymentReceipt payment={payment} />}
    <Link href="/dashboard/compras">Ver historial de compras y actualizar estado</Link>
    <Link href={`/dashboard/eventos/${id}/show`}>Ver mi invitación en privado</Link>
    <details className="purchase-support"><summary>Tengo un problema con mi compra</summary><SupportRequest initialEmail={session.user.email ?? ""} eventId={event.id} eventName={event.name} paymentId={payment?.id} /></details>
    <Link className="purchase-help-link" href="/ayuda">Ver ayuda y preguntas frecuentes <FiArrowUpRight aria-hidden="true" /></Link>
  </div></main>;
}
