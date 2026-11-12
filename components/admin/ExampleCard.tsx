"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight, FiCalendar, FiCopy, FiGlobe, FiImage, FiLogOut, FiEdit3, FiSliders, FiTrash2 } from "react-icons/fi";
import { AdminSubmit } from "./AdminSubmit";
import { duplicateExample, publishExample, unpublishExample, deleteExample, saveExampleCardSettings } from "@/app/admin/actions";
import styles from "@/app/admin/compact.module.css";

type Props = {
  example: { id: string; label: string; slug: string; position: number; showInHero: boolean; publishedAt: Date | null; publishedVersion: number | null; event: { contentVersion: number; imageUrl: string | null; eventDate: Date | null; updatedAt: Date } };
  eventType: string;
};
const date = (value: Date) => new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }).format(value);

export function ExampleCard({ example, eventType }: Props) {
  const [label, setLabel] = useState(example.label);
  const [position, setPosition] = useState(String(example.position));
  const [hero, setHero] = useState(example.showInHero);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const locked = useRef(false);
  const [saved, setSaved] = useState({ label: example.label, position: String(example.position), hero: example.showInHero });
  async function save(next = { label, position, hero }) {
    if (locked.current || JSON.stringify(next) === JSON.stringify(saved)) return;
    if (next.label.trim().length < 2 || !/^\d{1,4}$/.test(next.position)) { setNotice("Revisa el nombre y el orden."); return; }
    locked.current = true; setSaving(true); setNotice("");
    const form = new FormData(); form.set("label", next.label); form.set("position", next.position); if (next.hero) form.set("showInHero", "on");
    try {
      const result = await saveExampleCardSettings(example.id, form);
      if (result.error) setNotice(result.error);
      else { setSaved(next); setNotice("Guardado"); }
    } catch { setNotice("No se guardaron los cambios. Inténtalo de nuevo."); }
    finally { locked.current = false; setSaving(false); }
  }
  const destination = <input type="hidden" name="returnTo" value="collection" />;
  const unsaved = label !== saved.label || position !== saved.position || hero !== saved.hero;
  const published = Boolean(example.publishedAt);
  const changesToPublish = published && example.publishedVersion !== example.event.contentVersion;
  return <article className={styles.exampleCard} aria-label={example.label}>
    <div className={styles.exampleCover}>
      {example.event.imageUrl ? <Image src={example.event.imageUrl} alt="" fill unoptimized sizes="(max-width: 700px) 100vw, 50vw" /> : <FiImage className={styles.examplePlaceholder} aria-hidden="true" />}
      <div className={styles.exampleStatusControls}>
        <span className={styles.exampleStatus} data-published={Boolean(example.publishedAt)}><i aria-hidden="true" />{example.publishedAt ? "Publicado" : "Borrador"}</span>
        <label className={styles.exampleOrder}>Orden<input aria-label={`Orden de ${example.label}`} type="number" min="0" max="9999" required value={position} disabled={saving} onChange={e => setPosition(e.target.value)} onBlur={() => void save()} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} /></label>
      </div>
      <span className={styles.exampleType}>{eventType}</span>
      <label className={styles.exampleName}><input aria-label={`Nombre del ejemplo: ${example.label}`} value={label} minLength={2} maxLength={100} required disabled={saving} onChange={e => setLabel(e.target.value)} onBlur={() => void save()} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} /><FiEdit3 aria-hidden="true" /></label>
      <span className={styles.exampleDate}><FiCalendar aria-hidden="true" />{example.event.eventDate ? date(example.event.eventDate) : "Fecha por definir"}</span>
      <div className={styles.exampleCoverFooter}><span>Actualizado {date(example.event.updatedAt)}</span></div>
    </div>
    <section className={styles.exampleDraft} aria-label="Edición del borrador">
      <div className={styles.exampleSectionHeading}><strong>Editar borrador</strong>{changesToPublish && <span>Cambios por publicar</span>}</div>
      <div className={styles.exampleActions}>
      <Link className="admin-button" href={`/admin/disenos/${example.id}/editar`}><FiEdit3 aria-hidden="true" />Editar información</Link>
      <Link className="admin-button secondary" href={`/admin/disenos/${example.id}/vista-previa`} target="_blank" rel="noopener noreferrer"><FiSliders aria-hidden="true" />Editar diseño</Link>
      </div>
    </section>
    <section className={styles.examplePublication} aria-label="Publicación del ejemplo">
      <div className={styles.exampleSectionHeading}><strong>{published ? "Versión publicada" : "Sin publicar"}</strong>{published && <Link href={`/ejemplo-invitacion/${example.slug}`} target="_blank" rel="noopener noreferrer">Ver publicado<FiArrowUpRight aria-hidden="true" /></Link>}</div>
      {changesToPublish && <p>Hay cambios guardados en el borrador. Pulsa «Publicar cambios» para que aparezcan en «Ver publicado».</p>}
      <label className={styles.exampleHeroToggle}><input type="checkbox" role="switch" checked={hero} disabled={saving} onChange={e => { const value = e.target.checked; setHero(value); void save({ label, position, hero: value }); }} /><span aria-hidden="true" />Mostrar en la portada de inicio</label>
      {!published && hero && <p>Visible al publicar, si la colección está activa.</p>}
      <div className={styles.examplePublicationActions}>
        <form action={publishExample.bind(null, example.id)}>{destination}<input type="hidden" name="version" value={example.event.contentVersion} /><AdminSubmit className={`admin-button ${published ? "secondary" : ""}`} icon={<><FiGlobe aria-hidden="true" /><span>{published ? "Publicar cambios" : "Publicar ejemplo"}</span></>} pendingLabel="Publicando…" disabled={saving || unsaved || (published && !changesToPublish)} confirmTitle={published ? "Publicar cambios" : "Publicar ejemplo"} confirmMessage={published ? "La versión pública se reemplazará con el contenido guardado del borrador. ¿Publicar los cambios?" : "Este ejemplo estará disponible mediante su enlace público. ¿Publicarlo ahora?"}>{published ? "Publicar cambios" : "Publicar ejemplo"}</AdminSubmit></form>
        {published && <form action={unpublishExample.bind(null, example.id)}>{destination}<AdminSubmit secondary icon={<><FiLogOut aria-hidden="true" /><span>Volver a borrador</span></>} pendingLabel="Retirando…" disabled={saving || unsaved} confirmTitle="Volver a borrador" confirmMessage="El ejemplo dejará de estar disponible en su enlace público y en la portada. Conservarás el borrador para seguir editándolo.">Volver a borrador</AdminSubmit></form>}
      <form action={duplicateExample.bind(null, example.id)}>{destination}<AdminSubmit secondary icon={<><FiCopy aria-hidden="true" /><span title="Duplicar como borrador">Duplicar</span></>} pendingLabel="Duplicando…" disabled={saving || unsaved}>Duplicar como borrador</AdminSubmit></form>
      {!published && <form action={deleteExample.bind(null, example.id)}>{destination}<AdminSubmit secondary icon={<><FiTrash2 aria-hidden="true" /><span>Eliminar borrador</span></>} pendingLabel="Eliminando…" disabled={saving || unsaved} confirmTitle="Eliminar borrador" confirmMessage="¿Eliminar definitivamente este borrador y sus fotografías?">Eliminar borrador</AdminSubmit></form>}
      </div>
    </section>

    {(saving || notice || unsaved) && <div className={styles.exampleSaveStatus} role="status">{saving ? "Guardando…" : notice || "Cambios sin guardar"}{unsaved && !saving && <button type="button" onClick={() => void save()}>Reintentar guardar</button>}</div>}
  </article>;
}
