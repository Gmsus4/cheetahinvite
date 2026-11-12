import { AdminDialog } from "@/components/admin/AdminDialog";
import styles from "../compact.module.css";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-access";
import { analyticsRange } from "@/lib/admin-validation";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { paymentMoney } from "@/lib/payment-status";
import { AdminPageBoundary, AdminHeading, adminDate, AdminEmpty } from "@/components/admin/AdminUI";

export default function StatisticsPage(props: PageProps<"/admin/estadisticas">) {
  return <AdminPageBoundary><StatisticsPageData {...props} /></AdminPageBoundary>;
}

async function StatisticsPageData({ searchParams }: PageProps<"/admin/estadisticas">) {
  await requireAdmin();
  const query = await searchParams;
  const { days, from, to } = analyticsRange(query.days);
  const window = { gte: from, lte: to };
  const [sales, drafts, courtesy, visits, selections, popular, trend] = await Promise.all([
    prisma.invitationPayment.aggregate({ where: { status: "PAID", livemode: true, paidAt: window }, _count: true, _sum: { amount: true, refundedAmount: true } }),
    prisma.event.count({ where: { isExample: false, createdAt: window } }),
    prisma.courtesyGrant.count({ where: { grantedAt: window } }),
    prisma.analyticsEvent.count({ where: { kind: "landing_view", createdAt: window } }),
    prisma.analyticsEvent.count({ where: { kind: "example_select", createdAt: window } }),
    prisma.analyticsEvent.groupBy({ by: ["exampleSlug"], where: { kind: "example_select", createdAt: window }, _count: true, orderBy: { _count: { exampleSlug: "desc" } }, take: 10 }),
    prisma.$queryRaw<{ day: string; amount: number }[]>(Prisma.sql`SELECT to_char("paidAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') AS day, SUM("amount" - "refundedAmount")::float8 AS amount FROM "InvitationPayment" WHERE "status" = 'PAID' AND "livemode" = true AND "paidAt" >= ${from} AND "paidAt" <= ${to} GROUP BY 1 ORDER BY 1`),
  ]);
  const names = await prisma.showcaseExample.findMany({ where: { slug: { in: popular.map(p => p.exampleSlug) } }, select: { slug: true, label: true } });
  const chartDays = Array.from({ length: days }, (_, i) => {
    const date = new Date(to.getTime() - (days - i - 1) * 86400000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    return { date, amount: trend.find(t => t.day === key)?.amount || 0 };
  });
  const maximum = Math.max(1, ...chartDays.map(day => day.amount));
  const stats = [
    ["Cobros menos reembolsos", paymentMoney((sales._sum.amount || 0) - (sales._sum.refundedAmount || 0), "mxn"), "Producción · antes de comisiones y disputas"],
    ["Compras confirmadas", String(sales._count), "Pagos de producción confirmados en el periodo"],
    ["Invitaciones creadas", String(drafts), "Incluye borradores; excluye ejemplos"],
    ["Visitas estimadas al inicio", String(visits), "Una por sesión del navegador y día"],
    ["Selecciones de ejemplos", String(selections), "Interacciones en el hero durante el periodo"],
    ["Cortesías otorgadas", String(courtesy), "Se contabilizan fuera de las ventas"],
  ];
  return <div className={`${styles.compact} ${styles.statistics}`}>
    <AdminHeading title="Estadísticas" description="Compras y actividad del sitio durante el periodo seleccionado." />
    <div className="admin-periods">{[7, 30, 90].map(period => <Link href={`/admin/estadisticas?days=${period}`} key={period} aria-current={days === period ? "page" : undefined}>Últimos {period} días</Link>)}</div>
    <div className="admin-stats">{stats.map(([label, value, caption]) => <article className="admin-stat" key={label}><span className="admin-stat-label">{label}</span><strong>{value}</strong><small>{caption}</small></article>)}</div>
    <div className={styles.analyticsGrid}><section className="admin-card"><h2>Compras por día</h2><p>Importes cobrados menos los reembolsos confirmados de esas compras. Datos de producción.</p><div className="admin-chart" role="img" aria-label={`Cobros menos reembolsos de los últimos ${days} días: ${paymentMoney((sales._sum.amount || 0) - (sales._sum.refundedAmount || 0), "mxn")}. Consulta el detalle con «Ver importes por día».`}>{chartDays.map(day => <div key={day.date.toISOString()} className="admin-chart-day" title={`${adminDate(day.date)}: ${paymentMoney(day.amount, "mxn")}`}><span style={{ height: `${Math.max(1, day.amount / maximum * 100)}%`, opacity: day.amount ? 1 : .15 }} /></div>)}</div><div className="admin-chart-legend"><span>{adminDate(chartDays[0].date)}</span><span>{adminDate(to)}</span></div><div className={styles.dailyDetails}><AdminDialog label="Ver importes por día" title="Importes por día"><table className="admin-table"><thead><tr><th>Fecha</th><th>Importe</th></tr></thead><tbody>{chartDays.map(day => <tr key={day.date.toISOString()}><td>{adminDate(day.date)}</td><td>{paymentMoney(day.amount, "mxn")}</td></tr>)}</tbody></table></AdminDialog></div></section><div>
    <h2 className="admin-section-title">Qué ejemplos despiertan interés</h2>
    {popular.length ? <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Ejemplos más seleccionados en el hero</caption><thead><tr><th>Ejemplo</th><th>Selecciones</th></tr></thead><tbody>{popular.map(item => <tr key={item.exampleSlug}><td>{names.find(n => n.slug === item.exampleSlug)?.label || item.exampleSlug}</td><td>{item._count}</td></tr>)}</tbody></table></div> : <AdminEmpty title="Pronto conocerás sus favoritos.">Las selecciones que hagan tus visitantes en el hero aparecerán aquí.</AdminEmpty>}
    </div></div>
    <p className="admin-help">La medición de visitas es aproximada: respeta las preferencias de privacidad del navegador, no usa cookies y deduplica las interacciones por sesión y día. Los datos de navegación se conservan durante un máximo aproximado de 90 días.</p>
  </div>;
}
