import type { Metadata } from "next";
import Link from "next/link";
import { invitationPath } from "@/lib/invitation-url";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";
import { fulfillInvitationPayment } from "@/lib/payment-fulfillment";
import { invitationPriceLabel, isInvitationPublished } from "@/lib/invitation-payment";
import { PaymentRefresh } from "@/components/dashboard/PaymentRefresh";
import { startCheckout } from "./actions";

export const metadata: Metadata = { title: "Publicar invitación | Cheetah Invite" };

export default function PaymentPage(props: PageProps<"/dashboard/eventos/[id]/pago">) {
  return <Suspense fallback={<div className="editor-loading">Preparando el pago…</div>}><PaymentData {...props} /></Suspense>;
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
      const checkout = await getStripe().checkout.sessions.retrieve(event.stripeCheckoutSessionId, { expand: ["payment_intent.latest_charge"] });
      if (checkout.metadata?.eventId === event.id && checkout.metadata?.ownerId === session.user.id) {
        const intent = typeof checkout.payment_intent === "object" ? checkout.payment_intent : null;
        const charge = typeof intent?.latest_charge === "object" ? intent.latest_charge : null;
        const fulfilled = await fulfillInvitationPayment(checkout, charge ? new Date(charge.created * 1000) : new Date());
        if (fulfilled) event = (await prisma.event.findFirst({ where: { id, ownerId: session.user.id } }))!;
      }
    } catch {
      console.error("Unable to verify invitation payment with Stripe");
    }
  }
  if (!event) notFound();
  const published = isInvitationPublished(event);
  const waiting = !event.paidAt && query.payment === "received";
  const ready = stripeIsConfigured();
  return <main className="invitation-payment-page"><div className="invitation-payment-card">
    <Link className="editor-back" href={`/dashboard/eventos/${id}`}>← Volver al editor</Link>
    <p className="dashboard-eyebrow">PUBLICACIÓN DE TU INVITACIÓN</p>
    <h1>{published ? "Tu invitación está lista para compartir" : event.paidAt ? "Pago registrado" : "Un último paso para compartir"}</h1>
    <p>{event.name}</p>
    {published ? <><p>Tu pago está confirmado y tu invitación está publicada.</p><Link className="button" href={invitationPath(event)!} target="_blank" rel="noopener noreferrer">Abrir invitación pública ↗</Link></> : event.paidAt ? <p>Tu pago está registrado. Revisa la vigencia de tu invitación desde el editor.</p> : <>
      <strong className="invitation-payment-price">{invitationPriceLabel} <small>MXN</small></strong>
      <p>Un pago por evento · 12 meses a partir de la confirmación · Sin renovación automática.</p>
      <ul><li>Invitación publicada con enlace para compartir.</li><li>Edición disponible durante la vigencia.</li><li>Tu borrador y vista previa permanecen privados hasta confirmar el pago.</li></ul>
      {waiting ? <PaymentRefresh /> : <>
        {query.payment === "cancelled" && <p role="status">El pago no se completó. Tu borrador sigue guardado.</p>}
        {query.error === "checkout" && <p role="alert">No pudimos abrir el pago. Inténtalo nuevamente.</p>}
        {ready ? <form action={startCheckout.bind(null, id)}><button className="button" type="submit">Pagar {invitationPriceLabel} MXN con Stripe</button><small>Te llevaremos a la página de pago de Stripe.</small></form> : <p role="status">Los pagos aún no están disponibles. Puedes seguir editando y previsualizando tu invitación.</p>}
      </>}
    </>}
    <Link href={`/dashboard/eventos/${id}/show`}>Ver mi invitación en privado</Link>
  </div></main>;
}
