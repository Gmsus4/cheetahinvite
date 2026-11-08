"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiImage, FiChevronDown, FiCheck, FiEye, FiList, FiLock, FiSave, FiSend, FiSliders, FiUsers, FiMapPin, FiPlus } from "react-icons/fi";
import { prepareEvent } from "@/app/crear/actions";
import { publishEvent, updateEvent } from "@/app/dashboard/eventos/[id]/actions";

import { initialGuidedValues, completeGuidedSections, changeGuidedEventType, guidedDetails, guidedPublicationIssues, guidedRecoveryStep, guidedRecoverySection, guidedRecoveryAppearanceStep, guidedContentSectionIds } from "@/lib/guided-invitation";
import { normalizeEventLocations } from "@/lib/invitation-locations";

import { InvitationStyleJourney } from "./InvitationStyleJourney";
import { invitationStyleSteps, invitationStyleStepIndex } from "@/lib/invitation-style-journey";
import { getInvitationEventContent, invitationEventTypes } from "@/lib/invitation-event-content";
import { sharedInvitationDesign } from "@/lib/shared-invitation";
import { EditorSaveFailure, editorFormData, type EventData, type EditorValues, type InviteSection } from "@/lib/invitation-editor";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { invitationPriceLabel, isInvitationPublished, hasPublicationGrant } from "@/lib/invitation-payment";
import { invitationPath } from "@/lib/invitation-url";
import { CloudinaryImageUpload } from "./CloudinaryImageUpload";
import { SectionFields } from "./InvitationSectionFields";
import { SectionQuickActions } from "./SectionQuickActions";
import { useEditorProtection } from "./useEditorProtection";
import { EditorProtectedLink } from "./EditorProtectedLink";
import { EditorLeaveDialog } from "./EditorLeaveDialog";
import { EditorRecoveryDialog } from "./EditorRecoveryDialog";


import { InvitationPrivacySettings } from "./InvitationPrivacySettings";
import { CustomInvitationLinkField } from "./CustomInvitationLinkField";
import styles from "./EventWorkspace.module.css";
import { DashboardHeader } from "./DashboardHeader";

const steps = ["¿Quién celebra?", "¿Cuándo y dónde?", "Portada y fondo", "Dale tu estilo", "Personaliza los bloques", "Revisa tu invitación"];
const stepLabels = ["Quién celebra", "Fecha y lugar", "Portada y fondo", "Dale tu estilo", "Bloques", "Revisión"];
const stepIcons = [FiUsers, FiMapPin, FiImage, FiSliders, FiList, FiSend];
const descriptions = ["Empecemos por las personas que hacen especial esta celebración.", "Comparte los datos que ya tengas. Puedes completar el resto después.", "Elige la imagen principal de tu invitación y una foto de fondo. Podrás agregar más fotografías en los bloques.", "Dale tu toque, un detalle a la vez. Puedes conservar las opciones seleccionadas.", "La apariencia ya está lista. Completa y personaliza cada bloque a tu ritmo.", "Así recibirán la invitación las personas que más quieres."];
const lastStep = steps.length - 1;
const introTitles = [<>¿Quién <em>celebra?</em></>, <>¿Cuándo <em>y dónde?</em></>, <>Portada <em>y fondo</em></>, <>Dale <em>tu estilo</em></>, <>Personaliza <em>los bloques</em></>, <>Revisa <em>tu invitación</em></>];

export function GuidedInvitationEditor({ event, creation = false, error, account, exampleId, priceLabel = invitationPriceLabel }: { event: EventData; creation?: boolean; exampleId?: string; priceLabel?: string; saved: boolean; published: boolean; error: string; account?: { name: string; email: string; image?: string | null } }) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialGuidedValues(event));
  const [step, setStep] = useState(0);
  const [activeSection, setActiveSection] = useState("__cover");
  const [addingDetail, setAddingDetail] = useState(false);
  const [appearanceStep, setAppearanceStep] = useState(0);
  const [mobileStepsExpanded, setMobileStepsExpanded] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scrollToTop = useRef(false);
  const draftPromise = useRef<Promise<string> | null>(null);
  const snapshot = JSON.stringify(values);
  const granted = hasPublicationGrant(event);
  const manualOnly = granted || !["DRAFT", "PENDING_PAYMENT"].includes(event.status);
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
      if (!granted || exampleId) formData.delete("customSlug");
      return updateEvent(await ensureEvent(submitted), formData, automatic ? "auto" : "manual");
    },
  });
  useEffect(() => { persistence.update(snapshot, uploads > 0, { step, activeExtra: step === 4 ? (addingDetail ? `__add:${activeSection}` : activeSection) : step === 3 ? `style:${invitationStyleSteps[appearanceStep].id}` : null, flow: "content-v5" }, manualOnly); }, [persistence, snapshot, uploads, step, activeSection, addingDetail, appearanceStep, manualOnly]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (scrollToTop.current) {
      scrollToTop.current = false;
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }, [step, activeSection, appearanceStep]);
  const busy = saving || !protection.ready || Boolean(protection.recovery);
  const dirty = snapshot !== protection.acknowledged || protection.code === "conflict";
  const design = sharedInvitationDesign;
  const content = getInvitationEventContent(values.eventType);
  const details = guidedDetails(values.eventType);
  const editableSections = [...values.sections.filter(section => section.type === "countdown"), ...values.sections.filter(section => section.type === "location"), ...details.flatMap(detail => values.sections.filter(section => section.type === detail.type))];
  const contentIds = guidedContentSectionIds(values.eventType, values.sections, activeSection);
  const availableSections = editableSections.filter(section => !section.enabled);
  const includedSections = [...values.sections.filter(section => section.type === "cover"), ...editableSections.filter(section => section.enabled)];
  const contentKey = contentIds.includes(activeSection) ? activeSection : contentIds[0];
  const contentIndex = contentIds.indexOf(contentKey);
  const currentSection = values.sections.find(section => section.id === contentKey);
  const primaryLocation = values.sections.find(section => section.type === "location");
  const continuingDetail = step === 4 && contentIndex < contentIds.length - 1;
  const continueLabel = step === 3 ? appearanceStep < invitationStyleSteps.length - 1 ? "Siguiente" : "Personalizar bloques" : "Continuar";
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
    if (sectionId && target === 4) { setActiveSection(sectionId); setAddingDetail(false); }
    if (target === 3 && sectionId) setAppearanceStep(invitationStyleStepIndex(sectionId));
    scrollToTop.current = true;
    setStep(target);
  }
  function goToAppearance(index: number) {
    if (uploads || busy || !validateCurrent()) return;
    scrollToTop.current = true;
    setAppearanceStep(index);
  }
  function continueJourney() {
    if (uploads || busy || !validateCurrent()) return;
    scrollToTop.current = true;
    if (step === 3 && appearanceStep < invitationStyleSteps.length - 1) setAppearanceStep(current => current + 1);
    else if (step === 4 && addingDetail) { setAddingDetail(false); setActiveSection("__more"); }
    else if (continuingDetail) setActiveSection(contentIds[contentIndex + 1]);
    else goTo(step + 1);
  }
  function previousJourney() {
    if (uploads || busy) return;
    scrollToTop.current = true;
    if (step === 3 && appearanceStep > 0) setAppearanceStep(current => current - 1);
    else if (step === 4 && addingDetail) { setAddingDetail(false); setActiveSection("__more"); }
    else if (step === 4 && contentIndex > 0) setActiveSection(contentIds[contentIndex - 1]);
    else if (step === 4) { setAppearanceStep(invitationStyleSteps.length - 1); goTo(3); }
    else goTo(step - 1);
  }
  function recover() {
    const record = persistence.recover();
    if (!record) return;
    const recovered = JSON.parse(record.snapshot) as EditorValues;
    const locations = normalizeEventLocations(recovered.venue, recovered.address, recovered.sections);
    const restored = { ...recovered, ...locations, texture: "none", sections: completeGuidedSections(recovered.eventType, locations.sections) };
    setValues({ ...restored, texture: "none" });
    setStep(guidedRecoveryStep(record.wizard));
    setActiveSection(guidedRecoverySection(record.wizard, restored.sections));
    setAddingDetail((record.wizard.flow === "content-v4" || record.wizard.flow === "content-v5") && Boolean(record.wizard.activeExtra?.startsWith("__add:")));
    setAppearanceStep(guidedRecoveryAppearanceStep(record.wizard));
    if (creation && record.eventId) router.replace(`/crear?resume=${record.eventId}`);
  }
  async function save(forPublication = false, overwrite = false) {
    if (busy || uploads) return;
    if (forPublication && issues.length) { setStep(lastStep); setNotice(event.complimentaryAt ? "Completa los datos pendientes antes de publicar tu cortesía." : "Completa los datos pendientes antes de continuar al pago."); return; }
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
      const href = exampleId ? `/admin/disenos/${exampleId}/vista-previa` : `/dashboard/eventos/${result.eventId}/show`;
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

  const journeyNavigation = <div className={`guided-bottom-bar ${styles.journeyNavigation}`}>
            <button className="guided-back" type="button" aria-label="Paso anterior" disabled={step === 0 || busy || uploads > 0} onClick={previousJourney}><FiArrowLeft /><span className="guided-bottom-label">Anterior</span></button>
            {progress}
            {step < lastStep ? <button className="button" type="submit" form="guided-invitation-form" aria-label={step === 3 ? appearanceStep < invitationStyleSteps.length - 1 ? `Continuar a ${invitationStyleSteps[appearanceStep + 1].label}` : "Continuar a Personaliza los bloques" : "Continuar al siguiente paso"} disabled={busy || uploads > 0}><span className="guided-bottom-label">{continueLabel}</span><FiArrowRight /></button> : <div className="guided-footer-actions">
              <button className={`button${!exampleId && !event.paidAt && !published ? " guided-save-compact" : ""}`} type="button" aria-label={saveLabel} title={saveLabel} data-save-state={changesSaved ? "saved" : undefined} disabled={busy || uploads > 0 || changesSaved || (!creation && !dirty)} onClick={() => void save()}>{changesSaved ? <FiCheck aria-hidden="true" /> : <FiSave aria-hidden="true" />}<span className="guided-bottom-label" role="status">{saveLabel}</span></button>
              {!exampleId && !event.paidAt && !published && <button className="button guided-publish" type="button" aria-label={event.complimentaryAt ? "Publicar con mi cortesía" : "Guardar y continuar al pago"} title={issues.length ? "Completa los datos indicados antes de publicar" : undefined} disabled={busy || uploads > 0 || issues.length > 0} onClick={() => void save(true)}><span className="guided-bottom-label">{saving ? "Guardando…" : event.complimentaryAt ? "Publicar cortesía" : "Continuar al pago"}</span><span className="guided-mobile-payment-label">{event.complimentaryAt ? "Publicar" : "Pagar"}</span><FiArrowRight aria-hidden="true" /></button>}
            </div>}
            {exampleId && <div className={styles.exampleReturn}>
              <EditorProtectedLink className={styles.exampleReturnLink} guard={confirmNavigation} href={`/admin/disenos/${exampleId}`}>
                <FiArrowLeft aria-hidden="true" />Volver a gestionar este ejemplo
              </EditorProtectedLink>
              <p className={styles.exampleReturnNote}>Publica los cambios desde Administración.</p>
            </div>}
          </div>;

  return <main className={`guided-editor ${styles.workspace}`} data-intro-layout="true" data-example-editor={exampleId ? "true" : undefined} data-short-step={step === 0 || step === 1 || step === 2 || step === 3}>
    {protection.recovery && <EditorRecoveryDialog onRecover={recover} onDiscard={() => persistence.discardRecovery()} />}
    {navigation.destination && <EditorLeaveDialog onStay={navigation.stay} onLeave={navigation.leave} />}
    <DashboardHeader name={account?.name || "Usuario"} email={account?.email || ""} image={account?.image} guard={confirmNavigation} />
    <div className="guided-layout">
      <div className="guided-workspace">
        <div className="guided-heading"><span className="guided-eyebrow">{creation ? "CREA ALGO ESPECIAL" : "TU INVITACIÓN"} · PASO {step + 1} DE {steps.length}</span><h1 ref={heading} tabIndex={-1}>{introTitles[step]}</h1><p>{descriptions[step]}</p>{journeyNavigation}{step === 0 && <div className={styles.introNote}><span><FiCheck aria-hidden="true" /></span><p>Puedes empezar ahora y completar los detalles después.</p></div>}</div>
        <div className={styles.formArea}>
        {protection.localWarning && <p className="guided-alert" role="status">El navegador no permite guardar una copia local. Guarda tu borrador antes de salir.</p>}
        {(protection.error || error) && <div className="guided-alert" role="alert"><p>{protection.error || (error === "pendientes" ? "Completa los datos principales y los detalles activos antes de continuar al pago." : "Revisa tus datos e intenta guardar de nuevo.")}</p><div>{protection.conflictVersion !== undefined && <><button type="button" disabled={busy || uploads > 0} onClick={() => void save(false, true)}>Guardar mi versión</button><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${persistence.getEventId()}/show`} target="_blank">Revisar versión guardada</EditorProtectedLink></>}{protection.code === "unavailable" && <button type="button" disabled={busy || uploads > 0} onClick={() => void save()}>Reintentar guardado</button>}{protection.code === "auth" && <EditorProtectedLink guard={confirmNavigation} href={`/login?callbackUrl=${encodeURIComponent(creation ? "/crear" : `/dashboard/eventos/${event.id}`)}`}>Iniciar sesión</EditorProtectedLink>}</div></div>}
        {notice && <p className="guided-notice" role="status">{notice}</p>}
        <form id="guided-invitation-form" ref={form} onSubmit={submit} noValidate className="guided-form" aria-busy={saving}>
          <fieldset disabled={busy} className="guided-fields">
            {step === 0 && <div className="guided-data-grid">
              <Field label="Tipo de evento" id="event-type" wide><select id="event-type" value={values.eventType} onChange={e => { patch(changeGuidedEventType(values, e.target.value)); setActiveSection('__cover'); setAddingDetail(false); }}>{invitationEventTypes.map(type => <option key={type} value={type}>{getInvitationEventContent(type).label}</option>)}</select></Field>
              <Field label={values.eventType === 'wedding' || values.eventType === 'anniversary' ? '¿Cómo se llaman?' : '¿Quién celebra?'} id="w-hosts" wide help="Escribe los nombres tal como quieres que aparezcan."><input id="w-hosts" value={values.hostNames} maxLength={120} placeholder="Nombre de quien celebra o de los anfitriones" onChange={e => patch({ hostNames: e.target.value })} /></Field>
              <Field label="Nombre de la invitación" id="w-name" wide><input id="w-name" value={values.name} required minLength={2} maxLength={100} onChange={e => patch({ name: e.target.value })} /></Field>
              <p className="guided-help guided-wide">Empecemos por los protagonistas. Los demás detalles vienen después.</p>
            </div>}
            {step === 1 && <div className="guided-data-grid">
              <Field label="Fecha" id="w-date"><input id="w-date" type="date" value={values.eventDate} onChange={e => patch({ eventDate: e.target.value, ...(!e.target.value ? { eventTime: '' } : {}) })} /></Field>
              <Field label="Hora" id="w-time" help={!values.eventDate ? 'Primero elige una fecha.' : undefined}><input id="w-time" type="time" disabled={!values.eventDate} value={values.eventTime} onChange={e => patch({ eventTime: e.target.value })} /></Field>
              <Field label="Lugar del evento" id="w-venue" wide help="Donde será la fiesta o reunión principal. La iglesia o el acto formal se configuran en Ceremonia."><input id="w-venue" value={values.venue} maxLength={160} placeholder="Nombre del salón, jardín o lugar" onChange={e => patch({ venue: e.target.value })} /></Field>
              <Field label="Dirección" id="w-address" wide help="Texto que aparecerá en la invitación: calle, número y ciudad."><input id="w-address" value={values.address} maxLength={240} placeholder="Calle, número, colonia y ciudad" onChange={e => patch({ address: e.target.value })} /></Field>
              {primaryLocation && <Field label="Enlace de Google Maps (opcional)" id="w-map" wide help="Pega el enlace de la ubicación exacta. Si lo dejas vacío, buscaremos la dirección escrita."><input id="w-map" type="url" value={primaryLocation.link} maxLength={500} placeholder="https://maps.app.goo.gl/…" onChange={e => changeSection(primaryLocation.id, { link: e.target.value })} /></Field>}
              <p className="guided-help guided-wide">Si todavía no tienes todos los datos, continúa y complétalos antes de publicar.</p>
            </div>}
            {step === 2 && <>
              <div className="guided-photo-grid">
                <section className="guided-photo-field" data-preview-field="cover-photo" data-preview-label="Foto de portada" aria-labelledby="cover-upload-title" aria-describedby="guided-photo-formats"><h2 id="cover-upload-title">Foto de portada <span>Opcional</span></h2><p>La imagen principal de tu invitación.</p><CloudinaryImageUpload {...uploadProps} images={values.imageUrl ? [values.imageUrl] : []} multiple={false} onChange={images => patch({ imageUrl: images[0] ?? '' })} /></section>
                <section className="guided-photo-field" data-preview-field="cover" data-preview-label="Foto de fondo" aria-labelledby="background-upload-title" aria-describedby="guided-photo-formats"><h2 id="background-upload-title">Foto de fondo <span>Opcional</span></h2><p>Detrás de las secciones. También inspira tu paleta.</p><CloudinaryImageUpload {...uploadProps} images={values.backgroundImageUrl ? [values.backgroundImageUrl] : []} multiple={false} onChange={images => patch({ backgroundImageUrl: images[0] ?? '' })} /></section>
              </div>
              <p className="guided-help" id="guided-photo-formats">JPG, PNG, WebP o AVIF · máximo {ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB por imagen. Puedes continuar sin subir fotos.</p>
            </>}
            {step === 4 && <>
              <section className={`guided-included-summary ${styles.blockSelector}`} aria-labelledby="included-sections-title">
                <div className="guided-included-heading"><h2 id="included-sections-title">Bloques de tu invitación</h2><span role="status">{includedSections.length} {includedSections.length === 1 ? 'bloque incluido' : 'bloques incluidos'}</span></div>
                {includedSections.length ? <><p>Revisa los bloques en el orden en que aparecerán.</p><nav aria-label="Secciones incluidas en tu invitación">{includedSections.map(section => <button key={section.id} type="button" title={section.title || extraDetailLabel(section)} aria-label={`Editar sección: ${section.title || extraDetailLabel(section)}`} aria-current={contentKey === section.id ? 'step' : undefined} disabled={busy || uploads > 0} onClick={() => goTo(4, section.id)}>{section.title || extraDetailLabel(section)}</button>)}</nav></> : <p>Aún no hay secciones incluidas. Puedes activarlas durante el recorrido o agregar un detalle al final.</p>}
              </section>
              {contentKey === '__more' ? <section className="guided-more-details" aria-labelledby="more-details-title">
                <h2 id="more-details-title">¿Quieres agregar algo más?</h2>
                <p>Estos detalles son opcionales. Elige uno para completarlo o continúa a la revisión de tu invitación.</p>
                {availableSections.length ? <div className="guided-more-options">{availableSections.map(section => <button type="button" key={section.id} onClick={() => { changeSection(section.id, { enabled: true }); setAddingDetail(true); setActiveSection(section.id); }}><span>{extraDetailLabel(section)}</span><FiPlus aria-hidden="true" /></button>)}</div> : <p>Ya incluiste todos los detalles disponibles.</p>}
              </section> : <>
                <div className="guided-content-position"><span>{addingDetail ? 'Detalle adicional' : `Bloque ${contentIndex + 1} de ${contentIds.length - 1}`}</span><span>{contentIndex === 0 ? 'La portada de tu invitación' : 'Un detalle a la vez'}</span></div>
                <div className="guided-single-detail" key={contentKey} data-preview-label={currentSection?.title}>
                  {currentSection?.type === "cover" ? <>
                    <h2>Portada</h2>
                    <p>Ya contiene los datos de los pasos anteriores: nombres, nombre de la invitación, fecha, hora, y foto de portada. La cuenta regresiva se personaliza en el siguiente bloque.</p>
                    <p><strong>{values.name}</strong><br />{values.hostNames}<br />{date}{values.eventTime && ` · ${values.eventTime}`}</p>
                    <div className={styles.blockLinks}><button type="button" onClick={() => goTo(0)}>Editar nombres</button><button type="button" onClick={() => goTo(1)}>Editar fecha y hora</button></div>
                    <SectionQuickActions section={currentSection} onChange={changes => changeSection(currentSection.id, changes)} globalPanelStyle={values.panelStyle} globalShowIcons={values.showSectionIcons} uploadProps={uploadProps} disabled={busy || uploads > 0} photoFields={<><h3>Foto de portada</h3><CloudinaryImageUpload {...uploadProps} images={values.imageUrl ? [values.imageUrl] : []} multiple={false} onChange={images => patch({ imageUrl: images[0] ?? '' })} /></>} />
                  </> : currentSection && <>
                    <div className={styles.blockHeader}><h2>{currentSection.title}</h2>
                    <label className="guided-toggle" htmlFor={`include-${currentSection.id}`}>
                      <span><strong>{currentSection.enabled ? 'Incluida' : 'Desactivada'}</strong></span>
                      <input id={`include-${currentSection.id}`} type="checkbox" role="switch" aria-label={`Incluir ${currentSection.title} en mi invitación`} checked={currentSection.enabled} onChange={e => changeSection(currentSection.id, { enabled: e.target.checked })} /><span className="guided-switch" aria-hidden="true" />
                    </label></div>
                    {currentSection.enabled ? <><SectionFields globalShowIcons={values.showSectionIcons} globalPanelStyle={values.panelStyle ?? "auto"} section={currentSection} onChange={changes => changeSection(currentSection.id, changes)} uploadProps={uploadProps} showStyleControls={false} locationFields={<>
                      <Field label="Lugar del evento" id="w-venue" wide><input id="w-venue" value={values.venue} maxLength={160} onChange={e => patch({ venue: e.target.value })} /></Field>
                      <Field label="Dirección" id="w-address" wide><input id="w-address" value={values.address} maxLength={240} onChange={e => patch({ address: e.target.value })} /></Field>
                      <Field label="Enlace de Google Maps (opcional)" id="w-map" wide help="Se usará este enlace para «Cómo llegar». Si lo dejas vacío, buscaremos la dirección escrita."><input id="w-map" type="url" value={currentSection.link} maxLength={500} placeholder="https://maps.app.goo.gl/…" onChange={e => changeSection(currentSection.id, { link: e.target.value })} /></Field>
                    </>} /><SectionQuickActions section={currentSection} onChange={changes => changeSection(currentSection.id, changes)} globalPanelStyle={values.panelStyle} globalShowIcons={values.showSectionIcons} uploadProps={uploadProps} disabled={busy || uploads > 0} /></> : <p className="guided-excluded-note">Puedes continuar o volver a activarlo cuando quieras.</p>}
                  </>}
                </div>
              </>}
            </>}
            {step === 3 && <InvitationStyleJourney values={values} step={appearanceStep} onStepChange={goToAppearance} onChange={patch} />}
            {step === lastStep && <>
              <div className={styles.reviewTools}>
              <button className={styles.reviewPreview} type="button" disabled={busy || uploads > 0} onClick={() => void openPrivatePreview()}><FiEye aria-hidden="true" />{saving ? "Preparando vista previa…" : "Abrir vista previa"}</button>
              <div className="guided-review-design"><FiCheck aria-hidden="true" /><div><strong>Apariencia</strong><span>{(design.palettes.find(p => p.accent.toLowerCase() === values.accent.toLowerCase())?.label || "Color personalizado")}</span></div><button type="button" aria-label="Ajustar apariencia" onClick={() => goTo(3, "style:colors")}>Ajustar</button></div>
              </div>
              <dl className="guided-review">{[["Protagonistas", values.hostNames || "Por definir"], ["Fecha y hora", `${date}${values.eventTime ? ` · ${values.eventTime}` : ""}`], ["Lugar", values.venue || "Por definir"], ["Dirección", values.address || "Por definir"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}<button type="button" onClick={() => goTo(label === "Protagonistas" ? 0 : 1)} aria-label={`Editar ${label.toLowerCase()}`}>Editar</button></dd></div>)}</dl>
              <section className="guided-included-summary" aria-labelledby="review-sections-title">
                <div className="guided-included-heading"><h2 id="review-sections-title">Secciones de tu invitación</h2><span role="status">{includedSections.length} {includedSections.length === 1 ? 'sección incluida' : 'secciones incluidas'}</span></div>
                <p>{includedSections.length ? 'Estas son las secciones que elegiste. Puedes abrir cualquiera para revisarla o hacer un cambio.' : 'Todavía no has incluido secciones. Puedes agregar los detalles que quieras compartir.'}</p>
                <nav aria-label="Secciones elegidas para la invitación">{includedSections.map(section => <button key={section.id} type="button" title={section.title || extraDetailLabel(section)} aria-label={`Revisar sección: ${section.title || extraDetailLabel(section)}`} disabled={busy || uploads > 0} onClick={() => goTo(4, section.id)}>{section.title || extraDetailLabel(section)}</button>)}{!includedSections.length && <button type="button" disabled={busy || uploads > 0} onClick={() => goTo(4, '__more')}>Agregar detalles</button>}</nav>
              </section>
              <div className="guided-checklist"><h2>{issues.length ? "Antes de publicar" : "Todo listo para compartir"}</h2>{issues.length ? <><p>Puedes guardar el borrador ahora. Para publicar, completa lo siguiente:</p><ul>{issues.map(issue => <li key={issue.message}><button type="button" data-target-step={issue.step} data-target-section={issue.sectionId} onClick={() => goTo(issue.step, issue.sectionId)}>{issue.message}<FiArrowRight /></button></li>)}</ul></> : <p>Los datos principales están completos. Revisa la vista previa antes de continuar.</p>}</div>
              {!exampleId && !event.paidAt && <InvitationPrivacySettings eventId={event.id} initialPrivacy={event.privacy} initialVersion={event.privacyVersion} hasPin={event.privacy === "PRIVATE"} ensureEvent={() => ensureEvent()} />}
              {!exampleId && !creation && granted && <CustomInvitationLinkField eventId={event.id} value={values.customSlug} savedValue={event.customSlug} suggestion={content.slug} onChange={customSlug => patch({ customSlug })} />}
              {!exampleId && !granted && <p className="guided-payment"><FiLock />{priceLabel} MXN · IVA incluido · 12 meses activa. Podrás personalizar y compartir tu enlace cuando se confirme el pago.</p>}
              {!exampleId && event.complimentaryAt && <p className="guided-payment">Tienes una cortesía de publicación. Completa los datos y publica sin realizar un pago.</p>}
              {!exampleId && !creation && <div className="guided-management"><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}/ajustes`}>Ajustes de la invitación</EditorProtectedLink>{published && <EditorProtectedLink guard={confirmNavigation} href={invitationPath(event)!} target="_blank">Abrir invitación</EditorProtectedLink>}</div>}
            </>}
          </fieldset>
        </form>
        </div>
      </div>
    </div>
    {step >= 4 && <button className="guided-mobile-preview" type="button" disabled={busy || uploads > 0} onClick={() => void openPrivatePreview()} aria-label={saving ? "Preparando vista previa…" : "Abrir vista previa privada"} title="Abrir vista previa privada"><FiEye aria-hidden="true" /></button>}
  </main>;
}

function extraDetailLabel(section: InviteSection) {
  return ({ countdown: 'Cuenta regresiva', cover: 'Portada', location: 'Lugar principal de la celebración', gallery: 'Galería de fotos', dress_code: 'Código de vestimenta', gifts: 'Regalos', ceremony: 'Ceremonia', reception: 'Celebración en otra sede', music: 'Playlist', custom: 'Información adicional', parents: 'Familia y personas especiales', program: 'Programa de actividades', story: 'Historia de la celebración', rsvp: 'Confirmación de asistencia' } as const)[section.type];
}

function Field({ label, id, help, wide, children }: { label: string; id: string; help?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`guided-field${wide ? " guided-wide" : ""}`} data-preview-field={id} data-preview-label={label}><label htmlFor={id}>{label}</label>{children}{help && <small>{help}</small>}</div>;
}
