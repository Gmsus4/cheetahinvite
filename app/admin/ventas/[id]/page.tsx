import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { PaymentReceipt } from "@/components/dashboard/PaymentReceipt";
import { AdminPageBoundary, AdminHeading, adminDate } from "@/components/admin/AdminUI";
import { AdminSubmit } from "@/components/admin/AdminSubmit";
import { refreshAdminPayment } from "../../actions";

export default function PurchasePage(props: PageProps<"/admin/ventas/[id]">) {
  return <AdminPageBoundary><PurchasePageData {...props} /></AdminPageBoundary>;
}

async function PurchasePageData({ params }: PageProps<"/admin/ventas/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const purchase = await prisma.invitationPayment.findUnique({ where: { id } });
  if (!purchase) notFound();
  const [client, event] = await Promise.all([prisma.user.findUnique({ where: { id: purchase.ownerId }, select: { id: true, name: true, email: true } }), prisma.event.findUnique({ where: { id: purchase.eventId }, select: { id: true } })]);
  const stripeUrl = purchase.stripePaymentIntentId ? `https://dashboard.stripe.com/${purchase.livemode ? "" : "test/"}payments/${encodeURIComponent(purchase.stripePaymentIntentId)}` : null;
  return <><Link href={`/admin/ventas?mode=${purchase.livemode ? "live" : "test"}`} className="admin-help">← Volver a ventas</Link><div style={{ marginTop: 24 }}><AdminHeading eyebrow={`VENTAS · ${purchase.livemode ? "PRODUCCIÓN" : "PRUEBAS"}`} title={purchase.eventName} description={`Compra iniciada el ${adminDate(purchase.createdAt)}`} /></div><div className="admin-grid"><section className="admin-card"><h2>Detalle de la compra</h2><PaymentReceipt payment={purchase} /><div style={{ marginTop: 20 }} className="admin-inline">{purchase.stripeCheckoutSessionId && <form action={refreshAdminPayment.bind(null, id)}><AdminSubmit secondary pendingLabel="Consultando Stripe…">Actualizar estado</AdminSubmit></form>}{stripeUrl && <a className="admin-button" href={stripeUrl} target="_blank" rel="noopener noreferrer">Abrir en Stripe ↗</a>}</div></section><section className="admin-card"><h2>Cliente e invitación</h2><dl className="admin-detail-list"><div><dt>Cliente</dt><dd>{client ? <Link href={`/admin/clientes/${client.id}`}>{client.name || client.email || "Ver cuenta"}</Link> : "Cuenta eliminada"}</dd></div><div><dt>Correo</dt><dd>{client?.email || "—"}</dd></div><div><dt>Invitación</dt><dd>{event ? purchase.eventId : "Invitación eliminada"}</dd></div><div><dt>Referencia de compra</dt><dd>{purchase.id}</dd></div></dl><p style={{ marginTop: 24 }}>Los reembolsos y las disputas se gestionan en Stripe. Su estado se sincroniza aquí mediante las notificaciones de pago.</p></section></div></>;
}
