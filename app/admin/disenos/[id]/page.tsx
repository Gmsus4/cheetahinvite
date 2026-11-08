import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiEdit3, FiEye } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, AdminNotice, adminDate } from "@/components/admin/AdminUI";
import { AdminSubmit } from "@/components/admin/AdminSubmit";
import { saveExampleSettings, publishExample, unpublishExample, deleteExample, duplicateExample } from "../../actions";

export default function ExamplePage(props: PageProps<"/admin/disenos/[id]">) {
  return <AdminPageBoundary><ExamplePageData {...props} /></AdminPageBoundary>;
}

async function ExamplePageData({ params, searchParams }: PageProps<"/admin/disenos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [query, example] = await Promise.all([searchParams, prisma.showcaseExample.findUnique({ where: { id }, include: { event: { select: { contentVersion: true } } } })]);
  if (!example) notFound();
  return <>
    <Link href="/admin/disenos" className="admin-inline admin-help"><FiArrowLeft />Todos los ejemplos</Link>
    <div style={{ marginTop: 24 }}><AdminHeading title={example.label} description="Edita tu invitación, revisa el resultado y publica una versión cuando esté lista." /></div>
    <AdminNotice success={query.saved} error={query.error} />
    <form action={duplicateExample.bind(null, id)} style={{ marginBottom: 20 }}><AdminSubmit secondary pendingLabel="Duplicando…">Duplicar como borrador</AdminSubmit></form>
    <section className="admin-card"><div className="admin-inline"><Link className="admin-button" href={`/admin/disenos/${id}/editar`}><FiEdit3 />Editar invitación</Link><Link className="admin-button secondary" href={`/admin/disenos/${id}/vista-previa`} target="_blank"><FiEye />Revisar borrador</Link></div><p style={{ marginTop: 18, marginBottom: 0 }}>El editor conserva el mismo diseño y las mismas opciones que usas al crear una invitación. Guardar el borrador conserva la versión publicada hasta que decidas actualizarla.</p></section>
    <div className="admin-grid">
      <section className="admin-card"><h2>Presentación en el sitio</h2><form action={saveExampleSettings.bind(null, id)} className="admin-form"><label>Nombre del ejemplo<input name="label" defaultValue={example.label} minLength={2} maxLength={100} required /></label><label>Orden de aparición<input name="position" type="number" defaultValue={example.position} min="0" max="9999" required /><small>Los números menores aparecen primero.</small></label><label className="admin-check"><input type="checkbox" name="showInHero" defaultChecked={example.showInHero} />Mostrar en el hero</label><div><AdminSubmit>Guardar presentación</AdminSubmit></div></form></section>
      <section className="admin-card"><h2>Publicación</h2><p>{example.publishedAt ? `La versión pública se guardó el ${adminDate(example.publishedAt)}.` : "Este ejemplo aún no está publicado. Su borrador solo está disponible para la administración."}</p>{example.publishedAt && example.publishedVersion !== example.event.contentVersion && <div className="admin-notice">Hay cambios guardados que todavía no se muestran al público.</div>}<p>Enlace: <span style={{ overflowWrap: "anywhere" }}>/ejemplo-invitacion/{example.slug}</span></p><form action={publishExample.bind(null, id)}><input type="hidden" name="version" value={example.event.contentVersion} /><AdminSubmit confirmMessage="¿Publicar el contenido guardado de este ejemplo?">{example.publishedAt ? "Publicar cambios del borrador" : "Publicar ejemplo"}</AdminSubmit></form>{example.publishedAt && <form action={unpublishExample.bind(null, id)} style={{ marginTop: 14 }}><AdminSubmit secondary confirmMessage="¿Retirar este ejemplo del sitio? El borrador se conservará.">Retirar del sitio</AdminSubmit></form>}</section>
    </div>
    {!example.publishedAt && <section className="admin-card" style={{ marginTop: 24 }}><h2>Eliminar este borrador</h2><p>Se eliminará de tu colección junto con sus fotografías almacenadas. Esta acción no se puede deshacer.</p><form action={deleteExample.bind(null, id)}><AdminSubmit secondary confirmMessage="¿Eliminar definitivamente este borrador y sus fotografías?">Eliminar borrador</AdminSubmit></form></section>}
  </>;
}
