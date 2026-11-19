import styles from "../compact.module.css";
import Link from "next/link";
import { FiSearch, FiUser } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { adminPage, adminRegistrationRange } from "@/lib/admin-validation";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, AdminEmpty, AdminNotice, AdminPagination, adminDate } from "@/components/admin/AdminUI";

export default function ClientsPage(props: PageProps<"/admin/clientes">) {
  return <AdminPageBoundary><ClientsPageData {...props} /></AdminPageBoundary>;
}

async function ClientsPageData({ searchParams }: PageProps<"/admin/clientes">) {
  await requireAdmin();
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const page = adminPage(query.page);
  const range = adminRegistrationRange(query.from, query.to);
  const clients = range.error ? [] : await prisma.user.findMany({
    where: {
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {}),
      ...(range.createdAt ? { createdAt: range.createdAt } : {}),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { events: { where: { isExample: false } } } } },
    orderBy: { id: "desc" }, skip: (page - 1) * 25, take: 26,
  });
  const filters = new URLSearchParams({ q: search });
  if (range.from) filters.set("from", range.from);
  if (range.to) filters.set("to", range.to);
  return <div className={styles.compact}>
    <AdminHeading title="Clientes" description="Busca una cuenta y consulta sus invitaciones, compras y cortesías." />
    <form className={`admin-search ${styles.clientSearch}`} role="search" action="/admin/clientes">
      <label>Nombre o correo<input name="q" maxLength={100} defaultValue={search} placeholder="Buscar por nombre o correo" /></label>
      <label className={styles.clientDate}>Registro desde<input type="date" name="from" min="0001-01-01" max={range.to || "9999-12-31"} defaultValue={range.from} /></label>
      <label className={styles.clientDate}>Registro hasta<input type="date" name="to" min={range.from || "0001-01-01"} max="9999-12-31" defaultValue={range.to} /></label>
      <button className="admin-button" type="submit"><FiSearch aria-hidden="true" />Buscar</button>
      {(search || range.from || range.to || range.error) && <Link className="admin-button secondary" href="/admin/clientes">Limpiar filtros</Link>}
    </form>
    <p className="admin-help">Fechas de registro en hora del centro de México. Las cuentas sin fecha registrada solo aparecen al buscar sin fechas.</p>
    <AdminNotice error={range.error} />
    {!range.error && (clients.length ? <div className="admin-table-wrap">
      <table className={`admin-table ${styles.clientTable}`}>
        <caption className="admin-visually-hidden">Cuentas de clientes</caption>
        <thead><tr><th scope="col">Cliente</th><th scope="col">Cuenta</th><th scope="col">Registro</th><th scope="col">Invitaciones</th><th scope="col" className={styles.clientActionCell}>Acciones</th></tr></thead>
        <tbody>{clients.slice(0, 25).map(client => <tr key={client.id}>
          <td>{client.name || "Sin nombre"}<small>{client.email || "Sin correo registrado"}</small></td>
          <td><span className={`admin-badge${client.role === "ADMIN" ? "" : " neutral"}`}>{client.role === "ADMIN" ? "Administración" : "Cliente"}</span></td>
          <td>{client.createdAt ? <time dateTime={client.createdAt.toISOString()}>{adminDate(client.createdAt)}</time> : "Sin fecha registrada"}</td>
          <td>{client._count.events}</td>
          <td className={styles.clientActionCell}>
            <Link className={`admin-button secondary ${styles.clientAction}`} href={`/admin/clientes/${client.id}`}>
              <FiUser aria-hidden="true" />Ver cliente<span className="admin-visually-hidden">: {client.name || client.email || "Sin nombre"}</span>
            </Link>
          </td>
        </tr>)}</tbody>
      </table>
    </div> : <AdminEmpty title="No encontramos cuentas.">Prueba con otro nombre, correo o rango de fechas.</AdminEmpty>)}
    {!range.error && <AdminPagination page={page} more={clients.length > 25} href={`/admin/clientes?${filters}`} />}
  </div>;
}
