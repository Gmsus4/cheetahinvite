"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { FiArrowLeft, FiCheck, FiEdit3, FiImage, FiMapPin, FiPlus, FiSave, FiSliders, FiX } from "react-icons/fi";
import { updateEvent } from "@/app/dashboard/eventos/[id]/actions";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import { atmosphereStyle } from "@/lib/invitation-atmosphere";
import { availableGuidedSections, changeGuidedEventType, guidedDetails, initialGuidedValues } from "@/lib/guided-invitation";
import { getInvitationEventContent, invitationEventTypes } from "@/lib/invitation-event-content";
import { editorFormData, type EditorValues, type EventData, type InvitationEditTarget, type InviteSection } from "@/lib/invitation-editor";
import { sharedInvitationDesign } from "@/lib/shared-invitation";
import { CloudinaryImageUpload } from "./CloudinaryImageUpload";
import { EditorLeaveDialog } from "./EditorLeaveDialog";
import { EditorProtectedLink } from "./EditorProtectedLink";
import { EditorRecoveryDialog } from "./EditorRecoveryDialog";
import { InvitationFontSelect } from "./InvitationFontSelect";
import { InvitationPalettePicker } from "./InvitationPalettePicker";
import { SectionFields, SectionTextAlignmentFields, SectionPhotoFields, SectionSurfaceFields } from "./InvitationSectionFields";
import { InvitationIconsPicker } from "./InvitationIconsPicker";
import { InvitationCornersPicker } from "./InvitationCornersPicker";
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
  const availableSections = availableGuidedSections(values.eventType, values.sections);
  const locationSection = values.sections.find(item => item.type === "location");
  const countdownSection = values.sections.find(item => item.type === "countdown");
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
  function addSection(id: string) {
    const selected = availableSections.find(item => item.id === id);
    if (!selected || busy) return;
    setValues(current => ({ ...current, sections: current.sections.map(item => item.id === id ? { ...item, enabled: true } : item) }));
    setTarget(selected.type === "countdown" ? { kind: "date" } : selected.type === "location" ? { kind: "location" } : { kind: "section", sectionId: id });
  }
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
    <nav className={styles.toolbar} aria-label="Edición de la vista previa" data-surface={values.panelStyle === "auto" ? "blur" : values.panelStyle} style={atmosphereStyle(values.accent, values)}>
      <EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}`} className={styles.back} title="Volver al editor completo"><FiArrowLeft aria-hidden="true" /><span>Editor completo</span></EditorProtectedLink>
      <p><FiEdit3 aria-hidden="true" /><span>Pasa sobre una sección para editarla</span></p>
      <div className={styles.tools}>
        <button type="button" onClick={() => open({ kind: "location" })} aria-haspopup="dialog" aria-expanded={target?.kind === "location"} title="Fecha y lugar"><FiMapPin aria-hidden="true" /><span>Fecha y lugar</span></button>
        <button type="button" onClick={() => open({ kind: "background" })} aria-haspopup="dialog" aria-expanded={target?.kind === "background"} title="Foto de fondo"><FiImage aria-hidden="true" /><span>Fondo</span></button>
        <button type="button" onClick={() => open({ kind: "appearance" })} aria-haspopup="dialog" aria-expanded={target?.kind === "appearance"} title="Apariencia"><FiSliders aria-hidden="true" /><span>Apariencia</span></button>
        <button type="button" onClick={() => open({ kind: "add-section" })} aria-label="Agregar secciones" aria-haspopup="dialog" aria-expanded={target?.kind === "add-section"} disabled={!availableSections.length || busy || !state.ready || Boolean(state.recovery)} title={availableSections.length ? "Agregar secciones" : "Todas las secciones están incluidas"}><FiPlus aria-hidden="true" /><span>{availableSections.length ? "Agregar secciones" : "Todas las secciones están incluidas"}</span></button>
      </div>
    </nav>
    <CelebrationInvitation {...values} date={date} eventDateKey={values.eventDate} onEdit={open} />
    <div className={styles.notice} role="status">{notice && <><FiCheck aria-hidden="true" />{notice}</>}</div>
    {target && <EditDialog key={target.kind} selectionOnly={target.kind === "add-section"} title={label} busy={busy} uploading={uploads > 0} onCancel={cancel} onSave={() => save()}>
      <fieldset className={styles.fields} disabled={busy}>
        {target.kind === "add-section" && <>
          <p className={styles.sectionIntro}>Elige una sección para agregarla y completar su información.</p>
          <div className={styles.sectionOptions}>{availableSections.map(item => <button key={item.id} type="button" aria-label={`Agregar ${item.title}`} onClick={() => addSection(item.id)}><span><strong>{item.title}</strong><small>{item.type === "countdown" ? "Los días, horas y minutos que faltan para tu evento." : item.type === "location" ? "El lugar, la dirección y el mapa del evento." : guidedDetails(values.eventType).find(detail => detail.type === item.type)?.help}</small></span><FiPlus aria-hidden="true" /></button>)}</div>
          {!availableSections.length && <p>Ya incluiste todas las secciones disponibles.</p>}
        </>}
        {target.kind === "cover" && <>
          <Field label="Tipo de evento" id="show-event-type"><select id="show-event-type" value={values.eventType} onChange={e => patch(changeGuidedEventType(values, e.target.value))}>{invitationEventTypes.map(type => <option key={type} value={type}>{getInvitationEventContent(type).label}</option>)}</select></Field>
          <Field label="Nombre de la invitación" id="show-name"><input id="show-name" required minLength={2} maxLength={100} value={values.name} onChange={e => patch({ name: e.target.value })} /></Field>
          <Field label="Protagonistas o anfitriones" id="show-hosts"><input id="show-hosts" maxLength={120} value={values.hostNames} onChange={e => patch({ hostNames: e.target.value })} /></Field>
          <DateFields values={values} patch={patch} />
        </>}
        {(target.kind === "date" || target.kind === "location") && <DateFields values={values} patch={patch} />}
        {target.kind === "date" && countdownSection && <>
          <Field label="Mostrar cuenta regresiva" id="show-countdown-enabled"><input id="show-countdown-enabled" type="checkbox" checked={countdownSection.enabled} onChange={e => patch({ sections: values.sections.map(item => item.id === countdownSection.id ? { ...item, enabled: e.target.checked } : item) })} /></Field>
          <Field label="Título de la sección" id="show-countdown-title"><input id="show-countdown-title" maxLength={100} value={countdownSection.title} onChange={e => patch({ sections: values.sections.map(item => item.id === countdownSection.id ? { ...item, title: e.target.value } : item) })} /></Field>
        </>}
        {target.kind === "location" && <>
          {locationSection && <>
            <Field label="Título de la sección" id="show-location-title"><input id="show-location-title" maxLength={100} value={locationSection.title} onChange={e => patch({ sections: values.sections.map(item => item.id === locationSection.id ? { ...item, title: e.target.value, titleCustomized: true } : item) })} /></Field>
          </>}
          <Field label="Lugar de la celebración" id="show-venue"><input id="show-venue" maxLength={160} value={values.venue} onChange={e => patch({ venue: e.target.value })} /></Field>
          <Field label="Dirección" id="show-address"><input id="show-address" maxLength={240} value={values.address} onChange={e => patch({ address: e.target.value })} /></Field>
          {locationSection && <Field label="Enlace de Google Maps (opcional)" id="show-map"><input id="show-map" type="url" maxLength={500} placeholder="https://maps.app.goo.gl/…" value={locationSection.link} onChange={e => patch({ sections: values.sections.map(item => item.id === locationSection.id ? { ...item, link: e.target.value } : item) })} /><small>Si lo dejas vacío, «Cómo llegar» buscará la dirección escrita.</small></Field>}
          {locationSection && <div className={styles.sectionMedia}><SectionPhotoFields section={locationSection} uploadProps={uploadProps} onChange={changes => patch({ sections: values.sections.map(item => item.id === locationSection.id ? { ...item, ...changes } : item) })} /></div>}
        </>}
        {(target.kind === "cover-photo" || target.kind === "background") && <CloudinaryImageUpload {...uploadProps} multiple={false} images={target.kind === "cover-photo" ? values.imageUrl ? [values.imageUrl] : [] : values.backgroundImageUrl ? [values.backgroundImageUrl] : []} onChange={images => patch(target.kind === "cover-photo" ? { imageUrl: images[0] ?? "" } : { backgroundImageUrl: images[0] ?? "" })} />}
        {target.kind === "appearance" && <>
          <InvitationSurfacePicker values={values} onChange={panelStyle => patch({ panelStyle })} onBlurChange={blurIntensity => patch({ blurIntensity })} />
              <InvitationCornersPicker value={values.sectionCorners} onChange={sectionCorners => patch({ sectionCorners })} />
              <InvitationIconsPicker value={values.showSectionIcons} onChange={showSectionIcons => patch({ showSectionIcons })} />
          <InvitationPalettePicker palettes={sharedInvitationDesign.palettes} accent={values.accent} backgroundImageUrl={values.backgroundImageUrl} onChange={accent => patch({ accent })} />
          <InvitationFontSelect role="heading" eventType={values.eventType} value={values.typography} onChange={typography => patch({ typography })} />
          <InvitationFontSelect role="body" eventType={values.eventType} value={values.bodyTypography} onChange={bodyTypography => patch({ bodyTypography })} />
        </>}
        {section && target.kind === "section" && <SectionFields section={section} onChange={changeSection} uploadProps={uploadProps} allowSectionPhoto globalShowIcons={values.showSectionIcons} globalPanelStyle={values.panelStyle} mediaClassName={styles.sectionMedia} showStyleControls={false} />}
        {section && target.kind === "section-photo" && <SectionPhotoFields section={section} onChange={changeSection} uploadProps={uploadProps} />}
        {section && target.kind === "section-surface" && <SectionSurfaceFields section={section} onChange={changeSection} globalShowIcons={values.showSectionIcons} globalPanelStyle={values.panelStyle} />}
        {section && section.type !== "cover" && target.kind === "section-visibility" && <>
          <label className="guided-toggle guided-include-toggle" htmlFor="show-section-enabled"><span><strong>Incluir en mi invitación</strong><small>{section.enabled ? "Esta sección aparece en tu invitación." : "Esta sección está desactivada. Puedes recuperarla desde el botón +."}</small></span><input id="show-section-enabled" type="checkbox" role="switch" checked={section.enabled} onChange={event => changeSection({ enabled: event.target.checked })} /><span className="guided-switch" aria-hidden="true" /></label>
          <p className={styles.sectionIntro}>Conservaremos el texto, las fotos y el estilo de esta sección aunque la desactives.</p>
        </>}
        {section && target.kind === "section-alignment" && <SectionTextAlignmentFields section={section} onChange={changeSection} />}
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
  if (target.kind === "section-surface") return `Estilo de ${section?.title || "la sección"}`;
  if (target.kind === "section-visibility") return `Visibilidad de ${section?.title || "la sección"}`;
  if (target.kind === "section-alignment") return `Alineación de ${section?.title || "la sección"}`;
  return ({ cover: "Portada", date: "Fecha y hora", location: "Fecha y lugar", "cover-photo": "Foto de portada", background: "Foto de fondo", appearance: "Apariencia", "add-section": "Agregar secciones" })[target.kind];
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

function EditDialog({ title, busy, uploading, onCancel, onSave, children, selectionOnly = false }: { title: string; busy: boolean; uploading: boolean; onCancel(): void; onSave(): void; children: ReactNode; selectionOnly?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="show-edit-title" aria-describedby="show-edit-description" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <form onSubmit={event => { event.preventDefault(); if (!busy && !selectionOnly) onSave(); }}>
      <header className={styles.dialogHeader}><div className={styles.dialogHeading}><span className={styles.dialogIcon} aria-hidden="true">{selectionOnly ? <FiPlus /> : <FiEdit3 />}</span><div><span className={styles.eyebrow}>EDITAR INVITACIÓN</span><h2 id="show-edit-title">{title}</h2><p id="show-edit-description">Personaliza este apartado sin salir de la vista previa.</p></div></div><button type="button" aria-label="Cerrar edición" disabled={busy} onClick={onCancel}><FiX aria-hidden="true" /></button></header>
      <div className={styles.dialogBody}>{children}</div>
      <footer className={styles.dialogFooter}><button type="button" disabled={busy} onClick={onCancel}>{selectionOnly ? "Cerrar" : "Cancelar"}</button>{!selectionOnly && <button type="submit" className={styles.save} disabled={busy}><FiSave aria-hidden="true" />{uploading ? "Subiendo fotografías…" : busy ? "Guardando…" : "Guardar cambios"}</button>}</footer>
    </form>
  </dialog>;
}
