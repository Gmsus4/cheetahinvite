import { AdminSubmit } from "./AdminSubmit";
import { adminDate } from "./AdminUI";
import { saveExampleSettings, publishExample, unpublishExample, duplicateExample, deleteExample } from "@/app/admin/actions";
import styles from "./ExampleSettings.module.css";

type Example = {
  id: string; label: string; slug: string; position: number; showInHero: boolean;
  publishedAt: Date | null; publishedVersion: number | null;
  event: { contentVersion: number };
};

export function ExampleSettings({ example, collection = false }: { example: Example; collection?: boolean }) {
  const destination = <input type="hidden" name="returnTo" value={collection ? "collection" : "example"} />;
  return <div className={styles.settings}>
    <section>
      <h3>Presentación en el sitio</h3>
      <form action={saveExampleSettings.bind(null, example.id)} className="admin-form">
        {destination}
        <div className={styles.fields}>
          <label>Nombre del ejemplo<input name="label" defaultValue={example.label} minLength={2} maxLength={100} required /></label>
          <label>Orden<input name="position" type="number" defaultValue={example.position} min="0" max="9999" required /></label>
        </div>
        <label className="admin-check"><input type="checkbox" name="showInHero" defaultChecked={example.showInHero} />Mostrar en el hero</label>
        <div><AdminSubmit>Guardar presentación</AdminSubmit></div>
      </form>
    </section>
    <section>
      <h3>Publicación</h3>
      <p>{example.publishedAt ? `Publicado el ${adminDate(example.publishedAt)}. Guardar el borrador no modifica esta versión.` : "Borrador privado. Publícalo cuando esté listo."}</p>
      {example.publishedAt && example.publishedVersion !== example.event.contentVersion && <p className={styles.pending}>Hay cambios guardados pendientes de publicar.</p>}
      <p className={styles.link}>Enlace: /ejemplo-invitacion/{example.slug}</p>
      <div className={styles.actions}>
        <form action={publishExample.bind(null, example.id)}>{destination}<input type="hidden" name="version" value={example.event.contentVersion} /><AdminSubmit confirmMessage="¿Publicar el contenido guardado de este ejemplo?">{example.publishedAt ? "Publicar cambios" : "Publicar ejemplo"}</AdminSubmit></form>
        {example.publishedAt && <form action={unpublishExample.bind(null, example.id)}>{destination}<AdminSubmit secondary confirmMessage="¿Retirar este ejemplo del sitio? El borrador se conservará.">Retirar del sitio</AdminSubmit></form>}
      </div>
    </section>
    <section className={styles.actions} aria-label="Otras acciones">
      <form action={duplicateExample.bind(null, example.id)}>{destination}<AdminSubmit secondary pendingLabel="Duplicando…">Duplicar como borrador</AdminSubmit></form>
      {!example.publishedAt && <form action={deleteExample.bind(null, example.id)}>{destination}<AdminSubmit secondary confirmMessage="¿Eliminar definitivamente este borrador y sus fotografías?">Eliminar borrador</AdminSubmit></form>}
    </section>
  </div>;
}
