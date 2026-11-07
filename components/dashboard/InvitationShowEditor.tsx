"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { FiArrowLeft, FiCheck, FiEdit3, FiImage, FiMapPin, FiSave, FiSliders, FiX } from "react-icons/fi";
import { updateEvent } from "@/app/dashboard/eventos/[id]/actions";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import { changeGuidedEventType, initialGuidedValues } from "@/lib/guided-invitation";
import { getInvitationEventContent, invitationEventTypes } from "@/lib/invitation-event-content";
import { editorFormData, type EditorValues, type EventData, type InvitationEditTarget, type InviteSection } from "@/lib/invitation-editor";
import { sharedInvitationDesign } from "@/lib/shared-invitation";
import { CloudinaryImageUpload } from "./CloudinaryImageUpload";
import { EditorLeaveDialog } from "./EditorLeaveDialog";
import { EditorProtectedLink } from "./EditorProtectedLink";
import { EditorRecoveryDialog } from "./EditorRecoveryDialog";
import { InvitationFontSelect } from "./InvitationFontSelect";
import { InvitationPalettePicker } from "./InvitationPalettePicker";
import { SectionFields, SectionPhotoFields } from "./InvitationSectionFields";
import { InvitationSurfacePicker } from "./InvitationSurfacePicker";
import { useEditorProtection } from "./useEditorProtection";
import styles from "./InvitationShowEditor.module.css";

export function InvitationShowEditor({ event }: { event: EventData }) {
  const [values, setValues] = useState(() => initialGuidedValues(event));
  const [target, setTarget] = useState<InvitationEditTarget | null>(null);
  const [uploads, setUploads] = useState(0);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  const snapshot = JSON.stringify(values);
  const wizard = { step: 0, activeExtra: null };
  const { controller, state, confirmNavigation, navigation } = useEditorProtection({
    ownerId: event.ownerId, eventId: event.id, snapshot, version: event.contentVersion, creation: false, manualOnly: true,
    save: async (submitted, version) => {
      const data = editorFormData(submitted, version);
      data.delete("customSlug");
      return updateEvent(event.id, data);
    },
  });
  useEffect(() => { controller.update(snapshot, uploads > 0, { step: 0, activeExtra: null }, true); }, [controller, snapshot, uploads]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const busy = pending || state.saving || uploads > 0;
  const section = target && "sectionId" in target ? values.sections.find(item => item.id === target.sectionId) : undefined;
  const label = target ? editLabel(target, section) : "";
  const date = values.eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${values.eventDate}T12:00:00Z`)) : "La fecha";
  const uploadProps = { eventId: event.id, onBusyChange: (active: boolean) => setUploads(current => current + (active ? 1 : -1)) };

  function open(next: InvitationEditTarget) {
    if (!state.ready || state.recovery || busy) return;
    setNotice("");
    setTarget(next);
  }
  function patch(changes: Partial<EditorValues>) { setValues(current => ({ ...current, ...changes })); }
  function changeSection(changes: Partial<InviteSection>) {
    if (!section) return;
    setValues(current => ({ ...current, sections: current.sections.map(item => item.id === section.id ? { ...item, ...changes } : item) }));
  }
  function cancel() {
    if (busy) return;
    if (!controller.discardChanges()) return;
    setValues(JSON.parse(state.acknowledged) as EditorValues);
    controller.update(state.acknowledged, false, wizard, true);
    setTarget(null);
  }
  function save(overwrite = false) {
    if (busy) return;
    startTransition(async () => {
      controller.update(snapshot, false, wizard, true);
      const result = await controller.saveNow(false, overwrite ? state.conflictVersion : undefined);
      if (!result.ok) return;
      setTarget(null);
      setNotice("Cambios guardados");
    });
  }

  return <div className={styles.workspace}>
    <nav className={styles.toolbar} aria-label="Edición de la vista previa">
      <EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}`} className={styles.back} title="Volver al editor completo"><FiArrowLeft aria-hidden="true" /><span>Editor completo</span></EditorProtectedLink>
      <p><FiEdit3 aria-hidden="true" /><span>Pasa sobre una sección para editarla</span></p>
      <div className={styles.tools}>
        <button type="button" onClick={() => open({ kind: "location" })} aria-haspopup="dialog" aria-expanded={target?.kind === "location"} title="Fecha y lugar"><FiMapPin aria-hidden="true" /><span>Fecha y lugar</span></button>
        <button type="button" onClick={() => open({ kind: "background" })} aria-haspopup="dialog" aria-expanded={target?.kind === "background"} title="Foto de fondo"><FiImage aria-hidden="true" /><span>Fondo</span></button>
        <button type="button" onClick={() => open({ kind: "appearance" })} aria-haspopup="dialog" aria-expanded={target?.kind === "appearance"} title="Apariencia"><FiSliders aria-hidden="true" /><span>Apariencia</span></button>
      </div>
    </nav>
    <CelebrationInvitation {...values} date={date} eventDateKey={values.eventDate} onEdit={open} />
    <div className={styles.notice} role="status">{notice && <><FiCheck aria-hidden="true" />{notice}</>}</div>
    {target && <EditDialog title={label} busy={busy} uploading={uploads > 0} onCancel={cancel} onSave={() => save()}>
      <fieldset className={styles.fields} disabled={busy}>
        {target.kind === "cover" && <>
          <Field label="Tipo de evento" id="show-event-type"><select id="show-event-type" value={values.eventType} onChange={e => patch(changeGuidedEventType(values, e.target.value))}>{invitationEventTypes.map(type => <option key={type} value={type}>{getInvitationEventContent(type).label}</option>)}</select></Field>
          <Field label="Nombre de la invitación" id="show-name"><input id="show-name" required minLength={2} maxLength={100} value={values.name} onChange={e => patch({ name: e.target.value })} /></Field>
          <Field label="Protagonistas o anfitriones" id="show-hosts"><input id="show-hosts" maxLength={120} value={values.hostNames} onChange={e => patch({ hostNames: e.target.value })} /></Field>
          <DateFields values={values} patch={patch} />
        </>}
        {(target.kind === "date" || target.kind === "location") && <DateFields values={values} patch={patch} />}
        {target.kind === "location" && <>
          <Field label="Lugar de la celebración" id="show-venue"><input id="show-venue" maxLength={160} value={values.venue} onChange={e => patch({ venue: e.target.value })} /></Field>
          <Field label="Dirección" id="show-address"><input id="show-address" maxLength={240} value={values.address} onChange={e => patch({ address: e.target.value })} /></Field>
        </>}
        {target.kind === "welcome" && <Field label="Mensaje para tus invitados" id="show-message"><textarea id="show-message" rows={6} maxLength={1200} value={values.message} onChange={e => patch({ message: e.target.value })} /></Field>}
        {(target.kind === "cover-photo" || target.kind === "background") && <CloudinaryImageUpload {...uploadProps} multiple={false} images={target.kind === "cover-photo" ? values.imageUrl ? [values.imageUrl] : [] : values.backgroundImageUrl ? [values.backgroundImageUrl] : []} onChange={images => patch(target.kind === "cover-photo" ? { imageUrl: images[0] ?? "" } : { backgroundImageUrl: images[0] ?? "" })} />}
        {target.kind === "appearance" && <>
          <InvitationSurfacePicker values={values} onChange={panelStyle => patch({ panelStyle })} onBlurChange={blurIntensity => patch({ blurIntensity })} />
          <InvitationPalettePicker palettes={sharedInvitationDesign.palettes} accent={values.accent} backgroundImageUrl={values.backgroundImageUrl} onChange={accent => patch({ accent })} />
          <InvitationFontSelect role="heading" eventType={values.eventType} value={values.typography} onChange={typography => patch({ typography })} />
          <InvitationFontSelect role="body" eventType={values.eventType} value={values.bodyTypography} onChange={bodyTypography => patch({ bodyTypography })} />
        </>}
        {section && target.kind === "section" && <SectionFields section={section} onChange={changeSection} uploadProps={uploadProps} allowSectionPhoto globalPanelStyle={values.panelStyle} />}
        {section && target.kind === "section-photo" && <SectionPhotoFields section={section} onChange={changeSection} uploadProps={uploadProps} />}
      </fieldset>
      {state.error && <div className={styles.error} role="alert"><p>{state.error}</p>
        {state.conflictVersion !== undefined && <button type="button" disabled={busy} onClick={() => save(true)}>Guardar mi versión</button>}
        {state.code === "auth" && <EditorProtectedLink guard={confirmNavigation} href={`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${event.id}/show`)}`}>Iniciar sesión</EditorProtectedLink>}
      </div>}
    </EditDialog>}
    {state.recovery && <EditorRecoveryDialog onDiscard={() => controller.discardRecovery()} onRecover={() => {
      const record = controller.recover();
      if (record) { setValues(JSON.parse(record.snapshot) as EditorValues); setTarget({ kind: "cover" }); }
    }} />}
    {navigation.destination && <EditorLeaveDialog onStay={navigation.stay} onLeave={navigation.leave} />}
  </div>;
}

function editLabel(target: InvitationEditTarget, section?: InviteSection) {
  if (target.kind === "section") return section?.title || "Sección";
  if (target.kind === "section-photo") return `${section?.type === "gallery" ? "Fotos" : "Foto"} de ${section?.title || "la sección"}`;
  return ({ cover: "Portada", date: "Fecha y hora", location: "Fecha y lugar", welcome: "Mensaje de bienvenida", "cover-photo": "Foto de portada", background: "Foto de fondo", appearance: "Apariencia" })[target.kind];
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div className="guided-field"><label htmlFor={id}>{label}</label>{children}</div>;
}

function DateFields({ values, patch }: { values: EditorValues; patch(changes: Partial<EditorValues>): void }) {
  return <div className={styles.dateFields}>
    <Field label="Fecha" id="show-date"><input id="show-date" type="date" value={values.eventDate} onChange={e => patch({ eventDate: e.target.value, ...(!e.target.value ? { eventTime: "" } : {}) })} /></Field>
    <Field label="Hora" id="show-time"><input id="show-time" type="time" disabled={!values.eventDate} value={values.eventTime} onChange={e => patch({ eventTime: e.target.value })} /></Field>
  </div>;
}

function EditDialog({ title, busy, uploading, onCancel, onSave, children }: { title: string; busy: boolean; uploading: boolean; onCancel(): void; onSave(): void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="show-edit-title" aria-describedby="show-edit-description" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <form onSubmit={event => { event.preventDefault(); if (!busy) onSave(); }}>
      <header className={styles.dialogHeader}><div className={styles.dialogHeading}><span className={styles.dialogIcon} aria-hidden="true"><FiEdit3 /></span><div><span className={styles.eyebrow}>EDITAR INVITACIÓN</span><h2 id="show-edit-title">{title}</h2><p id="show-edit-description">Personaliza este apartado sin salir de la vista previa.</p></div></div><button type="button" aria-label="Cerrar edición" disabled={busy} onClick={onCancel}><FiX aria-hidden="true" /></button></header>
      <div className={styles.dialogBody}>{children}</div>
      <footer className={styles.dialogFooter}><button type="button" disabled={busy} onClick={onCancel}>Cancelar</button><button type="submit" className={styles.save} disabled={busy}><FiSave aria-hidden="true" />{uploading ? "Subiendo fotografías…" : busy ? "Guardando…" : "Guardar cambios"}</button></footer>
    </form>
  </dialog>;
}
