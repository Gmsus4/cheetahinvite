"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiCheck, FiEye, FiHeart, FiLock, FiSave, FiSend, FiSliders } from "react-icons/fi";
import { prepareEvent } from "@/app/crear/actions";
import { publishEvent, updateEvent } from "@/app/dashboard/eventos/[id]/actions";
import { InvitationCanvas } from "./EventEditor";
import { initialGuidedValues, completeGuidedSections, guidedDetails, guidedDesign, applyGuidedDesign, guidedPublicationIssues } from "@/lib/guided-invitation";
import { getInvitationEventContent, invitationEventTypes } from "@/lib/invitation-event-content";
import { EventDesignPicker } from "./EventDesignPicker";
import { applyWeddingDesign, getWeddingDesign } from "@/lib/wedding-designs";
import { EditorSaveFailure, editorFormData, type EditorValues, type InviteSection } from "@/lib/invitation-editor";
import { invitationPriceLabel, isInvitationPublished } from "@/lib/invitation-payment";
import { invitationPath } from "@/lib/invitation-url";
import { CloudinaryImageUpload, type EventData } from "./EventEditor";
import { useEditorProtection } from "./useEditorProtection";
import { EditorProtectedLink } from "./EditorProtectedLink";
import { EditorLeaveDialog } from "./EditorLeaveDialog";
import { EditorRecoveryDialog } from "./EditorRecoveryDialog";
import { InvitationLivePreview } from "./InvitationLivePreview";
import { InvitationPublicLink } from "./InvitationPublicLink";
import { CustomInvitationLinkField } from "./CustomInvitationLinkField";
import { WeddingDesignPicker } from "./WeddingDesignPicker";
import styles from "./EventWorkspace.module.css";
import { DashboardHeader } from "./DashboardHeader";

const steps = ["Tu celebración", "Datos principales", "Dale tu toque", "Revisa y comparte"];
const stepIcons = [FiHeart, FiCalendar, FiSliders, FiSend];
const descriptions = ["Elige un diseño. Nosotros cuidamos cada detalle.", "Cuéntanos cuándo y dónde será la celebración.", "Hazla tuya con tus fotos y los detalles que quieras compartir.", "Así recibirán la invitación las personas que más quieres."];

export function GuidedInvitationEditor({ event, creation = false, error, account }: { event: EventData; creation?: boolean; saved: boolean; published: boolean; error: string; account?: { name: string; email: string; image?: string | null } }) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialGuidedValues(event));
  const [step, setStep] = useState(0);
  const [mobileStepsExpanded, setMobileStepsExpanded] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scrollToTop = useRef(false);
  const draftPromise = useRef<Promise<string> | null>(null);
  const snapshot = JSON.stringify(values);
  const manualOnly = Boolean(event.paidAt) || !["DRAFT", "PENDING_PAYMENT"].includes(event.status);
  async function ensureEvent(submitted = snapshot) {
    if (persistence.getEventId()) return persistence.getEventId();
    if (!draftPromise.current) draftPromise.current = prepareEvent(editorFormData(submitted, persistence.getVersion(), persistence.getCreationKey())).then(result => {
      if (!result.ok) throw new EditorSaveFailure(result);
      persistence.setEventId(result.eventId);
      if (creation) router.replace(`/crear?resume=${result.eventId}`);
      return result.eventId;
    }).catch(failure => { draftPromise.current = null; throw failure; });
    return draftPromise.current;
  }
  const { controller: persistence, state: protection, confirmNavigation, navigation } = useEditorProtection({
    ownerId: event.ownerId, eventId: event.id, snapshot, version: event.contentVersion, creation, manualOnly,
    save: async (submitted, version, automatic) => updateEvent(await ensureEvent(submitted), editorFormData(submitted, version), automatic ? "auto" : "manual"),
  });
  useEffect(() => { persistence.update(snapshot, uploads > 0, { step, activeExtra: null }, manualOnly); }, [persistence, snapshot, uploads, step, manualOnly]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (scrollToTop.current) {
      scrollToTop.current = false;
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }, [step]);
  const closePreview = useCallback(() => setPreviewExpanded(false), []);
  const busy = saving || !protection.ready || Boolean(protection.recovery);
  const dirty = snapshot !== protection.acknowledged || protection.code === "conflict";
  const design = guidedDesign(values.eventType, values.templateId);
  const content = getInvitationEventContent(values.eventType);
  const details = guidedDetails(values.eventType);
  const issues = guidedPublicationIssues(values);
  const published = isInvitationPublished(event);
  const changesSaved = protection.ready && !protection.recovery && !protection.error && !dirty && !saving && !protection.saving && uploads === 0 && (!creation || protection.lastSaved);
  const saveLabel = uploads > 0 ? "Subiendo fotografías…" : saving || protection.saving ? "Guardando…" : changesSaved ? "Cambios guardados" : published ? "Guardar cambios" : "Guardar borrador";
  const date = values.eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${values.eventDate}T12:00:00Z`)) : "Fecha por definir";
  function patch(changes: Partial<EditorValues>) { setNotice(""); setValues(current => ({ ...current, ...changes })); }
  function changeSection(id: string, changes: Partial<InviteSection>) { setNotice(""); setValues(current => ({ ...current, sections: current.sections.map(section => section.id === id ? { ...section, ...changes } : section) })); }
  function goTo(target: number) {
    setMobileStepsExpanded(false);
    if (uploads || busy || target === step) return;
    if (target > step && !form.current?.reportValidity()) return;
    scrollToTop.current = true;
    setStep(target);
  }
  function recover() {
    const record = persistence.recover();
    if (!record) return;
    const recovered = JSON.parse(record.snapshot) as EditorValues;
    const restored = { ...recovered, sections: completeGuidedSections(recovered.eventType, recovered.sections) };
    setValues(restored.eventType === "wedding" && getWeddingDesign(restored.templateId) ? applyWeddingDesign(restored, restored.templateId, restored.accent) : restored);
    setStep(Math.min(3, record.wizard.step));
    if (creation && record.eventId) router.replace(`/crear?resume=${record.eventId}`);
  }
  async function save(forPublication = false, overwrite = false) {
    if (busy || uploads) return;
    if (forPublication && issues.length) { setStep(3); setNotice("Completa los datos pendientes antes de continuar al pago."); return; }
    if (!form.current?.reportValidity()) return;
    setSaving(true); setNotice("");
    try {
      const result = await persistence.saveNow(false, overwrite ? protection.conflictVersion : undefined);
      if (!result.ok) return;
      if (forPublication) {
        const next = await publishEvent(result.eventId, result.version);
        if (!next.ok) { persistence.acceptFailure(next); return; }
        if (creation) router.replace(`/dashboard/eventos/${result.eventId}/pago`);
        else router.push(`/dashboard/eventos/${result.eventId}/pago`);
      } else if (creation) router.replace(`/dashboard/eventos/${result.eventId}/show`);
      else setNotice("Tus cambios están guardados.");
    } catch { persistence.reportError("No pudimos completar la operación. Tu borrador sigue protegido; intenta de nuevo."); }
    finally { setSaving(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (step < 3) goTo(step + 1); else void save(); }
  const uploadBusy = (active: boolean) => setUploads(current => current + (active ? 1 : -1));
  const uploadProps = { eventId: event.id, ensureEvent: creation ? () => ensureEvent() : undefined, onBusyChange: uploadBusy };
  const CurrentStepIcon = stepIcons[step];
  const progress = <nav className="guided-progress" data-grouped={step === 3} data-expanded={mobileStepsExpanded} aria-label="Pasos de tu invitación" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMobileStepsExpanded(false); }} onKeyDown={event => { if (event.key === "Escape") { setMobileStepsExpanded(false); event.currentTarget.querySelector<HTMLButtonElement>(".guided-steps-toggle")?.focus(); } }}>
    {step === 3 && <button className="guided-steps-toggle" type="button" aria-expanded={mobileStepsExpanded} aria-controls="guided-step-options" aria-label={`Paso ${step + 1}: ${steps[step]}. ${mobileStepsExpanded ? "Ocultar" : "Mostrar"} todos los pasos`} onClick={() => setMobileStepsExpanded(current => !current)}>
      <i className="guided-step-stack" aria-hidden="true">{stepIcons.filter((_, index) => index !== step).map((Icon, index) => <i key={index} className={`guided-step-layer guided-step-layer-${index}`}><Icon /></i>)}<i className="guided-step-front"><CurrentStepIcon /></i></i>
    </button>}
    <ol id="guided-step-options">{steps.map((label, index) => {
    const Icon = stepIcons[index];
    return <li key={label}><button type="button" title={label} aria-label={`Paso ${index + 1}: ${label}`} aria-current={step === index ? "step" : undefined} disabled={busy || uploads > 0} onClick={() => goTo(index)}><span aria-hidden="true"><Icon /></span><strong>{label}</strong></button></li>;
  })}</ol></nav>;

  return <main className={`guided-editor ${styles.workspace}`}>
    {protection.recovery && <EditorRecoveryDialog onRecover={recover} onDiscard={() => persistence.discardRecovery()} />}
    {navigation.destination && <EditorLeaveDialog onStay={navigation.stay} onLeave={navigation.leave} />}
    <DashboardHeader name={account?.name || "Usuario"} email={account?.email || ""} image={account?.image} guard={confirmNavigation} />
    <div className="guided-layout">
      <div className="guided-workspace">
        <div className="guided-heading"><span className="guided-eyebrow">{creation ? "CREA ALGO ESPECIAL" : "TU INVITACIÓN"} · PASO {step + 1} DE 4</span><h1 ref={heading} tabIndex={-1}>{steps[step]}</h1><p>{descriptions[step]}</p></div>
        {protection.localWarning && <p className="guided-alert" role="status">El navegador no permite guardar una copia local. Guarda tu borrador antes de salir.</p>}
        {(protection.error || error) && <div className="guided-alert" role="alert"><p>{protection.error || (error === "pendientes" ? "Completa los datos principales y los detalles activos antes de continuar al pago." : "Revisa tus datos e intenta guardar de nuevo.")}</p><div>{protection.conflictVersion !== undefined && <><button type="button" disabled={busy || uploads > 0} onClick={() => void save(false, true)}>Guardar mi versión</button><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${persistence.getEventId()}/show`} target="_blank">Revisar versión guardada</EditorProtectedLink></>}{protection.code === "unavailable" && <button type="button" disabled={busy || uploads > 0} onClick={() => void save()}>Reintentar guardado</button>}{protection.code === "auth" && <EditorProtectedLink guard={confirmNavigation} href={`/login?callbackUrl=${encodeURIComponent(creation ? "/crear" : `/dashboard/eventos/${event.id}`)}`}>Iniciar sesión</EditorProtectedLink>}</div></div>}
        {notice && <p className="guided-notice" role="status">{notice}</p>}
        <form ref={form} onSubmit={submit} noValidate className="guided-form" aria-busy={saving}>
          <fieldset disabled={busy} className="guided-fields">
            {step === 0 && <>
              <Field label="Tipo de invitación" id="event-type"><select id="event-type" value={values.eventType} onChange={e => {
                const eventType = e.target.value;
                const defaults = initialGuidedValues({ ...event, id: "", eventType, name: values.name === content.defaultName ? "" : values.name, sections: [] });
                patch({ ...defaults, name: values.name === content.defaultName ? defaults.name : values.name, hostNames: values.hostNames, eventDate: values.eventDate, eventTime: values.eventTime, venue: values.venue, address: values.address, message: values.message, imageUrl: values.imageUrl, customSlug: values.customSlug, sections: defaults.sections.map(section => values.sections.find(old => old.type === section.type) ? { ...values.sections.find(old => old.type === section.type)!, title: getInvitationEventContent(eventType).sections[section.type].title } : section) });
              }}>{invitationEventTypes.map(type => <option key={type} value={type}>{getInvitationEventContent(type).label}</option>)}</select></Field>
              {values.eventType === "wedding" ? <WeddingDesignPicker value={design.id} onChange={id => setValues(current => applyGuidedDesign(current, id))} /> : <EventDesignPicker eventType={values.eventType} value={values.templateId} onChange={id => setValues(current => applyGuidedDesign(current, id))} />}

            </>}
            {step === 1 && <div className="guided-data-grid">
              <Field label={values.eventType === "wedding" ? "¿Cómo se llaman?" : "¿Quién celebra?"} id="w-hosts" wide help="Escribe los nombres tal como quieres que aparezcan."><input id="w-hosts" value={values.hostNames} maxLength={120} placeholder={values.eventType === "wedding" ? "Ej. Sofía y Mateo" : "Nombre de quien celebra o de los anfitriones"} onChange={e => patch({ hostNames: e.target.value })} /></Field>
              <Field label="Nombre de la invitación" id="w-name" wide><input id="w-name" value={values.name} required minLength={2} maxLength={100} onChange={e => patch({ name: e.target.value })} /></Field>
              <Field label="Fecha" id="w-date"><input id="w-date" type="date" value={values.eventDate} onChange={e => patch({ eventDate: e.target.value, ...(!e.target.value ? { eventTime: "" } : {}) })} /></Field>
              <Field label="Hora" id="w-time" help={!values.eventDate ? "Primero elige una fecha." : undefined}><input id="w-time" type="time" disabled={!values.eventDate} value={values.eventTime} onChange={e => patch({ eventTime: e.target.value })} /></Field>
              <Field label="¿Dónde será la celebración?" id="w-venue" wide help="Nombre del salón, jardín o lugar principal del evento."><input id="w-venue" value={values.venue} maxLength={160} placeholder="Ej. Hacienda Las Nubes" onChange={e => patch({ venue: e.target.value })} /></Field>
              <Field label="Dirección" id="w-address" wide help="Incluye calle, número y ciudad. Crearemos el botón para abrir el mapa."><input id="w-address" value={values.address} maxLength={240} placeholder="Calle, número, colonia y ciudad" onChange={e => patch({ address: e.target.value })} /></Field>
              <p className="guided-help guided-wide">¿Aún no tienes todos los datos? Puedes guardar un borrador y completarlos antes de publicar.</p>
            </div>}
            {step === 2 && <>
              <fieldset className="guided-palettes"><legend>El color de tu celebración</legend><p>{design.palettes.length} combinaciones creadas para {design.label.toLowerCase()}.</p><div>{design.palettes.map(palette => <label key={palette.accent}><input type="radio" name="wedding-palette" checked={values.accent === palette.accent} onChange={() => patch({ accent: palette.accent })} /><span className="guided-palette-swatches" aria-hidden="true">{[palette.paper, palette.panel, palette.accent, palette.dark].map(color => <i key={color} style={{ background: color }} />)}</span><strong>{palette.label}</strong>{values.accent === palette.accent && <FiCheck />}</label>)}</div></fieldset>
              {values.eventType === "wedding" && getWeddingDesign(values.templateId)?.edition === 2 && <div className="guided-photo-field"><h2>Foto de fondo <span>Opcional</span></h2><p>Una sola imagen detrás de toda la invitación. Es independiente de la portada y de la galería.</p><CloudinaryImageUpload {...uploadProps} images={values.backgroundImageUrl ? [values.backgroundImageUrl] : []} multiple={false} onChange={images => patch({ backgroundImageUrl: images[0] ?? "" })} /></div>}
              <div className="guided-photo-field"><h2>Una foto especial <span>Opcional</span></h2><p>{values.eventType === "wedding" ? "La foto principal de la portada. No se utiliza como fondo." : "Elige tu fotografía favorita o conserva el diseño sin foto."}</p><CloudinaryImageUpload {...uploadProps} images={values.imageUrl ? [values.imageUrl] : []} multiple={false} onChange={images => patch({ imageUrl: images[0] ?? "" })} /></div>
              <Field label="Un mensaje para tus invitados" id="w-message" help="Opcional. Si lo dejas vacío, usaremos una bienvenida breve."><textarea id="w-message" rows={3} maxLength={1200} value={values.message} placeholder="Nos encantará compartir este día contigo…" onChange={e => patch({ message: e.target.value })} /></Field>
              <div className="guided-details-heading"><h2>Los detalles de tu celebración</h2><p>Activa los detalles que quieras compartir y personaliza cada sección.</p></div>
              <div className="guided-details">{details.map(detail => {
                const section = values.sections.find(section => section.type === detail.type);
                if (!section) return null;
                return <div className={`guided-detail${section.enabled ? " is-enabled" : ""}`} key={detail.type}><label className="guided-toggle" htmlFor={`toggle-${section.id}`}><span><strong>{detail.question}</strong><small>{detail.help}</small></span><input id={`toggle-${section.id}`} type="checkbox" checked={section.enabled} onChange={e => changeSection(section.id, { enabled: e.target.checked })} /><span className="guided-switch" aria-hidden="true" /></label>{section.enabled && <div className="guided-detail-fields"><SectionFields section={section} onChange={changes => changeSection(section.id, changes)} uploadProps={uploadProps} allowSectionPhoto={values.eventType === "wedding" && getWeddingDesign(values.templateId)?.edition === 2} /></div>}</div>;
              })}</div>
            </>}
            {step === 3 && <>
              <div className="guided-review-design"><FiCheck /><div><strong>{design.label}</strong><span>{(design.palettes.find(p => p.accent.toLowerCase() === values.accent.toLowerCase())?.label || "Color personalizado")} · Diseño listo</span></div><button type="button" onClick={() => goTo(0)}>Cambiar</button></div>
              <dl className="guided-review">{[["Protagonistas", values.hostNames || "Por definir"], ["Fecha y hora", `${date}${values.eventTime ? ` · ${values.eventTime}` : ""}`], ["Lugar", values.venue || "Por definir"], ["Dirección", values.address || "Por definir"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}<button type="button" onClick={() => goTo(1)} aria-label={`Editar ${label.toLowerCase()}`}>Editar</button></dd></div>)}</dl>
              <div className="guided-checklist"><h2>{issues.length ? "Antes de publicar" : "Todo listo para compartir"}</h2>{issues.length ? <><p>Puedes guardar el borrador ahora. Para publicar, completa lo siguiente:</p><ul>{issues.map(issue => <li key={issue.message}><button type="button" onClick={() => goTo(issue.step)}>{issue.message}<FiArrowRight /></button></li>)}</ul></> : <p>Los datos principales están completos. Revisa la vista previa antes de continuar.</p>}</div>
              {!creation && <CustomInvitationLinkField eventId={event.id} ownerId={event.ownerId} value={values.customSlug} savedValue={event.customSlug} suggestion={content.slug} onChange={customSlug => patch({ customSlug })} />}
              {!event.paidAt && <p className="guided-payment"><FiLock />{invitationPriceLabel} MXN · IVA incluido · 12 meses activa. Tu enlace será público al confirmar el pago.</p>}
              {!creation && <div className="guided-management"><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}/asistencias`}>Ver confirmaciones</EditorProtectedLink><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}/pago`}>Pago y soporte</EditorProtectedLink>{published && <EditorProtectedLink guard={confirmNavigation} href={invitationPath(event)!} target="_blank">Abrir invitación pública</EditorProtectedLink>}</div>}
            </>}
          </fieldset>
          <div className="guided-bottom-bar">
            <button className="guided-back" type="button" aria-label="Paso anterior" disabled={step === 0 || busy || uploads > 0} onClick={() => goTo(step - 1)}><FiArrowLeft /><span className="guided-bottom-label">Anterior</span></button>
            {progress}
            {step < 3 ? <button className="button" type="submit" aria-label="Continuar al siguiente paso" disabled={busy || uploads > 0}><span className="guided-bottom-label">Continuar</span><FiArrowRight /></button> : <div className="guided-footer-actions">
              <button className={`button${!event.paidAt ? " guided-save-compact" : ""}`} type="button" aria-label={saveLabel} title={saveLabel} data-save-state={changesSaved ? "saved" : undefined} disabled={busy || uploads > 0 || changesSaved || (!creation && !dirty)} onClick={() => void save()}>{changesSaved ? <FiCheck aria-hidden="true" /> : <FiSave aria-hidden="true" />}<span className="guided-bottom-label" role="status">{saveLabel}</span></button>
              {!event.paidAt && <button className="button guided-publish" type="button" aria-label="Guardar y continuar al pago" title={issues.length ? "Completa los datos indicados antes de continuar al pago" : "Guardar y continuar al pago"} disabled={busy || uploads > 0 || issues.length > 0} onClick={() => void save(true)}><span className="guided-bottom-label">{saving ? "Guardando…" : "Continuar al pago"}</span><span className="guided-mobile-payment-label">{saving ? "Guardando…" : "Pagar"}</span><FiArrowRight aria-hidden="true" /></button>}
            </div>}
          </div>
        </form>
      </div>
      <aside className={`guided-preview${previewExpanded ? " is-open" : ""}`}><div className="guided-preview-heading"><span>ASÍ VA QUEDANDO</span><small>Se actualiza mientras editas</small></div><InvitationLivePreview initialDevice="mobile" fitViewport expanded={previewExpanded} onClose={closePreview} onExpand={() => setPreviewExpanded(true)} publicLink={<InvitationPublicLink event={event} dirty={dirty} />}><InvitationCanvas {...values} date={date} eventDateKey={values.eventDate} /></InvitationLivePreview></aside>
    </div>
    <button className="guided-mobile-preview" type="button" onClick={() => setPreviewExpanded(true)}><FiEye /> Ver invitación</button>
  </main>;
}

function Field({ label, id, help, wide, children }: { label: string; id: string; help?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`guided-field${wide ? " guided-wide" : ""}`}><label htmlFor={id}>{label}</label>{children}{help && <small>{help}</small>}</div>;
}

function SectionFields({ section, onChange, uploadProps, allowSectionPhoto = false }: { section: InviteSection; onChange(changes: Partial<InviteSection>): void; uploadProps: { eventId: string; ensureEvent?: () => Promise<string>; onBusyChange(active: boolean): void }; allowSectionPhoto?: boolean }) {
  const prefix = section.id;
  const surfaceControl = allowSectionPhoto && <fieldset className="guided-section-surface"><legend>Fondo de esta sección</legend><div role="group" aria-label={`Fondo de ${section.title}`}>{([['auto', 'Auto'], ['blur', 'Blur'], ['blur-color', 'BlurColor'], ['color', 'Color']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={(section.panelStyle ?? 'auto') === value} onClick={() => onChange({ panelStyle: value })}>{label}</button>)}</div><small>Auto alterna los tres acabados durante el recorrido.</small></fieldset>;
  if (section.type === "gallery") return <>{surfaceControl}<CloudinaryImageUpload {...uploadProps} multiple images={section.imageUrls ?? []} onChange={imageUrls => onChange({ imageUrls, imageUrl: imageUrls[0] ?? "" })} /></>;
  return <>
    {surfaceControl}
    <Field label="Título de la sección" id={`${prefix}-title`}><input id={`${prefix}-title`} value={section.title} maxLength={120} onChange={e => onChange({ title: e.target.value })} /></Field>
    {section.type === "rsvp" && <Field label="¿Cómo quieres recibir las respuestas?" id={`${prefix}-mode`}><select id={`${prefix}-mode`} value={section.rsvpMode ?? "external"} onChange={e => onChange({ rsvpMode: e.target.value as "integrated" | "external" })}><option value="integrated">Aquí mismo, en la invitación</option><option value="external">En WhatsApp u otro enlace</option></select></Field>}
    <Field label={({ story: "Cuenta la historia de tu celebración", ceremony: "Nombre del lugar de la ceremonia", reception: "Nombre del lugar de la recepción", program: "Horario y actividad, un momento por renglón", parents: "Nombres de las personas que quieres mencionar", dress_code: "¿Cómo deben vestir tus invitados?", gifts: "Mensaje sobre los regalos", rsvp: "Mensaje de confirmación (opcional)", music: "Mensaje para la playlist", custom: "Información adicional" } as Record<string, string>)[section.type]} id={`${prefix}-content`} help={section.type === "program" ? "Ejemplo: 17:00 — Ceremonia. Escribe únicamente los horarios reales de tu evento." : undefined}><textarea id={`${prefix}-content`} rows={section.type === "program" ? 5 : 3} value={section.content} maxLength={2000} placeholder={({ story: "Todo empezó cuando…", ceremony: "Ej. Parroquia San José", reception: "Ej. Jardín Las Rosas", dress_code: "Ej. Casual, con calzado cómodo.", gifts: "Tu compañía es nuestro mejor regalo…" } as Record<string, string>)[section.type]} onChange={e => onChange({ content: e.target.value })} /></Field>
    {(section.type === "ceremony" || section.type === "reception") && <><Field label="Horario" id={`${prefix}-time`}><input id={`${prefix}-time`} value={section.detail} maxLength={240} placeholder="Ej. 5:00 p. m." onChange={e => onChange({ detail: e.target.value })} /></Field><Field label="Dirección o enlace de Google Maps" id={`${prefix}-map`}><input id={`${prefix}-map`} value={section.link} maxLength={500} placeholder="Calle, número y ciudad, o enlace de Maps" onChange={e => onChange({ link: e.target.value })} /></Field></>}
    {(section.type === "gifts" || section.type === "music" || section.type === "custom" || (section.type === "rsvp" && section.rsvpMode === "external")) && <Field label={section.type === "gifts" ? "Enlace a la mesa de regalos (opcional)" : section.type === "music" ? "Enlace a la playlist" : section.type === "custom" ? "Enlace adicional (opcional)" : "Enlace de WhatsApp o confirmación"} id={`${prefix}-link`} help={section.type === "rsvp" ? "Por ejemplo: https://wa.me/521 seguido de tu número." : undefined}><input id={`${prefix}-link`} type="url" maxLength={500} value={section.link} placeholder="https://…" onChange={e => onChange({ link: e.target.value })} /></Field>}
    {allowSectionPhoto && <div className="guided-section-photo">
      <h3>Foto junto a esta sección <span>Opcional</span></h3>
      <p>Intercala una foto grande entre los bloques de tu invitación.</p>
      <CloudinaryImageUpload {...uploadProps} multiple={false} images={section.imageUrl ? [section.imageUrl] : []} onChange={images => onChange({ imageUrl: images[0] ?? "", imagePosition: section.imagePosition ?? "after" })} />
      {section.imageUrl && <Field label="¿Dónde quieres mostrar la foto?" id={`${prefix}-photo-position`}><select id={`${prefix}-photo-position`} value={section.imagePosition ?? "after"} onChange={event => onChange({ imagePosition: event.target.value as "before" | "after" })}><option value="before">Antes de esta sección</option><option value="after">Después de esta sección</option></select></Field>}
    </div>}
  </>;
}
