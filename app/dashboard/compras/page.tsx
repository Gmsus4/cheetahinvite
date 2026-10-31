import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCreditCard, FiHelpCircle, FiInfo, FiRefreshCw, FiShoppingBag } from "react-icons/fi";
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
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import styles from "./purchases.module.css";

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
  return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} active="purchases" />
    <div className={styles.content}>
      <div className={styles.heading}><span className={styles.eyebrow}>TU CUENTA · HISTORIAL DE COMPRAS</span><h1>Mis compras</h1><p>Cada celebración, en un solo lugar. Consulta tus pagos, reembolsos y disputas.</p></div>
      <aside className={styles.info}><FiInfo aria-hidden="true" /><p>Tu historial de compras se conserva aunque elimines una invitación. Puedes consultar sus referencias y solicitar ayuda desde aquí.</p></aside>
      {query.error && <p className={styles.notice} role="alert">No pudimos verificar el estado con Stripe. Inténtalo de nuevo más tarde; no necesitas volver a pagar.</p>}
      {payments.length === 0 && <section className={styles.empty}><span><FiShoppingBag aria-hidden="true" /></span><h2>{page > 1 ? "No hay más compras en esta página" : "Tus celebraciones empiezan aquí"}</h2><p>{page > 1 ? "Vuelve a la página anterior para consultar tus compras más recientes." : "Cuando inicies el pago de una invitación, encontrarás aquí su estado y los detalles de tu compra."}</p><Link className={styles.primary} href={page > 1 ? `/dashboard/compras?page=${page - 1}` : "/dashboard"}>{page > 1 ? "Ver compras más recientes" : "Ver mis invitaciones"}<FiArrowRight aria-hidden="true" /></Link></section>}
      <div className={styles.grid}>
        {payments.slice(0, 20).map(payment => <article className={styles.card} key={payment.id}>
          <div className={styles.cardHeading}><span className={styles.icon}><FiCreditCard aria-hidden="true" /></span><div><span className={styles.eyebrow}>TU CELEBRACIÓN</span><h2>{payment.eventName}</h2></div></div>
          <PaymentReceipt payment={payment} />
          {isPreviousPriceAttempt(payment) && <p className={styles.notice}>Este intento se inició antes del cambio de precio y aún no tiene un pago confirmado en la aplicación.{exists.has(payment.eventId) && <> El precio actual para publicar es <strong>{invitationPriceLabel} MXN, IVA incluido</strong>. Al continuar, comprobaremos el estado del intento anterior antes de abrir el pago con el precio vigente.</>}</p>}
          <div className={styles.actions}>
            {exists.has(payment.eventId) ? <Link className={styles.primary} href={`/dashboard/eventos/${payment.eventId}/pago`}>{isPreviousPriceAttempt(payment) ? `Continuar con el precio actual · ${invitationPriceLabel} MXN` : "Ver invitación y pago"}<FiArrowUpRight aria-hidden="true" /></Link> : <p className={styles.removed}>Invitación eliminada. Su enlace público ya no está disponible. Si hay un cobro pendiente de resolver, contacta con soporte.</p>}
            {payment.stripeCheckoutSessionId && <form action={refreshPurchase.bind(null, payment.id)}><button className={styles.secondary} type="submit"><FiRefreshCw aria-hidden="true" /> Actualizar estado del pago</button></form>}
          </div>
          <details className={styles.support}><summary><FiHelpCircle aria-hidden="true" />Solicitar ayuda con esta compra<FiArrowRight aria-hidden="true" /></summary><SupportRequest initialEmail={session.user.email ?? ""} eventId={payment.eventId} eventName={payment.eventName} paymentId={payment.id} /></details>
        </article>)}
      </div>
      {(page > 1 || payments.length > 20) && <div className={styles.pagination}><span>Página {page}</span><nav aria-label="Páginas de compras">{page > 1 && <Link className={styles.secondary} href={`/dashboard/compras?page=${page - 1}`}><FiArrowLeft aria-hidden="true" /> Más recientes</Link>}{payments.length > 20 && <Link className={styles.secondary} href={`/dashboard/compras?page=${page + 1}`}>Anteriores <FiArrowRight aria-hidden="true" /></Link>}</nav></div>}
      <footer className={styles.footer}><span>Todo listo para celebrar contigo.</span><Link href="/ayuda">¿Necesitas ayuda? <FiArrowUpRight aria-hidden="true" /></Link></footer>
    </div>
  </main>;
}
