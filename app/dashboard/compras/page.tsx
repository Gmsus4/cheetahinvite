import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { BrandLoader } from "@/components/BrandLoader";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { PaymentReceipt } from "@/components/dashboard/PaymentReceipt";
import { SupportRequest } from "@/components/SupportRequest";
import { invitationPriceLabel } from "@/lib/invitation-payment";
import { isPreviousPriceAttempt } from "@/lib/payment-status";
import { refreshPurchase } from "./actions";
import "@/app/ayuda/soporte.css";

export const metadata: Metadata = { title: "Mis compras | Cheetah Invite" };
export default function PurchasesPage(props: PageProps<"/dashboard/compras">) {
  return <Suspense fallback={<BrandLoader message="Cargando tus compras…" />}><PurchasesData {...props} /></Suspense>;
}
async function PurchasesData({ searchParams }: PageProps<"/dashboard/compras">) {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard%2Fcompras");
  const query = await searchParams;
  const page = typeof query.page === "string" && /^\d{1,4}$/.test(query.page) ? Math.max(1, Number(query.page)) : 1;
  const payments = await prisma.invitationPayment.findMany({ where: { ownerId: session.user.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 21 });
  const invitations = await prisma.event.findMany({ where: { ownerId: session.user.id, id: { in: payments.map(p => p.eventId) } }, select: { id: true } });
  const exists = new Set(invitations.map(i => i.id));
  return <main className="purchase-history"><Link className="purchase-history-action" href="/dashboard"><FiArrowLeft aria-hidden="true" /> Volver a mis invitaciones</Link>
    <p className="dashboard-eyebrow">TU CUENTA</p><h1>Mis compras</h1>
    <p>Consulta pagos, reembolsos y disputas. Este historial se conserva aunque elimines una invitación.</p>
    {query.error && <p role="alert">No pudimos verificar el estado con Stripe. Inténtalo de nuevo más tarde; no necesitas volver a pagar.</p>}
    {payments.length === 0 && <p>Aún no hay compras en esta página.</p>}
    {payments.slice(0, 20).map(payment => <article className="purchase-history-card" key={payment.id}>
      <h2>{payment.eventName}</h2><PaymentReceipt payment={payment} />
      {isPreviousPriceAttempt(payment) && <p className="purchase-price-update">Este intento se inició antes del cambio de precio y aún no tiene un pago confirmado en la aplicación.{exists.has(payment.eventId) && <> El precio actual para publicar es <strong>{invitationPriceLabel} MXN, IVA incluido</strong>. Al continuar, comprobaremos el estado del intento anterior antes de abrir el pago con el precio vigente.</>}</p>}
      {exists.has(payment.eventId) ? <Link className="purchase-history-action" href={`/dashboard/eventos/${payment.eventId}/pago`}>{isPreviousPriceAttempt(payment) ? `Continuar con el precio actual · ${invitationPriceLabel} MXN` : "Ver invitación y pago"}</Link> : <p>Invitación eliminada. Su enlace público ya no está disponible. Si hay un cobro pendiente de resolver, contacta con soporte.</p>}
      {payment.stripeCheckoutSessionId && <form action={refreshPurchase.bind(null, payment.id)}><button className="button button-secondary purchase-history-action" type="submit">Actualizar estado del pago</button></form>}
      <details className="purchase-support"><summary>Solicitar ayuda con esta compra</summary><SupportRequest initialEmail={session.user.email ?? ""} eventId={payment.eventId} eventName={payment.eventName} paymentId={payment.id} /></details>
    </article>)}
    <nav className="purchase-history-pagination" aria-label="Páginas de compras">
      {page > 1 && <Link className="purchase-history-action" href={`/dashboard/compras?page=${page - 1}`}>Más recientes</Link>}
      {payments.length > 20 && <Link className="purchase-history-action" href={`/dashboard/compras?page=${page + 1}`}>Anteriores</Link>}
    </nav>
  </main>;
}
