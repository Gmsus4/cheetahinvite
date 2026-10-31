import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiDownload, FiInfo, FiUsers, FiUserPlus, FiXCircle } from "react-icons/fi";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { hasIntegratedRsvp } from "@/lib/rsvp";
import { BrandLoader } from "@/components/BrandLoader";
import { DeleteRsvpButton } from "@/components/dashboard/DeleteRsvpButton";
import { RsvpRefresh } from "@/components/dashboard/RsvpRefresh";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import styles from "./attendance.module.css";

export const metadata: Metadata = { title: "Respuestas de asistencia | Cheetah Invite" };
export default function AttendancePage(props: PageProps<"/dashboard/eventos/[id]/asistencias">) {
  return <Suspense fallback={<BrandLoader message="Cargando las respuestas…" />}><AttendanceData {...props} /></Suspense>;
}
async function AttendanceData({ params, searchParams }: PageProps<"/dashboard/eventos/[id]/asistencias">) {
  await connection();
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${id}/asistencias`)}`);
  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id }, select: { name: true, sections: true } });
  if (!event) notFound();
  const query = await searchParams;
  const page = typeof query.page === "string" && /^\d{1,3}$/.test(query.page) ? Math.max(1, Number(query.page)) : 1;
  const [responses, groups] = await Promise.all([
    prisma.rsvpResponse.findMany({ where: { eventId: id }, select: { id: true, name: true, attending: true, companions: true, updatedAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 50, take: 51 }),
    prisma.rsvpResponse.groupBy({ by: ["attending"], where: { eventId: id }, _count: { _all: true }, _sum: { companions: true } }),
  ]);
  const attending = groups.find(group => group.attending);
  const declined = groups.find(group => !group.attending)?._count._all ?? 0;
  const yes = attending?._count._all ?? 0;
  const extras = attending?._sum.companions ?? 0;
  const totalResponses = yes + declined;
  const stats = [
    { label: "Total de asistentes", value: yes + extras, caption: "Incluye acompañantes", Icon: FiUsers, featured: true },
    { label: "Sí asistirán", value: yes, caption: "Respuestas afirmativas", Icon: FiCheckCircle },
    { label: "Acompañantes", value: extras, caption: "Personas adicionales", Icon: FiUserPlus },
    { label: "No asistirán", value: declined, caption: "Respuestas negativas", Icon: FiXCircle },
  ];
  return <main className={styles.page}>
    <DashboardHeader name={session.user.name || "Usuario"} email={session.user.email || ""} image={session.user.image} />
    <div className={styles.content}>
      <div className={styles.heading}><span className={styles.eyebrow}>TU CELEBRACIÓN · ASISTENCIAS</span><h1>¿Quién viene a celebrar?</h1><p className={styles.eventName}>{event.name}</p><p>Revisa las confirmaciones y prepara cada detalle para tus invitados.</p></div>
      {!hasIntegratedRsvp(event.sections) && <div className={styles.notice}><FiInfo aria-hidden="true" /><p>La confirmación integrada está desactivada. Puedes activarla en la sección Confirmación del editor. Las respuestas anteriores se conservan.</p></div>}
      <dl className={styles.stats}>{stats.map(({ label, value, caption, Icon, featured }) => <div key={label} className={`${styles.stat}${featured ? ` ${styles.featured}` : ""}`}><dt><span className={styles.statIcon}><Icon aria-hidden="true" /></span>{label}</dt><dd>{value}</dd><small>{caption}</small></div>)}</dl>
      <section className={styles.collection} aria-labelledby="responses-heading">
        <div className={styles.collectionHeader}><div><span className={styles.eyebrow}>TU LISTA DE RESPUESTAS</span><h2 id="responses-heading">Confirmaciones <span className={styles.count}>{totalResponses}</span></h2></div><div className={styles.actions}><RsvpRefresh /><a className={styles.export} href={`/api/events/${id}/rsvp/export`}><FiDownload aria-hidden="true" /> Descargar CSV para Excel</a></div></div>
        <div className={styles.tableScroll} role="region" aria-label="Lista de respuestas de asistencia" tabIndex={0}><table className={styles.table}><caption className={styles.srOnly}>Respuestas recibidas · página {page}</caption><thead><tr><th scope="col">Invitado</th><th scope="col">Respuesta</th><th scope="col">Acompañantes</th><th scope="col">Total</th><th scope="col">Actualización</th><th scope="col"><span className={styles.srOnly}>Acciones</span></th></tr></thead><tbody>
          {responses.slice(0, 50).map(response => <tr key={response.id}><th scope="row">{response.name}</th><td><span className={`${styles.badge} ${response.attending ? styles.accepted : styles.declined}`}>{response.attending ? <FiCheck aria-hidden="true" /> : <FiXCircle aria-hidden="true" />}{response.attending ? "Sí asistiré" : "No asistiré"}</span></td><td>{response.companions}</td><td className={styles.total}>{response.attending ? 1 + response.companions : 0}</td><td className={styles.date}>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(response.updatedAt)}</td><td><DeleteRsvpButton eventId={id} responseId={response.id} name={response.name} /></td></tr>)}
          {responses.length === 0 && <tr><td colSpan={6}><div className={styles.empty}><span><FiUsers aria-hidden="true" /></span><h3>{page > 1 ? "No hay más respuestas" : "Aquí empieza la lista de tu celebración"}</h3><p>{page > 1 ? "Vuelve a la página anterior para consultar las confirmaciones recibidas." : "Cuando tus invitados confirmen su asistencia, verás sus respuestas aquí."}</p></div></td></tr>}
        </tbody></table></div>
        <div className={styles.collectionFooter}><span>{totalResponses === 0 ? "Sin respuestas todavía" : `${Math.min((page - 1) * 50 + 1, totalResponses)}–${Math.min((page - 1) * 50 + responses.slice(0, 50).length, totalResponses)} de ${totalResponses} respuestas`}</span><nav aria-label="Páginas de respuestas">{page > 1 && <Link href={`?page=${page - 1}`}><FiArrowLeft aria-hidden="true" /> Más recientes</Link>}{responses.length > 50 && <Link href={`?page=${page + 1}`}>Anteriores <FiArrowRight aria-hidden="true" /></Link>}</nav></div>
      </section>
      <aside className={styles.help}><FiInfo aria-hidden="true" /><p>Los nombres son declarados por quienes responden. Cada respuesta afirmativa puede incluir hasta 5 acompañantes extra. Sin una lista previa de invitados no se calcula quién falta por confirmar.</p></aside>
      <footer className={styles.footer}><span>Todo listo para celebrar contigo.</span><Link href="/ayuda">¿Necesitas ayuda? <FiArrowRight aria-hidden="true" /></Link></footer>
    </div>
  </main>;
}
