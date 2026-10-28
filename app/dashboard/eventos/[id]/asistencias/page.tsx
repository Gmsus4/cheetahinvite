import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { hasIntegratedRsvp } from "@/lib/rsvp";
import { BrandLoader } from "@/components/BrandLoader";
import { DeleteRsvpButton } from "@/components/dashboard/DeleteRsvpButton";
import { RsvpRefresh } from "@/components/dashboard/RsvpRefresh";

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
  return <main className="purchase-history rsvp-dashboard">
    <Link className="purchase-history-action" href={`/dashboard/eventos/${id}`}><FiArrowLeft aria-hidden="true" /> Volver al editor</Link>
    <p className="dashboard-eyebrow">TU EVENTO</p><h1>Respuestas de asistencia</h1><p>{event.name}</p>
    {!hasIntegratedRsvp(event.sections) && <p className="purchase-price-update">La confirmación integrada está desactivada. Puedes activarla en la sección Confirmación del editor. Las respuestas anteriores se conservan.</p>}
    <dl className="rsvp-dashboard-stats"><div><dt>Respuestas afirmativas</dt><dd>{yes}</dd></div><div><dt>No asistirán</dt><dd>{declined}</dd></div><div><dt>Acompañantes extra</dt><dd>{extras}</dd></div><div><dt>Total de asistentes</dt><dd>{yes + extras}</dd></div></dl>
    <div className="rsvp-dashboard-actions"><RsvpRefresh /><a className="purchase-history-action" href={`/api/events/${id}/rsvp/export`}>Descargar CSV para Excel</a></div>
    <p>Este enlace es general: los nombres son declarados por quienes responden. Cada respuesta afirmativa puede incluir hasta 5 acompañantes extra. Sin una lista previa de invitados no se calcula quién falta por confirmar.</p>
    <div className="rsvp-dashboard-table"><table><caption>Respuestas recibidas</caption><thead><tr><th scope="col">Nombre</th><th scope="col">Respuesta</th><th scope="col">Acompañantes</th><th scope="col">Total</th><th scope="col">Actualización</th><th scope="col">Acciones</th></tr></thead><tbody>
      {responses.slice(0, 50).map(response => <tr key={response.id}><th scope="row">{response.name}</th><td>{response.attending ? "Sí asistiré" : "No asistiré"}</td><td>{response.companions}</td><td>{response.attending ? 1 + response.companions : 0}</td><td>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(response.updatedAt)}</td><td><DeleteRsvpButton eventId={id} responseId={response.id} name={response.name} /></td></tr>)}
      {responses.length === 0 && <tr><td colSpan={6}>Aún no hay respuestas en esta página.</td></tr>}
    </tbody></table></div>
    <nav className="purchase-history-pagination" aria-label="Páginas de respuestas">{page > 1 && <Link className="purchase-history-action" href={`?page=${page - 1}`}>Más recientes</Link>}{responses.length > 50 && <Link className="purchase-history-action" href={`?page=${page + 1}`}>Anteriores</Link>}</nav>
  </main>;
}
