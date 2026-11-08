import Link from "next/link";
import { requireAdmin } from "@/lib/admin-access";
import { adminPage } from "@/lib/admin-validation";
import { prisma } from "@/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { AdminPageBoundary, AdminHeading, AdminEmpty, AdminNotice, AdminPagination, adminDate } from "@/components/admin/AdminUI";
import { paymentMoney, paymentStatusLabel } from "@/lib/payment-status";

export default function SalesPage(props: PageProps<"/admin/ventas">) {
  return <AdminPageBoundary><SalesPageData {...props} /></AdminPageBoundary>;
}

async function SalesPageData({ searchParams }: PageProps<"/admin/ventas">) {
  await requireAdmin();
  const query = await searchParams;
  const page = adminPage(query.page);
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const mode = query.mode === "test" ? "test" : "live";
  const state = typeof query.state === "string" && ["PENDING", "PAID", "FAILED", "EXPIRED"].includes(query.state) ? query.state : "";
  const owners = search ? await prisma.user.findMany({ where: { email: { contains: search, mode: "insensitive" } }, select: { id: true }, take: 200 }) : [];
  const where: Prisma.InvitationPaymentWhereInput = { livemode: mode === "live", ...(state ? { status: state as "PAID" | "PENDING" | "FAILED" | "EXPIRED" } : {}), ...(search ? { OR: [{ eventName: { contains: search, mode: "insensitive" } }, { id: { contains: search } }, { eventId: { contains: search } }, { ownerId: { in: owners.map(o => o.id) } }] } : {}) };
  const [payments, totals] = await Promise.all([prisma.invitationPayment.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 26 }), prisma.invitationPayment.aggregate({ where: { ...where, status: "PAID" }, _sum: { amount: true, refundedAmount: true }, _count: true })]);
  return <>
    <AdminHeading title="Cada compra, a la vista." description="Consulta los cobros, sus referencias y el estado confirmado por Stripe. Los pagos de prueba se muestran por separado." />
    <AdminNotice success={query.saved} error={query.error} />
    <div className="admin-periods"><Link href="/admin/ventas?mode=live" aria-current={mode === "live" ? "page" : undefined}>Producción</Link><Link href="/admin/ventas?mode=test" aria-current={mode === "test" ? "page" : undefined}>Pruebas</Link></div>
    <div className="admin-stats"><article className="admin-stat"><span className="admin-stat-label">Cobros confirmados</span><strong>{paymentMoney(totals._sum.amount || 0, "mxn")}</strong><small>{totals._count} compras · filtros actuales</small></article><article className="admin-stat"><span className="admin-stat-label">Reembolsos confirmados</span><strong>{paymentMoney(totals._sum.refundedAmount || 0, "mxn")}</strong><small>Operaciones con pago registrado</small></article><article className="admin-stat"><span className="admin-stat-label">Cobros menos reembolsos</span><strong>{paymentMoney((totals._sum.amount || 0) - (totals._sum.refundedAmount || 0), "mxn")}</strong><small>Antes de comisiones y disputas</small></article></div>
    <form className="admin-search" role="search"><input type="hidden" name="mode" value={mode} /><label><span className="admin-visually-hidden">Correo, evento o referencia</span><input name="q" defaultValue={search} maxLength={100} placeholder="Correo, nombre del evento o referencia" /></label><label style={{ flex: "0 1 180px" }}><span className="admin-visually-hidden">Estado de pago</span><select name="state" defaultValue={state} style={{ width: "100%", height: 46, border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", color: "var(--ink)", padding: "0 12px" }}><option value="">Todos los estados</option><option value="PAID">Pago registrado</option><option value="PENDING">Pendiente</option><option value="FAILED">Fallido</option><option value="EXPIRED">Vencido</option></select></label><button className="admin-button">Filtrar</button></form>
    {payments.length ? <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Historial de compras</caption><thead><tr><th>Compra</th><th>Importe</th><th>Estado</th><th>Fecha</th><th>Detalle</th></tr></thead><tbody>{payments.slice(0, 25).map(payment => <tr key={payment.id}><td>{payment.eventName}<small>{payment.id}</small></td><td>{paymentMoney(payment.amount, payment.currency)}</td><td><span className="admin-badge neutral">{paymentStatusLabel(payment)}</span></td><td>{adminDate(payment.paidAt || payment.createdAt)}</td><td><Link href={`/admin/ventas/${payment.id}`}>Ver compra →</Link></td></tr>)}</tbody></table></div> : <AdminEmpty title="Todavía no hay compras aquí.">Las operaciones de {mode === "live" ? "producción" : "prueba"} aparecerán en este apartado. También puedes ajustar los filtros.</AdminEmpty>}
    <AdminPagination page={page} more={payments.length > 25} href={`/admin/ventas?mode=${mode}&state=${state}&q=${encodeURIComponent(search)}`} />
  </>;
}
