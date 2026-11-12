import { ExampleCard } from "@/components/admin/ExampleCard";
import { ExampleRefreshOnReturn } from "@/components/admin/ExampleRefreshOnReturn";
import { AdminDialog } from "@/components/admin/AdminDialog";
import styles from "../compact.module.css";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, AdminEmpty, AdminNotice, eventLabels } from "@/components/admin/AdminUI";
import { AdminSubmit } from "@/components/admin/AdminSubmit";
import { createExample, toggleCustomExamples } from "../actions";

export default function DesignsPage(props: PageProps<"/admin/disenos">) {
  return <AdminPageBoundary><DesignsPageData {...props} /></AdminPageBoundary>;
}

async function DesignsPageData({ searchParams }: PageProps<"/admin/disenos">) {
  await requireAdmin();
  const [query, examples, settings] = await Promise.all([searchParams, prisma.showcaseExample.findMany({ include: { event: { select: { eventType: true, contentVersion: true, imageUrl: true, eventDate: true, updatedAt: true } } }, orderBy: [{ position: "asc" }, { createdAt: "desc" }] }), prisma.siteSettings.findUnique({ where: { id: "site" } })]);
  const customExamples = settings?.useCustomExamples ?? false;
  const heroExamples = examples.filter(example => example.publishedAt && example.showInHero);
  const drafts = examples.filter(example => !example.publishedAt);
  const published = examples.filter(example => example.publishedAt);
  return <div className={`${styles.compact} ${styles.designs}`}>
    <ExampleRefreshOnReturn />
    <AdminHeading title="Diseños y ejemplos" description="Crea, publica y organiza los ejemplos de tu colección."><AdminDialog label="Crear ejemplo" title="Nuevo ejemplo" primary><form action={createExample} className="admin-form"><div className="admin-fields"><label>Nombre de tu ejemplo<input name="label" minLength={2} maxLength={100} required placeholder="Escribe el nombre que quieras" /></label><label>Tipo de evento<select name="eventType">{Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label>Nombre del enlace<input name="slug" maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="Opcional, por ejemplo: mi-primer-diseno" /><small>Usa letras minúsculas, números y guiones. Si lo dejas vacío generaremos uno a partir del nombre.</small></label><div className="admin-form-footer"><AdminSubmit pendingLabel="Abriendo el editor…">Crear y abrir editor</AdminSubmit></div></form></AdminDialog></AdminHeading>
    <AdminNotice success={query.saved} error={query.error} />
    <div className={styles.designTools}>
    <section className="admin-card" aria-label="Estado de los diseños en la portada de inicio">
      <h2>{customExamples ? heroExamples.length ? `${heroExamples.length} ${heroExamples.length === 1 ? "diseño visible" : "diseños visibles"} en la portada de inicio` : "La portada de inicio no tiene diseños publicados" : "La portada de inicio muestra los ejemplos originales"}</h2>
      <p>{customExamples ? heroExamples.length ? "La portada de inicio muestra los ejemplos publicados que tienen activada la opción «Mostrar en la portada de inicio»." : "Tu colección está activada, pero todavía no hay ejemplos publicados para la portada de inicio. Usa «Publicar ejemplo» en un borrador para mostrar su versión guardada." : "Para mostrar tus diseños, publica los ejemplos y activa «Usar mi colección en la portada de inicio»."} Guardar un borrador conserva tus cambios; para que aparezcan en el sitio debes publicarlos.</p>
      {customExamples && heroExamples.length > 0 && <Link className="admin-button secondary" href="/?vista=publica#inicio" target="_blank">Ver diseños en la portada de inicio<FiArrowUpRight aria-hidden="true" /></Link>}
    </section>
    <section className="admin-card"><h2>Publicación de la colección</h2><p>Usa exclusivamente tus ejemplos publicados. Si tu colección está vacía, la portada de inicio no mostrará invitaciones.</p><form action={toggleCustomExamples} className="admin-form"><label className="admin-check"><input type="checkbox" name="useCustomExamples" defaultChecked={settings?.useCustomExamples ?? false} />Usar mi colección en la portada de inicio</label><div><AdminSubmit secondary>Guardar preferencia</AdminSubmit></div></form></section>
    </div>
    {!examples.length ? <AdminEmpty title="Tu colección está por comenzar.">Cuando crees tu primer ejemplo aparecerá aquí. No hemos agregado invitaciones a tu colección.</AdminEmpty> : <>
      <section className={styles.exampleCollection} aria-labelledby="drafts-title">
        <h2 id="drafts-title" className={styles.exampleCollectionHeading}>Borradores<span>{drafts.length}</span></h2>
        <p>Ejemplos privados en preparación. Publicarlos es un paso aparte.</p>
        {drafts.length ? <div className={styles.exampleGrid}>{drafts.map(example => <ExampleCard key={example.id} example={example} eventType={eventLabels[example.event.eventType]} />)}</div> : <p>No tienes borradores. Crea un ejemplo para empezar.</p>}
      </section>
      <section className={styles.exampleCollection} aria-labelledby="published-title">
        <h2 id="published-title" className={styles.exampleCollectionHeading}>Publicados<span>{published.length}</span></h2>
        <p>Disponibles en su enlace público. Puedes editar su borrador y publicar los cambios cuando estén listos.</p>
        {published.length ? <div className={styles.exampleGrid}>{published.map(example => <ExampleCard key={example.id} example={example} eventType={eventLabels[example.event.eventType]} />)}</div> : <p>Aún no hay ejemplos publicados.</p>}
      </section>
    </>}

  </div>;
}
