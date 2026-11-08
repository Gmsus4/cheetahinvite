import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, adminDate, eventLabels, eventStatuses } from "@/components/admin/AdminUI";
import { paymentMoney, paymentStatusLabel } from "@/lib/payment-status";
import { invitationPath } from "@/lib/invitation-url";
import { isInvitationPublished } from "@/lib/invitation-payment";

export default function ClientPage(props: PageProps<"/admin/clientes/[id]">) {
  return <AdminPageBoundary><ClientPageData {...props} /></AdminPageBoundary>;
}

async function ClientPageData({ params }: PageProps<"/admin/clientes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [client, payments, grants] = await Promise.all([
    prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, accounts: { select: { provider: true } }, events: { where: { isExample: false }, select: { id: true, ownerId: true, name: true, eventType: true, status: true, paidAt: true, complimentaryAt: true, expiresAt: true, slug: true, customSlug: true, eventDate: true, privacy: true }, orderBy: { createdAt: "desc" }, take: 100 } } }),
    prisma.invitationPayment.findMany({ where: { ownerId: id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.courtesyGrant.findMany({ where: { ownerId: id }, orderBy: { grantedAt: "desc" }, take: 30 }),
  ]);
  if (!client) notFound();
  const methods = client.accounts.length ? client.accounts.map(a => a.provider === "google" ? "Google" : a.provider) : ["Correo electrónico"];
  return <>
    <Link className="admin-help" href="/admin/clientes">← Todos los clientes</Link>
    <div style={{ marginTop: 24 }}><AdminHeading eyebrow="CLIENTES · DETALLE" title={client.name || "Cuenta de cliente"} description={client.email || "Cuenta sin correo registrado"} /></div>
    <section className="admin-card"><dl className="admin-detail-list"><div><dt>Acceso</dt><dd>{methods.join(" · ") || "Sin método registrado"}</dd></div><div><dt>Tipo de cuenta</dt><dd>{client.role === "ADMIN" ? "Administración" : "Cliente"}</dd></div><div><dt>Referencia</dt><dd>{client.id}</dd></div><div><dt>Cortesías</dt><dd><Link className="admin-button secondary" href={`/admin/cortesias?cliente=${encodeURIComponent(client.email || "")}`}>Gestionar cortesías</Link></dd></div></dl></section>
    <h2 className="admin-section-title">Sus invitaciones</h2>
    {client.events.length ? <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Invitaciones del cliente</caption><thead><tr><th>Invitación</th><th>Estado</th><th>Acceso</th><th>Vencimiento</th></tr></thead><tbody>{client.events.map(event => <tr key={event.id}><td>{event.name}<small>{eventLabels[event.eventType]} · {event.id}</small></td><td><span className="admin-badge neutral">{event.status === "PUBLISHED" && event.expiresAt && event.expiresAt <= new Date() ? "Vencida" : eventStatuses[event.status]}</span><small>{event.privacy === "PRIVATE" ? "Protegida con PIN" : event.privacy === "PUBLIC" ? "Pública" : "Privacidad pendiente"}</small></td><td>{event.paidAt ? "Compra registrada" : event.complimentaryAt ? "Cortesía" : "Sin publicación"}{isInvitationPublished(event) && <small><Link href={invitationPath(event)!} target="_blank" rel="noopener noreferrer">Abrir enlace público ↗</Link></small>}</td><td>{adminDate(event.expiresAt)}</td></tr>)}</tbody></table></div> : <p className="admin-help">Esta cuenta todavía no tiene invitaciones.</p>}
    <h2 className="admin-section-title">Compras recientes</h2>
    {payments.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Compra</th><th>Importe</th><th>Estado</th><th>Entorno</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}><td><Link href={`/admin/ventas/${payment.id}`}>{payment.eventName}</Link><small>{adminDate(payment.createdAt)}</small></td><td>{paymentMoney(payment.amount, payment.currency)}</td><td>{paymentStatusLabel(payment)}</td><td>{payment.livemode ? "Producción" : "Pruebas"}</td></tr>)}</tbody></table></div> : <p className="admin-help">Esta cuenta todavía no tiene compras.</p>}
    <h2 className="admin-section-title">Historial de cortesías</h2>
    {grants.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Otorgada</th><th>Motivo</th><th>Vencimiento</th><th>Estado</th></tr></thead><tbody>{grants.map(grant => <tr key={grant.id}><td>{adminDate(grant.grantedAt)}</td><td>{grant.reason}</td><td>{adminDate(grant.expiresAt)}</td><td>{grant.revokedAt ? "Retirada" : grant.expiresAt <= new Date() ? "Vencida" : "Vigente"}</td></tr>)}</tbody></table></div> : <p className="admin-help">No se han otorgado cortesías a esta cuenta.</p>}
  </>;
}
