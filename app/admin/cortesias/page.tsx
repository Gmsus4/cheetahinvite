import { AdminDialog } from "@/components/admin/AdminDialog";
import styles from "../compact.module.css";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-access";
import { adminPage } from "@/lib/admin-validation";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, AdminNotice, AdminEmpty, AdminPagination, adminDate } from "@/components/admin/AdminUI";
import { AdminSubmit } from "@/components/admin/AdminSubmit";
import { createCourtesy, removeCourtesy } from "../actions";

export default function CourtesyPage(props: PageProps<"/admin/cortesias">) {
  return <AdminPageBoundary><CourtesyPageData {...props} /></AdminPageBoundary>;
}

async function CourtesyPageData({ searchParams }: PageProps<"/admin/cortesias">) {
  await requireAdmin();
  const query = await searchParams;
  const page = adminPage(query.page);
  const email = typeof query.cliente === "string" ? query.cliente.trim().toLowerCase().slice(0, 254) : "";
  const [client, grants] = await Promise.all([
    email ? prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true, name: true, email: true, events: { where: { isExample: false, paidAt: null, complimentaryAt: null, status: { in: ["DRAFT", "PENDING_PAYMENT", "EXPIRED"] } }, select: { id: true, name: true }, take: 100 } } }) : null,
    prisma.courtesyGrant.findMany({ orderBy: [{ grantedAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 26 }),
  ]);
  const owners = await prisma.user.findMany({ where: { id: { in: grants.map(g => g.ownerId) } }, select: { id: true, name: true, email: true } });
  const events = await prisma.event.findMany({ where: { id: { in: grants.map(g => g.eventId) } }, select: { id: true, name: true } });
  const defaultExpiry = new Date(); defaultExpiry.setUTCFullYear(defaultExpiry.getUTCFullYear() + 1);
  return <div className={styles.compact}>
    <AdminHeading title="Cortesías" description="Publicaciones sin cobro, con su vigencia e historial separados de las ventas." />
    <AdminNotice success={query.saved} error={query.error} />
    <div className={styles.courtesyLayout}><section className="admin-card"><h2>Otorgar una cortesía</h2><p>Busca la cuenta y elige una invitación que ya haya creado. La vigencia comienza al otorgarla; podrá publicarla cuando complete sus datos y elija su privacidad.</p><form className="admin-search"><label><span className="admin-visually-hidden">Correo de la cuenta</span><input type="email" name="cliente" maxLength={254} defaultValue={email} required placeholder="Correo del cliente o colaborador" /></label><button className="admin-button">Buscar cuenta</button></form>
      {email && !client && <p role="status">No encontramos una cuenta con ese correo.</p>}
      {client && (client.events.length ? <form className="admin-form" action={createCourtesy}><input type="hidden" name="ownerId" value={client.id} /><input type="hidden" name="email" value={client.email || ""} /><div className="admin-fields"><label>Invitación de {client.name || client.email}<select name="eventId" required>{client.events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label><label>Último día de vigencia<input type="date" name="expiresAt" defaultValue={defaultExpiry.toISOString().slice(0, 10)} required /><small>Vigente hasta las 23:59 del día seleccionado (hora del centro de México).</small></label></div><label>Motivo de la cortesía<textarea name="reason" required minLength={5} maxLength={500} placeholder="Colaboración, atención de soporte u otro motivo" /></label><div><AdminSubmit confirmTitle="¿Otorgar esta cortesía?" confirmMessage="La invitación tendrá publicación gratuita hasta la fecha que elegiste. El cliente verá un aviso en su panel y podrá publicarla sin pagar." pendingLabel="Otorgando cortesía…">Otorgar cortesía</AdminSubmit></div></form> : <p>Esta cuenta no tiene invitaciones elegibles. El cliente debe crear un borrador; las invitaciones con pago o cortesía vigente no se pueden seleccionar.</p>)}
    </section>
    <div className={styles.courtesyHistory}><h2 className="admin-section-title">Historial de cortesías</h2>
    {grants.length ? <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Cortesías otorgadas y retiradas</caption><thead><tr><th>Cliente e invitación</th><th>Motivo</th><th>Vigencia</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{grants.slice(0, 25).map(grant => { const owner = owners.find(o => o.id === grant.ownerId); const event = events.find(e => e.id === grant.eventId); return <tr key={grant.id}><td>{owner ? <Link href={`/admin/clientes/${owner.id}`}>{owner.name || owner.email}</Link> : "Cuenta eliminada"}<small>{event?.name || "Invitación eliminada"}</small></td><td>{grant.reason}<small>Otorgada {adminDate(grant.grantedAt)}</small></td><td>{adminDate(grant.expiresAt)}</td><td><span className={`admin-badge${grant.revokedAt || grant.expiresAt <= new Date() ? " neutral" : ""}`}>{grant.revokedAt ? "Retirada" : grant.expiresAt <= new Date() ? "Vencida" : "Vigente"}</span></td><td>{!grant.revokedAt && event && <AdminDialog label="Retirar cortesía" title="Retirar cortesía"><form action={removeCourtesy.bind(null, grant.id)} className="admin-form"><label>Motivo<textarea name="reason" minLength={5} maxLength={500} required /></label><AdminSubmit secondary confirmMessage="¿Retirar esta cortesía? La invitación dejará de estar publicada si depende de ella.">Retirar</AdminSubmit></form></AdminDialog>}</td></tr>; })}</tbody></table></div> : <AdminEmpty title="Todavía no has otorgado cortesías.">Aquí podrás consultar a quién regalaste una publicación, su motivo y su vigencia.</AdminEmpty>}
    <AdminPagination page={page} more={grants.length > 25} href={`/admin/cortesias?cliente=${encodeURIComponent(email)}`} />
    </div></div>
  </div>;
}
