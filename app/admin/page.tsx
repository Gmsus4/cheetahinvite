import Link from "next/link";
import { FiArrowUpRight, FiCreditCard, FiGift, FiLayers, FiUsers, FiMail, FiTrendingUp } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { getCurrentPrice } from "@/lib/site-pricing";
import { paymentMoney } from "@/lib/payment-status";
import { AdminPageBoundary, AdminHeading, adminDate } from "@/components/admin/AdminUI";

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
  return <>
    <AdminHeading title="Todo para seguir creciendo." description="Tu escaparate, tus clientes y cada celebración, en un solo lugar." />
    <div className="admin-stats">{stats.map(({ label, value, caption, Icon }) => <article key={label} className="admin-stat"><span className="admin-stat-label">{label}<Icon aria-hidden="true" /></span><strong>{value}</strong><small>{caption}</small></article>)}</div>
    <div className="admin-grid">
      <section className="admin-card"><span className="admin-eyebrow">PRECIO DE PUBLICACIÓN</span><div className="admin-price-amount">{price.label}<small style={{ fontSize: 13, letterSpacing: 0 }}> MXN</small></div><p>IVA incluido · {price.months} meses de vigencia por invitación.</p><Link className="admin-button secondary" href="/admin/precio">Gestionar precio<FiArrowUpRight /></Link></section>
      <section className="admin-card"><span className="admin-eyebrow">TU ESCAPARATE</span><h2 style={{ marginTop: 14 }}>Cada ejemplo lleva tu sello.</h2><p>Crea tus ejemplos con el editor del sitio. Decide cuándo publicarlos y en qué orden aparecen.</p><Link className="admin-button" href="/admin/disenos">Diseños y ejemplos<FiArrowUpRight /></Link></section>
    </div>
    <h2 className="admin-section-title">Actividad reciente</h2>
    {audit.length ? <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Historial de cambios administrativos</caption><thead><tr><th>Acción</th><th>Fecha</th><th>Referencia</th></tr></thead><tbody>{audit.map(entry => <tr key={entry.id}><td>{auditLabels[entry.action] || entry.action}</td><td>{adminDate(entry.createdAt)}</td><td><small>{entry.targetId}</small></td></tr>)}</tbody></table></div> : <p className="admin-help">Los cambios de precio, ejemplos y cortesías aparecerán aquí cuando empieces a usar la administración.</p>}
  </>;
}
