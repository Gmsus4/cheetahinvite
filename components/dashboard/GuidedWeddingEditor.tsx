"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiCheck, FiEye, FiHeart, FiLock, FiSave } from "react-icons/fi";
import { prepareEvent } from "@/app/crear/actions";
import { publishEvent, updateEvent } from "@/app/dashboard/eventos/[id]/actions";
import { BrandEmblem } from "@/components/BrandEmblem";
import { WeddingInvitation } from "@/components/invitation/WeddingInvitation";
import { applyWeddingDesign, getWeddingDesign, weddingDesigns, weddingDetails, weddingPalette, weddingPublicationIssues, weddingSections } from "@/lib/wedding-designs";
import { EditorSaveFailure, editorFormData, type EditorValues, type InviteSection } from "@/lib/invitation-editor";
import { invitationPriceLabel, isInvitationPublished } from "@/lib/invitation-payment";
import { invitationPath } from "@/lib/invitation-url";
import { CloudinaryImageUpload, type EventData } from "./EventEditor";
import { useEditorProtection } from "./useEditorProtection";
import { EditorProtectedLink } from "./EditorProtectedLink";
import { EditorLeaveDialog } from "./EditorLeaveDialog";
import { EditorRecoveryDialog } from "./EditorRecoveryDialog";
import { InvitationLivePreview } from "./InvitationLivePreview";
import { CustomInvitationLinkField } from "./CustomInvitationLinkField";
import { WeddingDesignPicker } from "./WeddingDesignPicker";

const steps = ["Tu celebración", "Datos principales", "Dale tu toque", "Revisa y comparte"];
const descriptions = ["Elige un diseño. Nosotros cuidamos cada detalle.", "Cuéntanos cuándo y dónde empieza esta nueva etapa.", "Hazla suya con sus fotos y los detalles que quieran compartir.", "Así recibirán la invitación las personas que más quieren."];

function initialValues(event: EventData): EditorValues {
  const design = getWeddingDesign(event.templateId) ?? weddingDesigns[0];
  const stored = Array.isArray(event.sections) ? event.sections as InviteSection[] : [];
  const sections = weddingSections().map(section => stored.find(previous => previous.type === section.type) ?? section);
  return applyWeddingDesign({
    name: event.name || "Nuestra boda", eventType: "wedding", hostNames: event.hostNames ?? "",
    eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 10) : "", eventTime: event.eventTime ?? "",
    venue: event.venue ?? "", address: event.address ?? "", message: event.message ?? "", imageUrl: event.imageUrl ?? "",
    customSlug: event.customSlug ?? "", accent: event.accent, templateId: design.id, typography: design.typography,
    bodyTypography: design.bodyTypography, texture: "none", heroHorizontal: "center", heroVertical: "center",
    buttonAppearance: design.buttons, sections,
  }, design.id, event.accent);
}

export function GuidedWeddingEditor({ event, creation = false, saved, error, onLegacyRecovery }: { event: EventData; creation?: boolean; saved: boolean; published: boolean; error: string; onLegacyRecovery(eventType: string): void }) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialValues(event));
  const [step, setStep] = useState(0);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
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
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  const closePreview = useCallback(() => setPreviewExpanded(false), []);
  const busy = saving || !protection.ready || Boolean(protection.recovery);
  const dirty = snapshot !== protection.acknowledged || protection.code === "conflict";
  const design = getWeddingDesign(values.templateId)!;
  const issues = weddingPublicationIssues(values);
  const published = isInvitationPublished(event);
  const date = values.eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${values.eventDate}T12:00:00Z`)) : "Fecha por definir";
  const status = uploads ? "Subiendo fotografías…" : protection.saving || saving ? "Guardando…" : protection.local ? "Borrador protegido en este dispositivo" : protection.lastSaved || saved ? "Cambios guardados" : "Tu invitación es privada";
  function patch(changes: Partial<EditorValues>) { setNotice(""); setValues(current => ({ ...current, ...changes })); }
  function changeSection(id: string, changes: Partial<InviteSection>) { setNotice(""); setValues(current => ({ ...current, sections: current.sections.map(section => section.id === id ? { ...section, ...changes } : section) })); }
  function goTo(target: number) {
    if (uploads || busy) return;
    if (target > step && !form.current?.reportValidity()) return;
    setStep(target);
    heading.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }
  function recover() {
    const candidate = protection.recovery;
    if (candidate) {
      const previous = JSON.parse(candidate.snapshot) as EditorValues;
      if (!getWeddingDesign(previous.templateId)) { onLegacyRecovery(previous.eventType); return; }
    }
    const record = persistence.recover();
    if (!record) return;
    const restored = JSON.parse(record.snapshot) as EditorValues;
    setValues(applyWeddingDesign(restored, restored.templateId, restored.accent));
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

  return <main className="guided-editor">
    {protection.recovery && <EditorRecoveryDialog onRecover={recover} onDiscard={() => persistence.discardRecovery()} />}
    {navigation.destination && <EditorLeaveDialog onStay={navigation.stay} onLeave={navigation.leave} />}
    <header className="guided-header"><EditorProtectedLink guard={confirmNavigation} href="/dashboard" className="brand"><BrandEmblem size={34} /><span className="brand-name">Cheetah<span>Invite</span></span></EditorProtectedLink><span className="guided-save-status" role="status"><FiLock aria-hidden="true" />{status}</span><EditorProtectedLink guard={confirmNavigation} href="/dashboard" className="guided-exit">Mis eventos <FiArrowRight /></EditorProtectedLink></header>
    <div className="guided-layout">
      <div className="guided-workspace">
        <nav className="guided-progress" aria-label="Pasos de tu invitación"><ol>{steps.map((label, index) => <li key={label}><button type="button" aria-current={step === index ? "step" : undefined} disabled={busy || uploads > 0} onClick={() => goTo(index)}><span>{index < step ? <FiCheck /> : index + 1}</span><strong>{label}</strong></button></li>)}</ol></nav>
        <div className="guided-heading"><span className="guided-eyebrow">{creation ? "CREA ALGO ESPECIAL" : "TU INVITACIÓN"} · PASO {step + 1} DE 4</span><h1 ref={heading} tabIndex={-1}>{steps[step]}</h1><p>{descriptions[step]}</p></div>
        {protection.localWarning && <p className="guided-alert" role="status">El navegador no permite guardar una copia local. Guarda tu borrador antes de salir.</p>}
        {(protection.error || error) && <div className="guided-alert" role="alert"><p>{protection.error || (error === "pendientes" ? "Completa los datos principales y los detalles activos antes de continuar al pago." : "Revisa tus datos e intenta guardar de nuevo.")}</p><div>{protection.conflictVersion !== undefined && <><button type="button" disabled={busy || uploads > 0} onClick={() => void save(false, true)}>Guardar mi versión</button><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${persistence.getEventId()}/show`} target="_blank">Revisar versión guardada</EditorProtectedLink></>}{protection.code === "unavailable" && <button type="button" disabled={busy || uploads > 0} onClick={() => void save()}>Reintentar guardado</button>}{protection.code === "auth" && <EditorProtectedLink guard={confirmNavigation} href={`/login?callbackUrl=${encodeURIComponent(creation ? "/crear" : `/dashboard/eventos/${event.id}`)}`}>Iniciar sesión</EditorProtectedLink>}</div></div>}
        {notice && <p className="guided-notice" role="status">{notice}</p>}
        <form ref={form} onSubmit={submit} noValidate className="guided-form" aria-busy={saving}>
          <fieldset disabled={busy} className="guided-fields">
            {step === 0 && <>
              <div className="guided-occasion"><FiHeart /><div><strong>Vamos a celebrar una boda</strong><p>Un diseño pensado para contar su historia.</p></div></div>
              {creation && !event.id && <details className="guided-other-events"><summary>¿Es otro tipo de celebración?</summary><div>{[["birthday", "Cumpleaños"], ["graduation", "Graduación"], ["baby_shower", "Baby shower"], ["anniversary", "Aniversario"], ["other", "Otro evento"]].map(([type, label]) => <EditorProtectedLink key={type} guard={confirmNavigation} href={`/crear?tipo=${type}`}>{label}<FiArrowRight /></EditorProtectedLink>)}</div></details>}
              <WeddingDesignPicker value={design.id} onChange={id => setValues(current => applyWeddingDesign(current, id))} />
            </>}
            {step === 1 && <div className="guided-data-grid">
              <Field label="¿Cómo se llaman?" id="w-hosts" wide help="Escribe los nombres tal como quieres que aparezcan."><input id="w-hosts" value={values.hostNames} maxLength={120} placeholder="Ej. Sofía y Mateo" onChange={e => patch({ hostNames: e.target.value })} /></Field>
              <Field label="Nombre de la invitación" id="w-name" wide><input id="w-name" value={values.name} required minLength={2} maxLength={100} onChange={e => patch({ name: e.target.value })} /></Field>
              <Field label="Fecha" id="w-date"><input id="w-date" type="date" value={values.eventDate} onChange={e => patch({ eventDate: e.target.value, ...(!e.target.value ? { eventTime: "" } : {}) })} /></Field>
              <Field label="Hora" id="w-time" help={!values.eventDate ? "Primero elige una fecha." : undefined}><input id="w-time" type="time" disabled={!values.eventDate} value={values.eventTime} onChange={e => patch({ eventTime: e.target.value })} /></Field>
              <Field label="¿Dónde será la celebración?" id="w-venue" wide help="Nombre del salón, jardín o lugar principal de la boda."><input id="w-venue" value={values.venue} maxLength={160} placeholder="Ej. Hacienda Las Nubes" onChange={e => patch({ venue: e.target.value })} /></Field>
              <Field label="Dirección" id="w-address" wide help="Incluye calle, número y ciudad. Crearemos el botón para abrir el mapa."><input id="w-address" value={values.address} maxLength={240} placeholder="Calle, número, colonia y ciudad" onChange={e => patch({ address: e.target.value })} /></Field>
              <p className="guided-help guided-wide">¿Aún no tienes todos los datos? Puedes guardar un borrador y completarlos antes de publicar.</p>
            </div>}
            {step === 2 && <>
              <fieldset className="guided-palettes"><legend>El color de su día</legend><p>{design.palettes.length} combinaciones creadas para {design.label.toLowerCase()}.</p><div>{design.palettes.map(palette => <label key={palette.accent}><input type="radio" name="wedding-palette" checked={values.accent === palette.accent} onChange={() => patch({ accent: palette.accent })} /><span className="guided-palette-swatches" aria-hidden="true">{[palette.paper, palette.panel, palette.accent, palette.dark].map(color => <i key={color} style={{ background: color }} />)}</span><strong>{palette.label}</strong>{values.accent === palette.accent && <FiCheck />}</label>)}</div></fieldset>
              <div className="guided-photo-field"><h2>Una foto de ustedes <span>Opcional</span></h2><p>Elige una foto con espacio alrededor de sus rostros. También preparamos un diseño especial sin fotografía.</p><CloudinaryImageUpload {...uploadProps} images={values.imageUrl ? [values.imageUrl] : []} multiple={false} onChange={images => patch({ imageUrl: images[0] ?? "" })} /></div>
              <Field label="Un mensaje para sus invitados" id="w-message" help="Opcional. Si lo dejas vacío, usaremos una bienvenida breve."><textarea id="w-message" rows={3} maxLength={1200} value={values.message} placeholder="Nos encantará compartir este día contigo…" onChange={e => patch({ message: e.target.value })} /></Field>
              <div className="guided-details-heading"><h2>Los detalles de su celebración</h2><p>Activa lo que quieran compartir. Nosotros cuidamos el orden.</p></div>
              <div className="guided-details">{weddingDetails.map(detail => {
                const section = values.sections.find(section => section.type === detail.type)!;
                return <div className={`guided-detail${section.enabled ? " is-enabled" : ""}`} key={detail.type}><label className="guided-toggle" htmlFor={`toggle-${section.id}`}><span><strong>{detail.question}</strong><small>{detail.help}</small></span><input id={`toggle-${section.id}`} type="checkbox" checked={section.enabled} onChange={e => changeSection(section.id, { enabled: e.target.checked })} /><span className="guided-switch" aria-hidden="true" /></label>{section.enabled && <div className="guided-detail-fields"><SectionFields section={section} onChange={changes => changeSection(section.id, changes)} uploadProps={uploadProps} /></div>}</div>;
              })}</div>
            </>}
            {step === 3 && <>
              <div className="guided-review-design"><FiCheck /><div><strong>{design.label}</strong><span>{weddingPalette(design, values.accent).label} · Diseño listo</span></div><button type="button" onClick={() => goTo(0)}>Cambiar</button></div>
              <dl className="guided-review">{[["Protagonistas", values.hostNames || "Por definir"], ["Fecha y hora", `${date}${values.eventTime ? ` · ${values.eventTime}` : ""}`], ["Lugar", values.venue || "Por definir"], ["Dirección", values.address || "Por definir"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}<button type="button" onClick={() => goTo(1)} aria-label={`Editar ${label.toLowerCase()}`}>Editar</button></dd></div>)}</dl>
              <div className="guided-checklist"><h2>{issues.length ? "Antes de publicar" : "Todo listo para compartir"}</h2>{issues.length ? <><p>Puedes guardar el borrador ahora. Para publicar, completa lo siguiente:</p><ul>{issues.map(issue => <li key={issue.message}><button type="button" onClick={() => goTo(issue.step)}>{issue.message}<FiArrowRight /></button></li>)}</ul></> : <p>Los datos principales están completos. Revisa la vista previa antes de continuar.</p>}</div>
              {!creation && <CustomInvitationLinkField eventId={event.id} ownerId={event.ownerId} value={values.customSlug} savedValue={event.customSlug} suggestion="nuestra-boda" onChange={customSlug => patch({ customSlug })} />}
              {!event.paidAt && <p className="guided-payment"><FiLock />{invitationPriceLabel} MXN · IVA incluido · 12 meses activa. Tu enlace será público al confirmar el pago.</p>}
              <div className="guided-final-actions"><button className="button" type="button" disabled={busy || uploads > 0 || (!creation && !dirty)} onClick={() => void save()}><FiSave />{published ? "Guardar cambios" : "Guardar borrador"}</button>{!event.paidAt && <button className="button guided-publish" type="button" disabled={busy || uploads > 0 || issues.length > 0} onClick={() => void save(true)}>Guardar y continuar al pago <FiArrowRight /></button>}</div>
              {!creation && <div className="guided-management"><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}/asistencias`}>Ver confirmaciones</EditorProtectedLink><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}/pago`}>Pago y soporte</EditorProtectedLink>{published && <EditorProtectedLink guard={confirmNavigation} href={invitationPath(event)!} target="_blank">Abrir invitación pública</EditorProtectedLink>}</div>}
            </>}
          </fieldset>
          <div className="guided-bottom-bar"><button className="guided-back" type="button" disabled={step === 0 || busy || uploads > 0} onClick={() => goTo(step - 1)}><FiArrowLeft /> Anterior</button><span>{step + 1} de 4</span>{step < 3 && <button className="button" type="submit" disabled={busy || uploads > 0}>Continuar <FiArrowRight /></button>}</div>
        </form>
      </div>
      <aside className={`guided-preview${previewExpanded ? " is-open" : ""}`}><div className="guided-preview-heading"><span>ASÍ VA QUEDANDO</span><small>Se actualiza mientras editas</small></div><InvitationLivePreview initialDevice="mobile" fitViewport expanded={previewExpanded} onClose={closePreview}><WeddingInvitation {...values} date={date} eventDateKey={values.eventDate} /></InvitationLivePreview><button className="guided-expand-preview" type="button" onClick={() => setPreviewExpanded(true)}><FiEye /> Ver invitación completa</button><p className="guided-help">La vista previa muestra tus cambios. Tus invitados verán la última versión guardada.</p></aside>
    </div>
    <button className="guided-mobile-preview" type="button" onClick={() => setPreviewExpanded(true)}><FiEye /> Ver invitación</button>
  </main>;
}

function Field({ label, id, help, wide, children }: { label: string; id: string; help?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`guided-field${wide ? " guided-wide" : ""}`}><label htmlFor={id}>{label}</label>{children}{help && <small>{help}</small>}</div>;
}

function SectionFields({ section, onChange, uploadProps }: { section: InviteSection; onChange(changes: Partial<InviteSection>): void; uploadProps: { eventId: string; ensureEvent?: () => Promise<string>; onBusyChange(active: boolean): void } }) {
  const prefix = section.id;
  if (section.type === "gallery") return <CloudinaryImageUpload {...uploadProps} multiple images={section.imageUrls ?? []} onChange={imageUrls => onChange({ imageUrls, imageUrl: imageUrls[0] ?? "" })} />;
  return <>
    {section.type === "rsvp" && <Field label="¿Cómo quieren recibir las respuestas?" id={`${prefix}-mode`}><select id={`${prefix}-mode`} value={section.rsvpMode ?? "integrated"} onChange={e => onChange({ rsvpMode: e.target.value as "integrated" | "external" })}><option value="integrated">Aquí mismo, en la invitación</option><option value="external">En WhatsApp u otro enlace</option></select></Field>}
    <Field label={({ story: "Cuéntanos su historia", ceremony: "Nombre del lugar de la ceremonia", reception: "Nombre del lugar de la recepción", program: "Horario y actividad, un momento por renglón", parents: "Nombres de las personas que quieren mencionar", dress_code: "¿Cómo deben vestir sus invitados?", gifts: "Mensaje sobre los regalos", rsvp: "Mensaje de confirmación (opcional)" } as Record<string, string>)[section.type]} id={`${prefix}-content`} help={section.type === "program" ? "Ejemplo: 17:00 — Ceremonia. Escribe únicamente los horarios reales de tu boda." : undefined}><textarea id={`${prefix}-content`} rows={section.type === "program" ? 5 : 3} value={section.content} maxLength={2000} placeholder={({ story: "Todo empezó cuando…", ceremony: "Ej. Parroquia San José", reception: "Ej. Jardín Las Rosas", dress_code: "Ej. Formal. Reserva el blanco para la novia.", gifts: "Tu compañía es nuestro mejor regalo…" } as Record<string, string>)[section.type]} onChange={e => onChange({ content: e.target.value })} /></Field>
    {(section.type === "ceremony" || section.type === "reception") && <><Field label="Horario" id={`${prefix}-time`}><input id={`${prefix}-time`} value={section.detail} maxLength={240} placeholder="Ej. 5:00 p. m." onChange={e => onChange({ detail: e.target.value })} /></Field><Field label="Dirección o enlace de Google Maps" id={`${prefix}-map`}><input id={`${prefix}-map`} value={section.link} maxLength={500} placeholder="Calle, número y ciudad, o enlace de Maps" onChange={e => onChange({ link: e.target.value })} /></Field></>}
    {(section.type === "gifts" || (section.type === "rsvp" && section.rsvpMode === "external")) && <Field label={section.type === "gifts" ? "Enlace a la mesa de regalos (opcional)" : "Enlace de WhatsApp o confirmación"} id={`${prefix}-link`} help={section.type === "rsvp" ? "Por ejemplo: https://wa.me/521 seguido de tu número." : undefined}><input id={`${prefix}-link`} type="url" maxLength={500} value={section.link} placeholder="https://…" onChange={e => onChange({ link: e.target.value })} /></Field>}
  </>;
}
