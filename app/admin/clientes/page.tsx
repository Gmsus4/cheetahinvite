import styles from "../compact.module.css";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { adminPage } from "@/lib/admin-validation";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, AdminEmpty, AdminPagination } from "@/components/admin/AdminUI";

export default function ClientsPage(props: PageProps<"/admin/clientes">) {
  return <AdminPageBoundary><ClientsPageData {...props} /></AdminPageBoundary>;
}

async function ClientsPageData({ searchParams }: PageProps<"/admin/clientes">) {
  await requireAdmin();
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const page = adminPage(query.page);
  const clients = await prisma.user.findMany({ where: search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}, select: { id: true, name: true, email: true, role: true, _count: { select: { events: { where: { isExample: false } } } } }, orderBy: { id: "desc" }, skip: (page - 1) * 25, take: 26 });
  return <div className={styles.compact}>
    <AdminHeading title="Clientes" description="Busca una cuenta y consulta sus invitaciones, compras y cortesías." />
    <form className="admin-search" role="search"><label><span className="admin-visually-hidden">Nombre o correo del cliente</span><input name="q" maxLength={100} defaultValue={search} placeholder="Buscar por nombre o correo" /></label><button className="admin-button" type="submit"><FiSearch />Buscar</button></form>
    {clients.length ? <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Cuentas de clientes</caption><thead><tr><th>Cliente</th><th>Cuenta</th><th>Invitaciones</th><th>Detalle</th></tr></thead><tbody>{clients.slice(0, 25).map(client => <tr key={client.id}><td>{client.name || "Sin nombre"}<small>{client.email || "Sin correo registrado"}</small></td><td><span className={`admin-badge${client.role === "ADMIN" ? "" : " neutral"}`}>{client.role === "ADMIN" ? "Administración" : "Cliente"}</span></td><td>{client._count.events}</td><td><Link href={`/admin/clientes/${client.id}`}>Ver cliente →</Link></td></tr>)}</tbody></table></div> : <AdminEmpty title="No encontramos cuentas.">Prueba con otro nombre o correo.</AdminEmpty>}
    <AdminPagination page={page} more={clients.length > 25} href={`/admin/clientes?q=${encodeURIComponent(search)}`} />
  </div>;
}
