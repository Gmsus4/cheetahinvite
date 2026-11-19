import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiExternalLink, FiGift, FiGlobe, FiLock } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, adminDate, eventLabels, eventStatuses } from "@/components/admin/AdminUI";
import { paymentMoney, paymentStatusLabel } from "@/lib/payment-status";
import { invitationPath } from "@/lib/invitation-url";
import { isInvitationPublished } from "@/lib/invitation-payment";
import compact from "../../compact.module.css";
import styles from "./client-detail.module.css";

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
  return <div className={styles.detail}>
    <div className={`${compact.compact} ${styles.profile}`}>
    <Link className={styles.backLink} href="/admin/clientes"><FiArrowLeft aria-hidden="true" />Todos los clientes</Link>
    <AdminHeading eyebrow="CLIENTES · DETALLE" title={client.name || "Cuenta de cliente"} description={client.email || "Cuenta sin correo registrado"} />
    <section className={styles.accountSection} aria-labelledby="account-heading">
      <div className={styles.accountHeading}>
        <h2 id="account-heading">Datos de la cuenta</h2>
        <Link className={`admin-button secondary ${styles.courtesyLink}`} href={`/admin/cortesias?cliente=${encodeURIComponent(client.email || "")}`}><FiGift aria-hidden="true" />Gestionar cortesías</Link>
      </div>
      <dl className={styles.accountDetails}>
        <div><dt>Acceso</dt><dd>{methods.join(" · ") || "Sin método registrado"}</dd></div>
        <div><dt>Tipo de cuenta</dt><dd>{client.role === "ADMIN" ? "Administración" : "Cliente"}</dd></div>
        <div className={styles.accountReference}><dt>Referencia</dt><dd><code>{client.id}</code></dd></div>
      </dl>
    </section>
    </div>
    <h2 className="admin-section-title">Sus invitaciones</h2>
    {client.events.length ? <div className="admin-table-wrap">
      <table className="admin-table">
        <caption className="admin-visually-hidden">Invitaciones del cliente</caption>
        <thead><tr><th scope="col">Invitación</th><th scope="col">Estado</th><th scope="col">Acceso</th><th scope="col">Vencimiento</th></tr></thead>
        <tbody>{client.events.map(event => <tr key={event.id}>
          <td>{event.name}<small>{eventLabels[event.eventType]} · {event.id}</small></td>
          <td>
            <div className={styles.eventStatus}>
              <span className="admin-badge neutral">{event.status === "PUBLISHED" && event.expiresAt && event.expiresAt <= new Date() ? "Vencida" : eventStatuses[event.status]}</span>
              <span className={styles.eventPrivacy}>
                {event.privacy === "PRIVATE" ? <FiLock aria-hidden="true" /> : event.privacy === "PUBLIC" ? <FiGlobe aria-hidden="true" /> : null}
                {event.privacy === "PRIVATE" ? "Protegida con PIN" : event.privacy === "PUBLIC" ? "Pública" : "Privacidad pendiente"}
              </span>
            </div>
          </td>
          <td>
            <div className={styles.eventAccess}>
              <span>{event.paidAt ? "Compra registrada" : event.complimentaryAt ? "Cortesía" : "Sin publicación"}</span>
              {isInvitationPublished(event) && <Link className={styles.publicLink} href={invitationPath(event)!} target="_blank" rel="noopener noreferrer" aria-label={`Ver invitación pública: ${event.name} (abre en otra pestaña)`} title="Abrir invitación pública">Ver<FiExternalLink aria-hidden="true" /></Link>}
            </div>
          </td>
          <td>{adminDate(event.expiresAt)}</td>
        </tr>)}</tbody>
      </table>
    </div> : <p className="admin-help">Esta cuenta todavía no tiene invitaciones.</p>}
    <h2 className="admin-section-title">Compras recientes</h2>
    {payments.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Compra</th><th>Importe</th><th>Estado</th><th>Entorno</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}><td><Link href={`/admin/ventas/${payment.id}`}>{payment.eventName}</Link><small>{adminDate(payment.createdAt)}</small></td><td>{paymentMoney(payment.amount, payment.currency)}</td><td>{paymentStatusLabel(payment)}</td><td>{payment.livemode ? "Producción" : "Pruebas"}</td></tr>)}</tbody></table></div> : <p className="admin-help">Esta cuenta todavía no tiene compras.</p>}
    <h2 className="admin-section-title">Historial de cortesías</h2>
    {grants.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Otorgada</th><th>Motivo</th><th>Vencimiento</th><th>Estado</th></tr></thead><tbody>{grants.map(grant => <tr key={grant.id}><td>{adminDate(grant.grantedAt)}</td><td>{grant.reason}</td><td>{adminDate(grant.expiresAt)}</td><td>{grant.revokedAt ? "Retirada" : grant.expiresAt <= new Date() ? "Vencida" : "Vigente"}</td></tr>)}</tbody></table></div> : <p className="admin-help">No se han otorgado cortesías a esta cuenta.</p>}
  </div>;
}
