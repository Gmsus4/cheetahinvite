"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiCamera, FiChevronDown, FiCheck, FiEye, FiList, FiLock, FiSave, FiSend, FiSliders, FiUsers, FiMapPin, FiPlus } from "react-icons/fi";
import { prepareEvent } from "@/app/crear/actions";
import { publishEvent, updateEvent } from "@/app/dashboard/eventos/[id]/actions";
import { InvitationSurfacePicker } from "./InvitationSurfacePicker";
import { InvitationPalettePicker } from "./InvitationPalettePicker";
import { InvitationFontSelect } from "./InvitationFontSelect";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import { initialGuidedValues, completeGuidedSections, changeGuidedEventType, guidedDetails, guidedPublicationIssues, guidedRecoveryStep, guidedRecoverySection, guidedRecoveryAppearance, guidedContentSectionIds } from "@/lib/guided-invitation";
import { getInvitationFont, recommendedInvitationFonts } from "@/lib/invitation-fonts";
import { getInvitationEventContent, invitationEventTypes } from "@/lib/invitation-event-content";
import { sharedInvitationDesign, invitationPalette } from "@/lib/shared-invitation";
import { EditorSaveFailure, editorFormData, type EventData, type EditorValues, type InviteSection } from "@/lib/invitation-editor";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { invitationPriceLabel, isInvitationPublished } from "@/lib/invitation-payment";
import { invitationPath } from "@/lib/invitation-url";
import { CloudinaryImageUpload } from "./CloudinaryImageUpload";
import { SectionFields } from "./InvitationSectionFields";
import { useEditorProtection } from "./useEditorProtection";
import { EditorProtectedLink } from "./EditorProtectedLink";
import { EditorLeaveDialog } from "./EditorLeaveDialog";
import { EditorRecoveryDialog } from "./EditorRecoveryDialog";
import { InvitationLivePreview, type InvitationPreviewFocus } from "./InvitationLivePreview";
import { InvitationPublicLink } from "./InvitationPublicLink";
import { InvitationPrivacySettings } from "./InvitationPrivacySettings";
import { CustomInvitationLinkField } from "./CustomInvitationLinkField";
import styles from "./EventWorkspace.module.css";
import { DashboardHeader } from "./DashboardHeader";

const steps = ["¿Quién celebra?", "¿Cuándo y dónde?", "¿Quieres agregar fotografías?", "¿Qué quieres compartir?", "¿Cómo quieres que se vea?", "Revisa tu invitación"];
const stepLabels = ["Quién celebra", "Fecha y lugar", "Fotografías", "Contenido", "Apariencia", "Revisión"];
const stepIcons = [FiUsers, FiMapPin, FiCamera, FiList, FiSliders, FiSend];
const descriptions = ["Empecemos por las personas que hacen especial esta celebración.", "Comparte los datos que ya tengas. Puedes completar el resto después.", "Una imagen puede contar mucho. Este paso es opcional.", "Preparamos los detalles según tu evento. Revísalos uno a uno, a tu ritmo.", "Puedes quedarte con esta combinación o darle tu propio toque.", "Así recibirán la invitación las personas que más quieres."];
const lastStep = steps.length - 1;

export function GuidedInvitationEditor({ event, creation = false, error, account }: { event: EventData; creation?: boolean; saved: boolean; published: boolean; error: string; account?: { name: string; email: string; image?: string | null } }) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialGuidedValues(event));
  const [step, setStep] = useState(0);
  const [activeSection, setActiveSection] = useState("__welcome");
  const [addingDetail, setAddingDetail] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [mobileStepsExpanded, setMobileStepsExpanded] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [focusedField, setFocusedField] = useState<(InvitationPreviewFocus & { context: string }) | null>(null);
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
    save: async (submitted, version, automatic) => {
      const formData = editorFormData(submitted, version);
      // Older device backups may contain a link chosen before payment.
      if (!event.paidAt) formData.delete("customSlug");
      return updateEvent(await ensureEvent(submitted), formData, automatic ? "auto" : "manual");
    },
  });
  useEffect(() => { persistence.update(snapshot, uploads > 0, { step, activeExtra: step === 3 ? (addingDetail ? `__add:${activeSection}` : activeSection) : step === 4 && appearanceExpanded ? "appearance-custom" : null, flow: "content-v4" }, manualOnly); }, [persistence, snapshot, uploads, step, activeSection, addingDetail, appearanceExpanded, manualOnly]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (scrollToTop.current) {
      scrollToTop.current = false;
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }, [step, activeSection]);
  const busy = saving || !protection.ready || Boolean(protection.recovery);
  const dirty = snapshot !== protection.acknowledged || protection.code === "conflict";
  const design = sharedInvitationDesign;
  const content = getInvitationEventContent(values.eventType);
  const details = guidedDetails(values.eventType);
  const editableSections = details.flatMap(detail => values.sections.filter(section => section.type === detail.type));
  const contentIds = guidedContentSectionIds(values.eventType, values.sections, activeSection);
  const availableSections = editableSections.filter(section => !section.enabled);
  const includedSections = editableSections.filter(section => section.enabled);
  const contentKey = contentIds.includes(activeSection) ? activeSection : '__welcome';
  const contentIndex = contentIds.indexOf(contentKey);
  const currentSection = values.sections.find(section => section.id === contentKey);
  const previewContext = `${step}:${contentKey}`;
  const sectionTarget = currentSection?.enabled ? `section:${currentSection.id}` : undefined;
  const defaultPreviewFocus: InvitationPreviewFocus | undefined = step === 0 ? { target: "w-hosts", label: "Protagonistas" }
    : step === 1 ? { target: "w-date", label: "Fecha y lugar" }
    : step === 2 ? { target: "cover-photo", label: "Foto de portada" }
    : step === 3 && contentKey === "__welcome" ? { target: "w-message", label: "Mensaje de bienvenida" }
    : step === 3 && sectionTarget && currentSection ? { target: sectionTarget, label: currentSection.title }
    : undefined;
  const previewFocus = step === 3 && currentSection && !currentSection.enabled ? undefined : focusedField?.context === previewContext
    ? { target: focusedField.target, label: focusedField.label, fallback: focusedField.fallback ?? sectionTarget, sequence: focusedField.sequence }
    : defaultPreviewFocus;
  const palette = invitationPalette(values.accent);
  const continuingDetail = step === 3 && contentIndex < contentIds.length - 1;
  const continueLabel = step === 4 && !appearanceExpanded ? 'Me gusta así' : 'Continuar';
  const issues = guidedPublicationIssues(values);
  const published = isInvitationPublished(event);
  const changesSaved = protection.ready && !protection.recovery && !protection.error && !dirty && !saving && !protection.saving && uploads === 0 && (!creation || protection.lastSaved);
  const saveLabel = uploads > 0 ? "Subiendo fotografías…" : saving || protection.saving ? "Guardando…" : changesSaved ? "Cambios guardados" : published ? "Guardar cambios" : "Guardar borrador";
  const date = values.eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${values.eventDate}T12:00:00Z`)) : "Fecha por definir";
  function patch(changes: Partial<EditorValues>) { setNotice(""); setValues(current => ({ ...current, ...changes })); }
  function changeSection(id: string, changes: Partial<InviteSection>) { setNotice(""); setValues(current => ({ ...current, sections: current.sections.map(section => section.id === id ? { ...section, ...changes } : section) })); }
  function validateCurrent() {
    const invalid = form.current?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input:invalid,textarea:invalid,select:invalid');
    if (!invalid) return true;
    const advanced = invalid.closest<HTMLDetailsElement>('details');
    if (advanced) advanced.open = true;
    invalid.reportValidity();
    return false;
  }
  function goTo(target: number, sectionId?: string) {
    setMobileStepsExpanded(false);
    if (uploads || busy || (target > step && !validateCurrent())) return;
    if (sectionId && target === 3) { setActiveSection(sectionId); setAddingDetail(false); }
    if (target === 4 && sectionId === 'appearance-custom') setAppearanceExpanded(true);
    scrollToTop.current = true;
    setStep(target);
  }
  function continueJourney() {
    if (uploads || busy || !validateCurrent()) return;
    scrollToTop.current = true;
    if (step === 3 && addingDetail) { setAddingDetail(false); setActiveSection("__more"); }
    else if (continuingDetail) setActiveSection(contentIds[contentIndex + 1]);
    else goTo(step + 1);
  }
  function previousJourney() {
    if (uploads || busy) return;
    scrollToTop.current = true;
    if (step === 3 && addingDetail) { setAddingDetail(false); setActiveSection("__more"); }
    else if (step === 3 && contentIndex > 0) setActiveSection(contentIds[contentIndex - 1]);
    else goTo(step - 1);
  }
  function recover() {
    const record = persistence.recover();
    if (!record) return;
    const recovered = JSON.parse(record.snapshot) as EditorValues;
    const restored = { ...recovered, texture: "none", sections: completeGuidedSections(recovered.eventType, recovered.sections) };
    setValues({ ...restored, texture: "none" });
    setStep(guidedRecoveryStep(record.wizard));
    setActiveSection(guidedRecoverySection(record.wizard, restored.sections));
    setAddingDetail(record.wizard.flow === "content-v4" && Boolean(record.wizard.activeExtra?.startsWith("__add:")));
    setAppearanceExpanded(guidedRecoveryAppearance(record.wizard));
    if (creation && record.eventId) router.replace(`/crear?resume=${record.eventId}`);
  }
  async function save(forPublication = false, overwrite = false) {
    if (busy || uploads) return;
    if (forPublication && issues.length) { setStep(lastStep); setNotice("Completa los datos pendientes antes de continuar al pago."); return; }
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
  async function openPrivatePreview() {
    if (busy || uploads > 0 || !validateCurrent()) return;
    // Open during the click so the browser does not block the tab after saving.
    const preview = window.open('about:blank', '_blank');
    if (preview) preview.opener = null;
    setSaving(true);
    setNotice('');
    try {
      const result = await persistence.saveNow(false);
      if (!result.ok) { preview?.close(); return; }
      const href = `/dashboard/eventos/${result.eventId}/show`;
      if (preview) {
        if (!preview.closed) preview.location.replace(href);
        setNotice('Cambios guardados. La vista previa se abrió en otra pestaña.');
      } else router.push(href);
    } catch {
      preview?.close();
      persistence.reportError('No pudimos preparar la vista previa. Tu borrador sigue protegido; intenta de nuevo.');
    } finally { setSaving(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (step < lastStep) continueJourney(); else void save(); }
  const uploadBusy = (active: boolean) => setUploads(current => current + (active ? 1 : -1));
  const uploadProps = { eventId: event.id, ensureEvent: creation ? () => ensureEvent() : undefined, onBusyChange: uploadBusy };
  const CurrentStepIcon = stepIcons[step];
  const progress = <nav className="guided-progress guided-journey-progress" data-grouped="true" data-expanded={mobileStepsExpanded} aria-label="Pasos de tu invitación" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMobileStepsExpanded(false); }} onKeyDown={event => { if (event.key === 'Escape') { setMobileStepsExpanded(false); event.currentTarget.querySelector<HTMLButtonElement>('.guided-steps-toggle')?.focus(); } }}>
    <button className="guided-steps-toggle" type="button" aria-expanded={mobileStepsExpanded} aria-controls="guided-step-options" aria-label={`Paso ${step + 1} de ${steps.length}: ${stepLabels[step]}. ${mobileStepsExpanded ? 'Ocultar' : 'Mostrar'} todos los pasos`} onClick={() => setMobileStepsExpanded(current => !current)}><CurrentStepIcon aria-hidden="true" /><span>{step + 1} / {steps.length}</span><FiChevronDown aria-hidden="true" /></button>
    <ol id="guided-step-options" hidden={!mobileStepsExpanded}>{stepLabels.map((label, index) => {
      const Icon = stepIcons[index];
      return <li key={label}><button type="button" aria-label={`Paso ${index + 1}: ${label}`} aria-current={step === index ? 'step' : undefined} disabled={busy || uploads > 0} onClick={() => goTo(index)}><span aria-hidden="true"><Icon /></span><strong>{label}</strong></button></li>;
    })}</ol>
  </nav>;

  return <main className={`guided-editor ${styles.workspace}`} data-short-step={step === 0 || step === 1 || step === 2 || (step === 4 && !appearanceExpanded)}>
    {protection.recovery && <EditorRecoveryDialog onRecover={recover} onDiscard={() => persistence.discardRecovery()} />}
    {navigation.destination && <EditorLeaveDialog onStay={navigation.stay} onLeave={navigation.leave} />}
    <DashboardHeader name={account?.name || "Usuario"} email={account?.email || ""} image={account?.image} guard={confirmNavigation} />
    <div className="guided-layout">
      <div className="guided-workspace">
        <div className="guided-heading"><span className="guided-eyebrow">{creation ? "CREA ALGO ESPECIAL" : "TU INVITACIÓN"} · PASO {step + 1} DE {steps.length}</span><h1 ref={heading} tabIndex={-1}>{steps[step]}</h1><p>{descriptions[step]}</p></div>
        {protection.localWarning && <p className="guided-alert" role="status">El navegador no permite guardar una copia local. Guarda tu borrador antes de salir.</p>}
        {(protection.error || error) && <div className="guided-alert" role="alert"><p>{protection.error || (error === "pendientes" ? "Completa los datos principales y los detalles activos antes de continuar al pago." : "Revisa tus datos e intenta guardar de nuevo.")}</p><div>{protection.conflictVersion !== undefined && <><button type="button" disabled={busy || uploads > 0} onClick={() => void save(false, true)}>Guardar mi versión</button><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${persistence.getEventId()}/show`} target="_blank">Revisar versión guardada</EditorProtectedLink></>}{protection.code === "unavailable" && <button type="button" disabled={busy || uploads > 0} onClick={() => void save()}>Reintentar guardado</button>}{protection.code === "auth" && <EditorProtectedLink guard={confirmNavigation} href={`/login?callbackUrl=${encodeURIComponent(creation ? "/crear" : `/dashboard/eventos/${event.id}`)}`}>Iniciar sesión</EditorProtectedLink>}</div></div>}
        {notice && <p className="guided-notice" role="status">{notice}</p>}
        <form ref={form} onSubmit={submit} noValidate className="guided-form" aria-busy={saving} onFocusCapture={event => {
          const field = event.target.closest<HTMLElement>("[data-preview-field]");
          if (field?.dataset.previewField) {
            const target = field.dataset.previewField;
            setFocusedField(previous => ({ context: previewContext, target, label: field.dataset.previewLabel || "Sección", fallback: step === 3 ? sectionTarget : "cover", sequence: (previous?.sequence ?? 0) + 1 }));
          }
        }}>
          <fieldset disabled={busy} className="guided-fields">
            {step === 0 && <div className="guided-data-grid">
              <Field label="Tipo de evento" id="event-type" wide><select id="event-type" value={values.eventType} onChange={e => { patch(changeGuidedEventType(values, e.target.value)); setActiveSection('__welcome'); setAddingDetail(false); }}>{invitationEventTypes.map(type => <option key={type} value={type}>{getInvitationEventContent(type).label}</option>)}</select></Field>
              <Field label={values.eventType === 'wedding' || values.eventType === 'anniversary' ? '¿Cómo se llaman?' : '¿Quién celebra?'} id="w-hosts" wide help="Escribe los nombres tal como quieres que aparezcan."><input id="w-hosts" value={values.hostNames} maxLength={120} placeholder="Nombre de quien celebra o de los anfitriones" onChange={e => patch({ hostNames: e.target.value })} /></Field>
              <Field label="Nombre de la invitación" id="w-name" wide><input id="w-name" value={values.name} required minLength={2} maxLength={100} onChange={e => patch({ name: e.target.value })} /></Field>
              <p className="guided-help guided-wide">Empecemos por los protagonistas. Los demás detalles vienen después.</p>
            </div>}
            {step === 1 && <div className="guided-data-grid">
              <Field label="Fecha" id="w-date"><input id="w-date" type="date" value={values.eventDate} onChange={e => patch({ eventDate: e.target.value, ...(!e.target.value ? { eventTime: '' } : {}) })} /></Field>
              <Field label="Hora" id="w-time" help={!values.eventDate ? 'Primero elige una fecha.' : undefined}><input id="w-time" type="time" disabled={!values.eventDate} value={values.eventTime} onChange={e => patch({ eventTime: e.target.value })} /></Field>
              <Field label="¿Dónde será la celebración?" id="w-venue" wide><input id="w-venue" value={values.venue} maxLength={160} placeholder="Nombre del salón, jardín o lugar" onChange={e => patch({ venue: e.target.value })} /></Field>
              <Field label="Dirección" id="w-address" wide help="Incluye calle, número y ciudad para que tus invitados puedan abrir el mapa."><input id="w-address" value={values.address} maxLength={240} placeholder="Calle, número, colonia y ciudad" onChange={e => patch({ address: e.target.value })} /></Field>
              <p className="guided-help guided-wide">Si todavía no tienes todos los datos, continúa y complétalos antes de publicar.</p>
            </div>}
            {step === 2 && <>
              <div className="guided-photo-grid">
                <section className="guided-photo-field" data-preview-field="cover-photo" data-preview-label="Foto de portada" aria-labelledby="cover-upload-title" aria-describedby="guided-photo-formats"><h2 id="cover-upload-title">Foto de portada <span>Opcional</span></h2><p>La imagen principal de tu invitación.</p><CloudinaryImageUpload {...uploadProps} images={values.imageUrl ? [values.imageUrl] : []} multiple={false} onChange={images => patch({ imageUrl: images[0] ?? '' })} /></section>
                <section className="guided-photo-field" data-preview-field="cover" data-preview-label="Foto de fondo" aria-labelledby="background-upload-title" aria-describedby="guided-photo-formats"><h2 id="background-upload-title">Foto de fondo <span>Opcional</span></h2><p>Detrás de las secciones. También inspira tu paleta.</p><CloudinaryImageUpload {...uploadProps} images={values.backgroundImageUrl ? [values.backgroundImageUrl] : []} multiple={false} onChange={images => patch({ backgroundImageUrl: images[0] ?? '' })} /></section>
              </div>
              <p className="guided-help" id="guided-photo-formats">JPG, PNG, WebP o AVIF · máximo {ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB por imagen. Puedes continuar sin subir fotos.</p>
            </>}
            {step === 3 && <>
              <section className="guided-included-summary" aria-labelledby="included-sections-title">
                <div className="guided-included-heading"><h2 id="included-sections-title">Tu invitación</h2><span role="status">{includedSections.length} {includedSections.length === 1 ? 'sección incluida' : 'secciones incluidas'}</span></div>
                {includedSections.length ? <><p>Selecciona una sección para revisarla.</p><nav aria-label="Secciones incluidas en tu invitación">{includedSections.map(section => <button key={section.id} type="button" title={section.title || extraDetailLabel(section)} aria-label={`Editar sección: ${section.title || extraDetailLabel(section)}`} aria-current={contentKey === section.id ? 'step' : undefined} disabled={busy || uploads > 0} onClick={() => goTo(3, section.id)}>{section.title || extraDetailLabel(section)}</button>)}</nav></> : <p>Aún no hay secciones incluidas. Puedes activarlas durante el recorrido o agregar un detalle al final.</p>}
              </section>
              {contentKey === '__more' ? <section className="guided-more-details" aria-labelledby="more-details-title">
                <h2 id="more-details-title">¿Quieres agregar algo más?</h2>
                <p>Estos detalles son opcionales. Elige uno para completarlo o continúa con la apariencia de tu invitación.</p>
                {availableSections.length ? <div className="guided-more-options">{availableSections.map(section => <button type="button" key={section.id} onClick={() => { changeSection(section.id, { enabled: true }); setAddingDetail(true); setActiveSection(section.id); }}><span>{extraDetailLabel(section)}</span><FiPlus aria-hidden="true" /></button>)}</div> : <p>Ya incluiste todos los detalles disponibles.</p>}
              </section> : <>
                <div className="guided-content-position"><span>{addingDetail ? 'Detalle adicional' : `Detalle ${contentIndex + 1} de ${contentIds.length - 1}`}</span><span>{contentIndex === 0 ? 'Una bienvenida para empezar' : 'Un detalle a la vez'}</span></div>
                <div className="guided-single-detail" key={contentKey} data-preview-field={sectionTarget} data-preview-label={currentSection?.title}>
                  {contentKey === '__welcome' ? <>
                    <h2>Un mensaje de bienvenida</h2><p>Ya preparamos unas palabras para tus invitados. Puedes dejarlas así o escribir las tuyas.</p>
                    <Field label="Un mensaje para tus invitados" id="w-message" help="Opcional. Si lo dejas vacío, usaremos una bienvenida breve."><textarea id="w-message" rows={5} maxLength={1200} value={values.message} onChange={e => patch({ message: e.target.value })} /></Field>
                  </> : currentSection && <>
                    <h2>{currentSection.title}</h2>
                    <label className="guided-toggle guided-include-toggle" htmlFor={`include-${currentSection.id}`}>
                      <span><strong>Incluir en mi invitación</strong><small>{currentSection.enabled ? 'Este detalle aparecerá en tu invitación.' : 'Este detalle no aparecerá. Conservaremos lo que hayas escrito.'}</small></span>
                      <input id={`include-${currentSection.id}`} type="checkbox" role="switch" checked={currentSection.enabled} onChange={e => changeSection(currentSection.id, { enabled: e.target.checked })} /><span className="guided-switch" aria-hidden="true" />
                    </label>
                    {currentSection.enabled ? <SectionFields globalPanelStyle={values.panelStyle ?? "auto"} section={currentSection} onChange={changes => changeSection(currentSection.id, changes)} uploadProps={uploadProps} allowSectionPhoto /> : <p className="guided-excluded-note">Puedes continuar o volver a activarlo cuando quieras.</p>}
                  </>}
                </div>
              </>}
            </>}
            {step === 4 && <>
              <section className="guided-suggested-look" aria-labelledby="suggested-look-title">
                <span className="guided-eyebrow">{appearanceExpanded ? 'TU COMBINACIÓN' : 'LISTA PARA TU CELEBRACIÓN'}</span><h2 id="suggested-look-title">{palette.label}</h2>
                <div className="guided-look-swatches" aria-label="Colores de la combinación">{[palette.paper, palette.panel, palette.accent, palette.dark].map((color, index) => <span key={index} style={{ background: color }} />)}</div>
                <div className="guided-font-preview"><h3 style={{ fontFamily: getInvitationFont(values.typography).family }}>{values.hostNames || values.name}</h3><p style={{ fontFamily: getInvitationFont(values.bodyTypography).family }}>Nos encantará compartir este día contigo. Una celebración para recordar.</p></div>
                <p>{getInvitationFont(values.typography).label} para títulos · {getInvitationFont(values.bodyTypography).label} para textos.</p>
              </section>
              <InvitationSurfacePicker values={values} onBlurChange={blurIntensity => patch({ blurIntensity })} onChange={panelStyle => patch({ panelStyle })} />
              <button className="guided-customize-look" type="button" aria-expanded={appearanceExpanded} aria-controls="guided-appearance-options" onClick={() => setAppearanceExpanded(current => !current)}><FiSliders />{appearanceExpanded ? 'Ocultar ajustes' : 'Personalizar colores y tipografías'}<FiChevronDown /></button>
              <div id="guided-appearance-options" className="guided-appearance-options" hidden={!appearanceExpanded}>
                <InvitationPalettePicker palettes={design.palettes} accent={values.accent} backgroundImageUrl={values.backgroundImageUrl} onChange={accent => patch({ accent })} />
                <section className="guided-typography" aria-labelledby="guided-typography-title"><h2 id="guided-typography-title">Las letras de tu celebración</h2><p>Te mostramos primero las fuentes recomendadas para {content.label.toLowerCase()}.</p>
                  <div className="guided-font-grid"><InvitationFontSelect role="heading" eventType={values.eventType} value={values.typography} onChange={typography => patch({ typography })} /><InvitationFontSelect role="body" eventType={values.eventType} value={values.bodyTypography} onChange={bodyTypography => patch({ bodyTypography })} /></div>
                  <div className="guided-font-suggestion"><p>Te sugerimos <strong>{getInvitationFont(recommendedInvitationFonts(values.eventType, 'heading')[0]).label}</strong> y <strong>{getInvitationFont(recommendedInvitationFonts(values.eventType, 'body')[0]).label}</strong>.</p><button type="button" onClick={() => patch({ typography: recommendedInvitationFonts(values.eventType, 'heading')[0], bodyTypography: recommendedInvitationFonts(values.eventType, 'body')[0] })}>Usar tipografías sugeridas</button></div>
                </section>
              </div>
            </>}
            {step === lastStep && <>
              <div className="guided-review-design"><FiCheck /><div><strong>Apariencia de tu invitación</strong><span>{(design.palettes.find(p => p.accent.toLowerCase() === values.accent.toLowerCase())?.label || "Color personalizado")}</span></div><button type="button" onClick={() => goTo(4, "appearance-custom")}>Ajustar apariencia</button></div>
              <dl className="guided-review">{[["Protagonistas", values.hostNames || "Por definir"], ["Fecha y hora", `${date}${values.eventTime ? ` · ${values.eventTime}` : ""}`], ["Lugar", values.venue || "Por definir"], ["Dirección", values.address || "Por definir"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}<button type="button" onClick={() => goTo(label === "Protagonistas" ? 0 : 1)} aria-label={`Editar ${label.toLowerCase()}`}>Editar</button></dd></div>)}</dl>
              <section className="guided-included-summary" aria-labelledby="review-sections-title">
                <div className="guided-included-heading"><h2 id="review-sections-title">Secciones de tu invitación</h2><span role="status">{includedSections.length} {includedSections.length === 1 ? 'sección incluida' : 'secciones incluidas'}</span></div>
                <p>{includedSections.length ? 'Estas son las secciones que elegiste. Puedes abrir cualquiera para revisarla o hacer un cambio.' : 'Todavía no has incluido secciones. Puedes agregar los detalles que quieras compartir.'}</p>
                <nav aria-label="Secciones elegidas para la invitación">{includedSections.map(section => <button key={section.id} type="button" title={section.title || extraDetailLabel(section)} aria-label={`Revisar sección: ${section.title || extraDetailLabel(section)}`} disabled={busy || uploads > 0} onClick={() => goTo(3, section.id)}>{section.title || extraDetailLabel(section)}</button>)}{!includedSections.length && <button type="button" disabled={busy || uploads > 0} onClick={() => goTo(3, '__more')}>Agregar detalles</button>}</nav>
              </section>
              <div className="guided-checklist"><h2>{issues.length ? "Antes de publicar" : "Todo listo para compartir"}</h2>{issues.length ? <><p>Puedes guardar el borrador ahora. Para publicar, completa lo siguiente:</p><ul>{issues.map(issue => <li key={issue.message}><button type="button" data-target-step={issue.step} data-target-section={issue.sectionId} onClick={() => goTo(issue.step, issue.sectionId)}>{issue.message}<FiArrowRight /></button></li>)}</ul></> : <p>Los datos principales están completos. Revisa la vista previa antes de continuar.</p>}</div>
              {!event.paidAt && <InvitationPrivacySettings eventId={event.id} initialPrivacy={event.privacy} initialVersion={event.privacyVersion} hasPin={event.privacy === "PRIVATE"} ensureEvent={() => ensureEvent()} />}
              {!creation && event.paidAt && <CustomInvitationLinkField eventId={event.id} value={values.customSlug} savedValue={event.customSlug} suggestion={content.slug} onChange={customSlug => patch({ customSlug })} />}
              {!event.paidAt && <p className="guided-payment"><FiLock />{invitationPriceLabel} MXN · IVA incluido · 12 meses activa. Podrás personalizar y compartir tu enlace cuando se confirme el pago.</p>}
              {!creation && <div className="guided-management"><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}/ajustes`}>Ajustes de la invitación</EditorProtectedLink>{published && <EditorProtectedLink guard={confirmNavigation} href={invitationPath(event)!} target="_blank">Abrir invitación</EditorProtectedLink>}</div>}
            </>}
          </fieldset>
          <div className="guided-bottom-bar">
            <button className="guided-back" type="button" aria-label="Paso anterior" disabled={step === 0 || busy || uploads > 0} onClick={previousJourney}><FiArrowLeft /><span className="guided-bottom-label">Anterior</span></button>
            {progress}
            {step < lastStep ? <button className="button" type="submit" aria-label="Continuar al siguiente paso" disabled={busy || uploads > 0}><span className="guided-bottom-label">{continueLabel}</span><FiArrowRight /></button> : <div className="guided-footer-actions">
              <button className={`button${!event.paidAt ? " guided-save-compact" : ""}`} type="button" aria-label={saveLabel} title={saveLabel} data-save-state={changesSaved ? "saved" : undefined} disabled={busy || uploads > 0 || changesSaved || (!creation && !dirty)} onClick={() => void save()}>{changesSaved ? <FiCheck aria-hidden="true" /> : <FiSave aria-hidden="true" />}<span className="guided-bottom-label" role="status">{saveLabel}</span></button>
              {!event.paidAt && <button className="button guided-publish" type="button" aria-label="Guardar y continuar al pago" title={issues.length ? "Completa los datos indicados antes de continuar al pago" : "Guardar y continuar al pago"} disabled={busy || uploads > 0 || issues.length > 0} onClick={() => void save(true)}><span className="guided-bottom-label">{saving ? "Guardando…" : "Continuar al pago"}</span><span className="guided-mobile-payment-label">{saving ? "Guardando…" : "Pagar"}</span><FiArrowRight aria-hidden="true" /></button>}
            </div>}
          </div>
        </form>
      </div>
      <aside className="guided-preview"><div className="guided-preview-heading"><span>ASÍ VA QUEDANDO</span><small>Selecciona un campo para verlo resaltado aquí</small></div><InvitationLivePreview focus={previewFocus} initialDevice="mobile" fitViewport onExpand={() => void openPrivatePreview()} expandLabel={saving ? "Preparando vista previa…" : "Abrir vista previa privada"} expandDisabled={busy || uploads > 0} publicLink={<InvitationPublicLink event={event} dirty={dirty} />}><CelebrationInvitation {...values} preview showPlaceholders date={date} eventDateKey={values.eventDate} /></InvitationLivePreview></aside>
    </div>
    <button className="guided-mobile-preview" type="button" disabled={busy || uploads > 0} onClick={() => void openPrivatePreview()} aria-label={saving ? "Preparando vista previa…" : "Abrir vista previa privada"} title="Abrir vista previa privada"><FiEye aria-hidden="true" /></button>
  </main>;
}

function extraDetailLabel(section: InviteSection) {
  return ({ gallery: 'Galería de fotos', dress_code: 'Código de vestimenta', gifts: 'Regalos', ceremony: 'Ceremonia o momento especial', reception: 'Celebración en otra sede', music: 'Playlist', custom: 'Información adicional', parents: 'Familia y personas especiales', program: 'Programa de actividades', story: 'Historia de la celebración', rsvp: 'Confirmación de asistencia' } as const)[section.type];
}

function Field({ label, id, help, wide, children }: { label: string; id: string; help?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`guided-field${wide ? " guided-wide" : ""}`} data-preview-field={id} data-preview-label={label}><label htmlFor={id}>{label}</label>{children}{help && <small>{help}</small>}</div>;
}
