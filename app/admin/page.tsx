import Link from "next/link";
import { FiArrowUpRight, FiCreditCard, FiGift, FiLayers, FiUsers, FiMail, FiTrendingUp } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { getCurrentPrice } from "@/lib/site-pricing";
import { paymentMoney } from "@/lib/payment-status";
import { AdminPageBoundary, AdminHeading, adminDate } from "@/components/admin/AdminUI";
import styles from "./overview.module.css";

const auditLabels: Record<string, string> = { "admin.grant": "Acceso de administrador asignado", "admin.revoke": "Acceso de administrador retirado", "example.duplicate": "Ejemplo duplicado como borrador", "price.create": "Cambio de precio", "price.cancel": "Precio programado cancelado", "example.create": "Nuevo borrador de ejemplo", "example.settings": "Presentación de ejemplo actualizada", "example.publish": "Ejemplo publicado", "example.unpublish": "Ejemplo retirado del sitio", "example.delete": "Borrador eliminado", "examples.source": "Origen de ejemplos actualizado", "courtesy.grant": "Cortesía otorgada", "courtesy.revoke": "Cortesía retirada" };

export default function AdminHome() {
  return <AdminPageBoundary><AdminHomeData /></AdminPageBoundary>;
}

async function AdminHomeData() {
  await requireAdmin();
  const [clients, examples, events, courtesy, sales, price, audit] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }), prisma.showcaseExample.count(), prisma.event.count({ where: { isExample: false } }),
    prisma.event.count({ where: { isExample: false, complimentaryAt: { not: null }, expiresAt: { gt: new Date() }, status: { notIn: ["ARCHIVED", "EXPIRED"] } } }),
    prisma.invitationPayment.aggregate({ where: { status: "PAID", livemode: true }, _sum: { amount: true, refundedAmount: true }, _count: true }),
    getCurrentPrice(), prisma.adminAudit.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const stats = [
    { label: "Clientes", value: String(clients), caption: "Cuentas de clientes registradas", Icon: FiUsers },
    { label: "Cobros menos reembolsos", value: paymentMoney((sales._sum.amount || 0) - (sales._sum.refundedAmount || 0), "mxn"), caption: "Producción · antes de comisiones y disputas", Icon: FiTrendingUp },
    { label: "Compras confirmadas", value: String(sales._count), caption: "Producción · incluye compras reembolsadas", Icon: FiCreditCard },
    { label: "Ejemplos propios", value: String(examples), caption: "Tus borradores y ejemplos publicados", Icon: FiLayers },
    { label: "Invitaciones", value: String(events), caption: "Eventos creados por cuentas del sitio", Icon: FiMail },
    { label: "Cortesías vigentes", value: String(courtesy), caption: "Autorizaciones vigentes sin cobro", Icon: FiGift },
  ];
  return <div className={styles.overview}>
    <AdminHeading title="Resumen del negocio" description="Clientes, publicaciones y movimientos recientes."><Link className={styles.textLink} href="/admin/estadisticas">Ver estadísticas<FiArrowUpRight aria-hidden="true" /></Link></AdminHeading>
    <dl className={styles.metrics}>{stats.map(({ label, value, caption, Icon }) => <div key={label} className={styles.metric}><dt>{label}<Icon aria-hidden="true" /></dt><dd><strong>{value}</strong><small>{caption}</small></dd></div>)}</dl>
    <div className={styles.management}>
      <section className={styles.price} aria-labelledby="admin-price-heading"><h2 id="admin-price-heading">Precio de publicación</h2><div className={styles.priceRow}><strong>{price.label}<small> MXN</small></strong><Link className={styles.textLink} href="/admin/precio">Gestionar<FiArrowUpRight aria-hidden="true" /></Link></div><p>IVA incluido · {price.months} meses de vigencia por invitación.</p></section>
      <section className={styles.catalog} aria-labelledby="admin-catalog-heading"><div className={styles.sectionHeading}><span className={styles.catalogIcon}><FiLayers aria-hidden="true" /></span><h2 id="admin-catalog-heading">Diseños y ejemplos</h2></div><p>Crea ejemplos, revisa tus borradores y decide cuáles aparecen en el sitio.</p><Link className="admin-button" href="/admin/disenos">Gestionar catálogo<FiArrowUpRight aria-hidden="true" /></Link></section>
    </div>
    <div className={styles.activityHeading}><h2>Actividad reciente</h2><span>{audit.length ? `${audit.length} últimos cambios` : "Sin movimientos"}</span></div>
    {audit.length ? <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Historial de cambios administrativos</caption><thead><tr><th>Acción</th><th>Fecha</th><th>Referencia</th></tr></thead><tbody>{audit.map(entry => <tr key={entry.id}><td>{auditLabels[entry.action] || entry.action}</td><td>{adminDate(entry.createdAt)}</td><td><small>{entry.targetId}</small></td></tr>)}</tbody></table></div> : <p className="admin-help">Los cambios de precio, ejemplos y cortesías aparecerán aquí cuando empieces a usar la administración.</p>}
  </div>;
}
