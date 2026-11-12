import styles from "../compact.module.css";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { getCurrentPrice } from "@/lib/site-pricing";
import { paymentMoney } from "@/lib/payment-status";
import { AdminPageBoundary, AdminHeading, AdminNotice, adminDate } from "@/components/admin/AdminUI";
import { AdminSubmit } from "@/components/admin/AdminSubmit";
import { savePrice, cancelScheduledPrice } from "../actions";

export default function PricePage(props: PageProps<"/admin/precio">) {
  return <AdminPageBoundary><PricePageData {...props} /></AdminPageBoundary>;
}

async function PricePageData({ searchParams }: PageProps<"/admin/precio">) {
  await requireAdmin();
  const [query, current, history] = await Promise.all([searchParams, getCurrentPrice(), prisma.priceRevision.findMany({ orderBy: { effectiveAt: "desc" }, take: 50 })]);
  const now = new Date();
  return <div className={`${styles.compact} ${styles.pricing}`}>
    <AdminHeading title="Precio de publicación" description="Gestiona el precio actual y programa cambios. Las compras realizadas conservan su importe." />
    <AdminNotice success={query.saved} error={query.error} />
    <div className="admin-grid">
      <section className="admin-card"><span className="admin-eyebrow">PRECIO VIGENTE</span><div className="admin-price-amount">{current.label}<small style={{ fontSize: 13, letterSpacing: 0 }}> MXN</small></div><p>IVA incluido · Un pago por evento · {current.months} meses activa.</p><span className="admin-badge">Aplicado al sitio y a nuevas compras</span></section>
      <section className="admin-card"><h2>Preparar un cambio</h2><p>Se actualizarán el precio del sitio y los nuevos intentos de pago. Las sesiones pendientes se revisan antes de reemplazarlas.</p><form className="admin-form" action={savePrice}>
        <input type="hidden" name="expectedPriceId" value={current.id} />
        <div className="admin-fields"><label>Precio en pesos mexicanos<input name="amount" type="number" inputMode="decimal" min="10" max="999999" step="0.01" defaultValue={current.amount / 100} required /><small>Precio final con IVA incluido.</small></label>
        <label>Aplicar a partir de<input name="effectiveAt" type="datetime-local" /><small>Opcional. Hora de Ciudad de México. Déjalo vacío para aplicar al guardar.</small></label></div>
        <label>Motivo del cambio<textarea name="reason" minLength={3} maxLength={240} required placeholder="¿Por qué cambias el precio?" /></label>
        <div className="admin-form-footer"><AdminSubmit>Guardar precio</AdminSubmit></div>
      </form></section>
    </div>
    <h2 className="admin-section-title">Historial de precios</h2>
    <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Precio vigente y cambios programados</caption><thead><tr><th>Precio</th><th>Desde</th><th>Estado</th><th>Motivo</th><th>Acción</th></tr></thead><tbody>
      {history.map(price => <tr key={price.id}><td>{paymentMoney(price.amount, price.currency)} MXN</td><td>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(price.effectiveAt)}</td><td><span className={`admin-badge${price.id !== current.id ? " neutral" : ""}`}>{price.cancelledAt ? "Cancelado" : price.id === current.id ? "Vigente" : price.effectiveAt > now ? "Programado" : "Anterior"}</span></td><td>{price.reason}<small>Guardado {adminDate(price.createdAt)}</small></td><td>{!price.cancelledAt && price.effectiveAt > now && <form action={cancelScheduledPrice.bind(null, price.id)}><AdminSubmit secondary confirmMessage="¿Cancelar este cambio de precio programado?">Cancelar</AdminSubmit></form>}</td></tr>)}
      <tr><td>$269.00 MXN</td><td>Configuración inicial</td><td><span className={`admin-badge${current.id === "default" ? "" : " neutral"}`}>{current.id === "default" ? "Vigente" : "Anterior"}</span></td><td>Precio base del sitio</td><td>—</td></tr>
    </tbody></table></div>
  </div>;
}
