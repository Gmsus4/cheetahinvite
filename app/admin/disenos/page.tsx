import Link from "next/link";
import { FiArrowUpRight, FiEdit3, FiPlus } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, AdminEmpty, AdminNotice, eventLabels, adminDate } from "@/components/admin/AdminUI";
import { AdminSubmit } from "@/components/admin/AdminSubmit";
import { createExample, toggleCustomExamples } from "../actions";

export default function DesignsPage(props: PageProps<"/admin/disenos">) {
  return <AdminPageBoundary><DesignsPageData {...props} /></AdminPageBoundary>;
}

async function DesignsPageData({ searchParams }: PageProps<"/admin/disenos">) {
  await requireAdmin();
  const [query, examples, settings] = await Promise.all([searchParams, prisma.showcaseExample.findMany({ include: { event: { select: { eventType: true, contentVersion: true } } }, orderBy: [{ position: "asc" }, { createdAt: "desc" }] }), prisma.siteSettings.findUnique({ where: { id: "site" } })]);
  const customExamples = settings?.useCustomExamples ?? false;
  const heroExamples = examples.filter(example => example.publishedAt && example.showInHero);
  return <>
    <AdminHeading title="Ejemplos con tu estilo." description="Aquí empieza tu colección. Tú eliges los textos, las fotografías y cada detalle; cada nuevo ejemplo se guarda primero como borrador." />
    <AdminNotice success={query.saved} error={query.error} />
    <section className="admin-card" aria-label="Estado de los diseños en el hero">
      <h2>{customExamples ? heroExamples.length ? `${heroExamples.length} ${heroExamples.length === 1 ? "diseño visible" : "diseños visibles"} en el hero` : "El hero no tiene diseños publicados" : "El hero muestra los ejemplos originales"}</h2>
      <p>{customExamples ? heroExamples.length ? "El hero muestra los ejemplos publicados que tienen activada la opción «Mostrar en el hero»." : "Tu colección está activada, pero todavía no hay ejemplos publicados para el hero. Abre «Revisar y publicar» en un diseño y publica su versión guardada." : "Para mostrar tus diseños, publica los ejemplos y activa «Usar mi colección en el hero» al final de esta página."} Guardar un borrador conserva tus cambios; para que aparezcan en el sitio debes publicarlos.</p>
      {customExamples && heroExamples.length > 0 && <Link className="admin-button secondary" href="/?vista=publica#inicio" target="_blank">Ver diseños en el hero<FiArrowUpRight aria-hidden="true" /></Link>}
    </section>
    <section className="admin-card"><details><summary className="admin-inline" style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}><FiPlus aria-hidden="true" />Crear un ejemplo</summary><form action={createExample} className="admin-form" style={{ marginTop: 22 }}><div className="admin-fields"><label>Nombre de tu ejemplo<input name="label" minLength={2} maxLength={100} required placeholder="Escribe el nombre que quieras" /></label><label>Tipo de evento<select name="eventType">{Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label>Nombre del enlace<input name="slug" maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="Opcional, por ejemplo: mi-primer-diseno" /><small>Usa letras minúsculas, números y guiones. Si lo dejas vacío generaremos uno a partir del nombre.</small></label><div className="admin-form-footer"><AdminSubmit pendingLabel="Abriendo el editor…">Crear y abrir editor</AdminSubmit></div></form></details></section>
    {!examples.length ? <AdminEmpty title="Tu colección está por comenzar.">Cuando crees tu primer ejemplo aparecerá aquí. No hemos agregado invitaciones a tu colección.</AdminEmpty> : <div className="admin-grid">{examples.map(example => <article className="admin-card" key={example.id}><div className="admin-example-title"><div><span className="admin-eyebrow">{eventLabels[example.event.eventType]} · ORDEN {example.position}</span><h2 style={{ marginTop: 10 }}>{example.label}</h2><p>{example.publishedAt ? `Publicado ${adminDate(example.publishedAt)}` : "Borrador privado · aún no aparece en el sitio"}</p></div><span className={`admin-badge${example.publishedAt ? "" : " neutral"}`}>{example.publishedAt ? "Publicado" : "Borrador"}</span></div>{example.publishedAt && <p>{customExamples ? example.showInHero ? "Visible en el hero." : "La opción «Mostrar en el hero» está desactivada." : "Activa tu colección para mostrarlo en el hero."}</p>}{example.publishedAt && example.event.contentVersion !== example.publishedVersion && <p>Hay cambios de contenido pendientes de publicar.</p>}<div className="admin-inline"><Link className="admin-button" href={`/admin/disenos/${example.id}`}><FiEdit3 />{example.publishedAt ? "Gestionar ejemplo" : "Revisar y publicar"}</Link>{example.publishedAt && <Link className="admin-button secondary" href={`/ejemplo-invitacion/${example.slug}`} target="_blank">Ver publicado<FiArrowUpRight /></Link>}</div></article>)}</div>}
    <section className="admin-card" style={{ marginTop: 24 }}><h2>Qué ejemplos se muestran en el sitio</h2><p>Los ejemplos originales se conservan mientras preparas tu colección. Activa esta opción cuando quieras que el sitio use exclusivamente tus ejemplos publicados. Si tu colección está vacía, no se mostrará una invitación en el hero.</p><form action={toggleCustomExamples} className="admin-form"><label className="admin-check"><input type="checkbox" name="useCustomExamples" defaultChecked={settings?.useCustomExamples ?? false} />Usar mi colección en el hero</label><div><AdminSubmit secondary>Guardar preferencia</AdminSubmit></div></form></section>
  </>;
}
