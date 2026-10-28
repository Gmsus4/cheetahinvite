"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { prepareEvent } from "@/app/crear/actions";
import { WeddingInvitation } from "@/components/invitation/WeddingInvitation";
import { getWeddingDesign } from "@/lib/wedding-designs";
import { InvitationTexturePicker } from "./InvitationTexturePicker";
import { InvitationTemplatePicker } from "./InvitationTemplatePicker";
import { InvitationDecoration } from "./InvitationDecoration";
import { getInvitationTemplate, templateAccent, sectionDecoration, type InvitationTemplate } from "@/lib/invitation-templates";
import { CustomInvitationLinkField } from "./CustomInvitationLinkField";
import { invitationPath, normalizeInvitationSlug } from "@/lib/invitation-url";
import { InvitationLivePreview } from "./InvitationLivePreview";
import { RsvpForm } from "@/components/invitation/RsvpForm";
import { useInvitationMotion } from "./useInvitationMotion";
import { useEditorProtection } from "./useEditorProtection";
import { EditorSaveFailure, editorFormData, type EditorValues, type InviteSection, type SectionType } from "@/lib/invitation-editor";
export type { InviteSection, SectionType } from "@/lib/invitation-editor";
import { EditorProtectedLink } from "./EditorProtectedLink";
import { EditorLeaveDialog } from "./EditorLeaveDialog";
import { EditorRecoveryDialog } from "./EditorRecoveryDialog";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { FiArrowDown, FiArrowLeft, FiArrowUp, FiCalendar, FiCheck, FiChevronLeft, FiChevronRight, FiClock, FiEye, FiGift, FiHeart, FiImage, FiLock, FiMapPin, FiMaximize2, FiMusic, FiPlus, FiSave, FiTag, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { publishEvent, updateEvent } from "@/app/dashboard/eventos/[id]/actions";
import { BrandEmblem } from "@/components/BrandEmblem";
import { invitationPriceLabel, isInvitationPublished } from "@/lib/invitation-payment";
import { invitationSectionUrl, invitationLinkLabel, invitationMapUrl } from "@/lib/invitation-links";
import { defaultButtonAppearance, eventButtonAppearance, type InvitationButtonAppearance } from "@/lib/invitation-buttons";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { getInvitationFont, invitationFonts, recommendedInvitationFonts, type FontRole } from "@/lib/invitation-fonts";
import { getInvitationEventContent, eventExampleSections as exampleSections, makeEventExampleSection as makeExampleSection } from "@/lib/invitation-event-content";

export type EventData = {
  id: string; ownerId: string; contentVersion: number; customSlug: string | null; templateId: string; texture: string; name: string; eventType: string; eventDate: Date | null; eventTime: string | null; hostNames: string | null; paidAt: Date | null; expiresAt: Date | null; status: "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED" | "SUSPENDED" | "REFUNDED"; slug: string | null;
  venue: string | null; address: string | null; message: string | null; imageUrl: string | null; imageUploads: number; accent: string; typography: string; bodyTypography: string; heroHorizontal?: string; heroVertical?: string; buttonShape?: string; buttonFilled?: boolean; buttonIcons?: boolean; buttonBorder?: boolean; buttonBold?: boolean; sections: unknown;
};


const sectionOptions: { type: SectionType; title: string; description: string }[] = [
  { type: "story", title: "Nuestra historia", description: "Cuenta algo especial sobre el evento." },
  { type: "ceremony", title: "Ceremonia", description: "Lugar, horario y ubicación." },
  { type: "reception", title: "Recepción", description: "Detalles de la celebración." },
  { type: "program", title: "Programa", description: "Horarios y actividades del evento." },
  { type: "parents", title: "Padres", description: "Nombres de quienes acompañan y celebran." },
  { type: "dress_code", title: "Código de vestimenta", description: "Vestimenta y recomendaciones." },
  { type: "gifts", title: "Regalos", description: "Mesa de regalos o notas para tus invitados." },
  { type: "rsvp", title: "Confirmación", description: "Indica cómo confirmar asistencia." },
  { type: "gallery", title: "Galería", description: "Muestra fotos de tu celebración en un carrusel." },
  { type: "music", title: "Música", description: "Comparte una canción o playlist." },
  { type: "custom", title: "Sección personalizada", description: "Crea un bloque con tu propio contenido." },
];

function makeSection(type: SectionType, id = `default-${type}`): InviteSection {
  const option = sectionOptions.find((item) => item.type === type)!;
  return { id, type, title: option.title, content: "", detail: "", link: "", imageUrl: "", imageUrls: [], enabled: true, ...(type === "rsvp" ? { rsvpMode: "integrated" as const } : {}) };
}

const dateInputValue = (date: Date | null) => date ? new Date(date).toISOString().slice(0, 10) : "";

const creationQuestions = [
  ["¿Cómo se llama tu evento?", "Empecemos por el nombre de este día especial."],
  ["¿Qué vamos a celebrar?", "Elige el tipo de evento para encontrar diseños para ti."],
  ["¿A quién celebramos?", "Puedes agregar los nombres de los protagonistas."],
  ["¿Qué día será?", "Si todavía no tienes fecha, puedes agregarla después."],
  ["¿A qué hora nos vemos?", "La hora ayuda a tus invitados a prepararse."],
  ["¿Dónde será la celebración?", "Escribe el nombre del salón, jardín o lugar."],
  ["¿Cuál es la dirección?", "Ayuda a tus invitados a llegar."],
  ["¿Qué les quieres decir a tus invitados?", "Unas palabras tuyas harán la invitación más especial."],
  ["Dale una portada a tu historia", "Elige una foto que te encante. También puedes hacerlo después."],
  ["Encuentra tu plantilla", "Elige el diseño que mejor acompañe tu celebración."],
  ["Un toque de textura", "Elige un fondo o conserva el diseño sin textura."],
  ["¿Cuál será tu color?", "Ya elegimos uno para ti. Puedes cambiarlo si quieres."],
  ["Dale personalidad a los títulos", "Puedes conservar la tipografía actual o probar otra."],
  ["Ahora, la letra de los textos", "Elige una tipografía que sea cómoda de leer."],
  ["¿Quieres agregar algo más?", "Horarios, confirmación, regalos y más. Agrega un detalle a la vez o continúa."],
  ["Tu invitación está lista para guardar", "Revisa lo que preparaste. Después podrás editar cualquier detalle."],
];

export function EventEditor({ event, saved, error, published, creation = false }: { event: EventData; saved: boolean; error: string; published: boolean; creation?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showCreationPreview, setShowCreationPreview] = useState(false);
  const [activeExtra, setActiveExtra] = useState<string | null>(creation ? "default-story" : null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (creation) {
      questionRef.current?.focus({ preventScroll: true });
      contentRef.current?.scrollTo({ top: 0 });
    }
  }, [step, activeExtra, creation]);
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const draftPromise = useRef<Promise<string> | null>(null);
  const [uploadCount, setUploadCount] = useState(0);
  async function ensureEvent(currentSnapshot = snapshot) {
    if (persistence.getEventId()) return persistence.getEventId();
    if (!draftPromise.current) {
      draftPromise.current = prepareEvent(editorFormData(currentSnapshot, persistence.getVersion(), persistence.getCreationKey())).then((result) => {
        if (!result.ok) throw new EditorSaveFailure(result);
        persistence.setEventId(result.eventId);
        if (creation) router.replace(`/crear?resume=${result.eventId}`);
        return result.eventId;
      }).catch((failure) => { draftPromise.current = null; throw failure; });
    }
    return draftPromise.current;
  }
  function nextStep(target: number) {
    const fields = formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
    for (const field of fields ?? []) {
      if (field.closest("[hidden]")) continue;
      if (!field.reportValidity()) return false;
    }
    setStep(target);
    return true;
  }
  const [name, setName] = useState(event.name);
  const [customSlug, setCustomSlug] = useState(event.customSlug ?? "");
  const [eventType, setEventType] = useState(event.eventType);
  const [templateId, setTemplateId] = useState(event.templateId ?? "none");
  const [texture, setTexture] = useState(event.texture ?? "none");
  const [eventDate, setEventDate] = useState(dateInputValue(event.eventDate));
  const [eventTime, setEventTime] = useState(event.eventTime ?? "");
  const [hostNames, setHostNames] = useState(event.hostNames ?? "");
  const [venue, setVenue] = useState(event.venue ?? "");
  const [address, setAddress] = useState(event.address ?? "");
  const [message, setMessage] = useState(event.message ?? (creation ? getInvitationEventContent(event.eventType).message : ""));
  const [imageUrl, setImageUrl] = useState(event.imageUrl ?? "");
  const [accent, setAccent] = useState(event.accent || "#E9560A");
  const [buttonAppearance, setButtonAppearance] = useState(() => eventButtonAppearance(event));
  const [heroHorizontal, setHeroHorizontal] = useState(event.heroHorizontal || "left");
  const [heroVertical, setHeroVertical] = useState(event.heroVertical || "center");
  const [typography, setTypography] = useState(event.typography || "default");
  const [bodyTypography, setBodyTypography] = useState(event.bodyTypography || "inter");
  const [sections, setSections] = useState<InviteSection[]>(() => {
    if (creation && (!Array.isArray(event.sections) || event.sections.length === 0)) return exampleSections(event.eventType);
    if (Array.isArray(event.sections)) return event.sections as InviteSection[];
    return ["story", "ceremony", "reception", "dress_code", "gifts", "rsvp"].map((type) => makeSection(type as SectionType));
  });
  const extraIndex = Math.max(0, sections.findIndex((section) => section.id === activeExtra));
  const currentExtra = sections[extraIndex];
  function advanceCreation(omit = false) {
    if (step !== 14 || !currentExtra) {
      nextStep(step === 3 && !eventDate ? 5 : step + 1);
      return;
    }
    if (!omit && !nextStep(14)) return;
    setSections((current) => current.map((section) => section.id === currentExtra.id ? { ...section, enabled: !omit } : section));
    if (extraIndex < sections.length - 1) setActiveExtra(sections[extraIndex + 1].id);
    else setStep(15);
  }
  function previousCreation() {
    if (step === 14 && extraIndex > 0) setActiveExtra(sections[extraIndex - 1].id);
    else {
      if (step === 15 && sections.length) setActiveExtra(sections[sections.length - 1].id);
      setStep(step - 1);
    }
  }
  const isPublished = isInvitationPublished(event);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const closePreview = useCallback(() => setPreviewExpanded(false), [setPreviewExpanded]);
  useEffect(() => {
    if (!creation || !showCreationPreview) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const adaptPreview = () => {
      if (!desktop.matches) {
        setShowCreationPreview(false);
        setPreviewExpanded(true);
      }
    };
    desktop.addEventListener("change", adaptPreview);
    return () => desktop.removeEventListener("change", adaptPreview);
  }, [creation, showCreationPreview]);
  const snapshot = JSON.stringify({ name, eventType, eventDate, eventTime, hostNames, venue, address, message, imageUrl, accent, typography, bodyTypography, sections, customSlug, templateId, texture, heroHorizontal, heroVertical, buttonAppearance } satisfies EditorValues);
  const { controller: persistence, state: protection, confirmNavigation, navigation } = useEditorProtection({
    ownerId: event.ownerId, eventId: event.id, snapshot, version: event.contentVersion, creation,
    manualOnly: Boolean(event.paidAt) || !["DRAFT", "PENDING_PAYMENT"].includes(event.status),
    save: async (submitted, version, automatic) => {
      const id = await ensureEvent(submitted);
      return updateEvent(id, editorFormData(submitted, version), automatic ? "auto" : "manual");
    },
  });
  useEffect(() => {
    persistence.update(snapshot, uploadCount > 0, { step, activeExtra }, Boolean(event.paidAt) || !["DRAFT", "PENDING_PAYMENT"].includes(event.status));
  }, [persistence, snapshot, uploadCount, step, activeExtra, event.paidAt, event.status]);

  function recoverDraft() {
    const record = persistence.recover();
    if (!record) return;
    const values = JSON.parse(record.snapshot) as EditorValues;
    setName(values.name); setCustomSlug(values.customSlug); setEventType(values.eventType);
    setTemplateId(values.templateId); setTexture(values.texture); setEventDate(values.eventDate); setEventTime(values.eventTime);
    setHostNames(values.hostNames); setVenue(values.venue); setAddress(values.address); setMessage(values.message);
    setImageUrl(values.imageUrl); setAccent(values.accent); setTypography(values.typography); setBodyTypography(values.bodyTypography);
    setSections(values.sections); setHeroHorizontal(values.heroHorizontal); setHeroVertical(values.heroVertical); setButtonAppearance(values.buttonAppearance);
    if (creation) { setStep(record.wizard.step); setActiveExtra(record.wizard.activeExtra); }
    if (creation && record.eventId) router.replace(`/crear?resume=${record.eventId}`);
  }
  const [, formAction, pending] = useActionState(async (count: number, formData: FormData) => {
    const result = await persistence.saveNow(false, formData.get("resolveConflict") === "overwrite" ? protection.conflictVersion : undefined);
    if (result.ok && creation) router.replace(`/dashboard/eventos/${result.eventId}/show`);
    return count + 1;
  }, 0);
  const [, publishAction, publishing] = useActionState(async (count: number) => {
    const result = await persistence.saveNow();
    if (result.ok) {
      try {
        const next = await publishEvent(result.eventId, result.version);
        if (next.ok) router.push(`/dashboard/eventos/${result.eventId}/pago`);
        else persistence.acceptFailure(next);
      } catch { persistence.reportError("No pudimos abrir el pago. Tu invitación ya está guardada; intenta de nuevo."); }
    }
    return count + 1;
  }, 0);
  const dirty = snapshot !== protection.acknowledged || protection.code === "conflict";
  const busy = pending || publishing || !protection.ready || Boolean(protection.recovery);
  const saveStatus = uploadCount ? "Subiendo fotos…" : protection.saving ? "Guardando en el servidor…" : dirty
    ? protection.local ? "Copia local guardada · cambios pendientes" : "Cambios pendientes de guardar"
    : protection.lastSaved ? "Cambios guardados" : "Todo está al día";
  const prettyDate = eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${eventDate}T12:00:00Z`)) : "La fecha";
  const updateSection = (id: string, changes: Partial<InviteSection>) => setSections((current) => current.map((section) => section.id === id ? { ...section, ...changes } : section));
  const moveSection = (index: number, direction: -1 | 1) => setSections((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const copy = [...current];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  });

  return <main className={`editor-page${creation ? " creation-onboarding" : ""}`}>
    {protection.recovery && <EditorRecoveryDialog onRecover={recoverDraft} onDiscard={() => persistence.discardRecovery()} />}
    {navigation.destination && <EditorLeaveDialog onStay={navigation.stay} onLeave={navigation.leave} />}
    <header className="editor-header">
      <EditorProtectedLink guard={confirmNavigation} className="brand editor-brand" href="/dashboard"><BrandEmblem size={36} /><span className="brand-name">Cheetah<span>Invite</span></span></EditorProtectedLink>
      <EditorProtectedLink guard={confirmNavigation} className="editor-back" href="/dashboard"><FiArrowLeft /> Volver a mis eventos</EditorProtectedLink>
    </header>
    <div className={`editor-layout${creation && showCreationPreview ? " has-creation-preview" : ""}`}>
      <section className="editor-form-panel">
        <div className="editor-heading"><p className="dashboard-eyebrow">TU INVITACIÓN</p><h1>{creation ? "Crea tu invitación paso a paso" : "Completa los detalles"}</h1><p>Completa los datos, personaliza el diseño y agrega detalles opcionales. Puedes modificar todo después.</p><div className="editor-draft-reminder">{isPublished ? <><FiCheck /> Invitación publicada</> : <><FiLock /> {event.status === "REFUNDED" ? "Enlace retirado por reembolso total" : event.status === "SUSPENDED" ? "Enlace suspendido por disputa del pago" : event.paidAt ? "Enlace fuera de vigencia o archivado" : "Tu invitación es privada hasta confirmar el pago"}</>}</div></div>
        {creation ? <div className="onboarding-progress"><div><span>{step < 8 ? "Tu celebración" : step < 14 ? "Tu estilo" : "Los últimos detalles"}</span><span>{step + 1} de {creationQuestions.length}</span></div><progress aria-label="Progreso de tu invitación" value={step + 1} max={creationQuestions.length} /><h2 ref={questionRef} tabIndex={-1}>{step === 14 && currentExtra ? currentExtra.title : creationQuestions[step][0]}</h2><p>{step === 14 && currentExtra ? `Detalle ${extraIndex + 1} de ${sections.length}. Personalízalo o continúa sin incluirlo.` : creationQuestions[step][1]}</p></div> : <nav className="editor-step-nav" aria-label="Secciones del editor"><a href="#event-details"><span>1</span> Datos</a><a href="#event-cover"><span>2</span> Portada</a><a href="#event-extras"><span>3</span> Detalles opcionales</a></nav>}
        {!creation && <div className="editor-purchase-access">
          <div><strong>Pago y soporte</strong><p>Consulta el estado de tu compra y la referencia de esta invitación.</p><small>Referencia: {event.id}</small></div>
          <EditorProtectedLink guard={confirmNavigation} className="button" href={`/dashboard/eventos/${event.id}/pago`}>Ver pago y soporte</EditorProtectedLink>
          <EditorProtectedLink guard={confirmNavigation} className="button" href={`/dashboard/eventos/${event.id}/asistencias`}>Ver respuestas de asistencia</EditorProtectedLink>
        </div>}
        {!dirty && (saved || (published && isPublished) || protection.lastSaved) && <p className="editor-success" role="status"><FiCheck /> {published && isPublished ? "Tu invitación ya está publicada y lista para compartir." : "Cambios guardados correctamente."}</p>}
        {error && <p className="editor-error" role="alert">{error === "imagenes" ? "Una de las fotos ya no está disponible. Recarga el editor y vuelve a subirla." : error === "enlace-ocupado" ? "Ya tienes otra invitación con ese enlace. Elige otro nombre." : error === "enlace" ? "El enlace debe tener entre 2 y 80 caracteres, con letras, números y guiones." : error === "imagen" ? "Usa una URL válida que comience con http:// o https://." : "Revisa los campos e inténtalo de nuevo."}</p>}
        <p className={`editor-protection-status${dirty ? " is-dirty" : ""}`} role="status" aria-live="polite">{saveStatus}</p>
        <p className="editor-save-help">{creation || protection.manualOnly ? "Conservamos una copia en este dispositivo mientras editas. Guarda para aplicar tus cambios." : "Tu borrador se guarda automáticamente al dejar de escribir."}</p>
        {protection.localWarning && <p className="editor-error" role="alert">Este navegador no permite guardar una copia local. Mantén esta página abierta hasta guardar en el servidor.</p>}
        {protection.error && <div className="editor-save-error" role="alert">
          <p>{protection.error}</p>
          {protection.code === "conflict" && <div>
            {persistence.getEventId() && <EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${persistence.getEventId()}/show`} target="_blank" rel="noopener noreferrer">Revisar versión guardada</EditorProtectedLink>}
            {protection.conflictVersion !== undefined && <button type="submit" form="event-editor-form" name="resolveConflict" value="overwrite" disabled={busy || uploadCount > 0}>Guardar mi versión</button>}
          </div>}
          {protection.code === "unavailable" && !creation && <button type="submit" form="event-editor-form" disabled={busy || uploadCount > 0}>Reintentar guardado</button>}
          {protection.code === "auth" && <EditorProtectedLink guard={confirmNavigation} href={`/login?callbackUrl=${encodeURIComponent(creation ? "/crear" : `/dashboard/eventos/${event.id}`)}`}>Iniciar sesión</EditorProtectedLink>}
        </div>}
        <form ref={formRef} id="event-editor-form" inert={busy || undefined} aria-busy={pending || publishing || protection.saving} action={formAction} onSubmit={(e) => { if (creation && (step < 15 || uploadCount > 0)) { e.preventDefault(); if (!uploadCount) advanceCreation(); } }} className="editor-form">
          <div className="onboarding-form-content" ref={contentRef}>
          <input type="hidden" name="sections" value={JSON.stringify(sections)} />
          <section className="editor-group" id="event-details" hidden={creation && step > 7}>
            <div className="editor-group-heading"><span className="editor-group-number">1</span><div><h2>Datos de la celebración</h2><p>Esta información aparecerá en tu invitación.</p></div></div>
            <div className="editor-group-fields">
              <div className="editor-field" hidden={creation && step !== 0}><label htmlFor="event-name">¿Cómo se llama tu evento? <span>(obligatorio)</span></label><input id="event-name" name="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder={`Ej. ${getInvitationEventContent(eventType).demo.name}`} /></div>
              {!creation && <CustomInvitationLinkField eventId={event.id} ownerId={event.ownerId} value={customSlug} savedValue={event.customSlug} suggestion={normalizeInvitationSlug(hostNames || name).slice(0, 80).replace(/-$/, "")} onChange={setCustomSlug} />}
              <div className="editor-field" hidden={creation && step !== 1}><label htmlFor="event-type">Tipo de celebración</label><select id="event-type" name="eventType" value={eventType} onChange={e => { const nextType = e.target.value;
                if (creation) {
                  setSections((current) => JSON.stringify(current) === JSON.stringify(exampleSections(eventType)) ? exampleSections(nextType) : current);
                  setMessage((current) => current === getInvitationEventContent(eventType).message ? getInvitationEventContent(nextType).message : current);
                }
                setEventType(nextType); setTemplateId("none"); }}><option value="wedding">Boda</option><option value="birthday">Cumpleaños</option><option value="graduation">Graduación</option><option value="baby_shower">Baby shower</option><option value="anniversary">Aniversario</option><option value="other">Otro evento</option></select></div>
              <div className="editor-field" hidden={creation && step !== 2}><label htmlFor="host-names">¿A quién celebramos? <span>(opcional)</span></label><input id="host-names" name="hostNames" placeholder={`Ej. ${getInvitationEventContent(eventType).demo.hostNames}`} maxLength={120} value={hostNames} onChange={e => setHostNames(e.target.value)} /></div>
              <div className="editor-field" hidden={creation && step !== 3}><label htmlFor="event-date">Fecha <span>(opcional)</span></label><div className="editor-input-icon"><FiCalendar /><input id="event-date" name="eventDate" type="date" value={eventDate} onChange={e => { setEventDate(e.target.value); if (!e.target.value) setEventTime(""); }} /></div></div>
              <div className="editor-field" hidden={creation && step !== 4}><label htmlFor="event-time">Hora <span>(opcional)</span></label><div className="editor-input-icon"><FiClock /><input id="event-time" name="eventTime" type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} disabled={!eventDate} /></div><small className="editor-field-help">El contador se mostrará cuando agregues fecha y hora.</small></div>
              <div className="editor-field" hidden={creation && step !== 5}><label htmlFor="venue">Lugar <span>(opcional)</span></label><input id="venue" name="venue" placeholder={`Ej. ${getInvitationEventContent(eventType).demo.venue}`} maxLength={160} value={venue} onChange={e => setVenue(e.target.value)} /></div>
              <div className="editor-field" hidden={creation && step !== 6}><label htmlFor="address">Dirección <span>(opcional)</span></label><input id="address" name="address" placeholder="Calle, ciudad" maxLength={240} value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div className="editor-field editor-group-wide" hidden={creation && step !== 7}><label htmlFor="message">Mensaje para tus invitados <span>(opcional)</span></label><textarea id="message" name="message" rows={3} maxLength={1200} placeholder={getInvitationEventContent(eventType).message} value={message} onChange={e => setMessage(e.target.value)} /></div>
            </div>
          </section>
          <section className="editor-group" id="event-cover" hidden={creation && (step < 8 || step > 13)}>
            <div className="editor-group-heading"><span className="editor-group-number">2</span><div><h2>Personaliza la portada</h2><p>Agrega una foto y elige un color. Puedes hacerlo ahora o después.</p></div></div>
            <div className="editor-group-fields editor-cover-fields">
              <div className="editor-field" hidden={creation && step !== 8}><label>Foto de portada <span>(opcional)</span></label><input type="hidden" name="imageUrl" value={imageUrl} /><CloudinaryImageUpload ensureEvent={creation ? ensureEvent : undefined} onBusyChange={(busy) => setUploadCount((count) => count + (busy ? 1 : -1))} eventId={event.id} images={imageUrl ? [imageUrl] : []} multiple={false} onChange={(images) => setImageUrl(images[0] ?? "")} /></div>
              <div className="onboarding-design-option" hidden={creation && step !== 9}><InvitationTemplatePicker eventType={eventType} value={templateId} onChange={(id) => { setTemplateId(id); const recommended = templateAccent(eventType, id); if (recommended) setAccent(recommended); }} /></div>
              <div className="onboarding-design-option" hidden={creation && step !== 10}><InvitationTexturePicker value={texture} onChange={setTexture} /></div>
              <div className="editor-field editor-color-field" hidden={creation && step !== 11}><label htmlFor="accent">Color principal</label><div><input id="accent" name="accent" type="color" value={accent} onChange={e => setAccent(e.target.value)} /><span>{accent.toUpperCase()}</span></div><small className="editor-field-help">Se usará en algunos detalles de diseño.</small></div>
              <div className="editor-field" hidden={creation && step !== 8}><label htmlFor="heroHorizontal">Alineación del título de portada</label><select id="heroHorizontal" name="heroHorizontal" value={heroHorizontal} onChange={(e) => setHeroHorizontal(e.target.value)}><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></div>
              <div className="editor-field" hidden={creation && step !== 8}><label htmlFor="heroVertical">Posición vertical del título de portada</label><select id="heroVertical" name="heroVertical" value={heroVertical} onChange={(e) => setHeroVertical(e.target.value)}><option value="top">Arriba</option><option value="center">Centro</option><option value="bottom">Abajo</option></select></div>
              <div className="editor-group-wide" hidden={creation && step !== 11}>
                <div className="editor-group-heading"><div><h3>Estilo de los botones</h3><p>Se aplica a la portada, mapas, confirmación y demás enlaces de la invitación.</p></div></div>
                <div className="editor-group-fields">
                  <div className="editor-field"><label htmlFor="buttonShape">Forma</label><select id="buttonShape" name="buttonShape" value={buttonAppearance.shape} onChange={(e) => setButtonAppearance((current) => ({ ...current, shape: e.target.value as InvitationButtonAppearance["shape"] }))}><option value="square">Cuadrado</option><option value="rounded">Ligeramente redondeado</option><option value="pill">Circular (extremos redondos)</option></select></div>
                  <div className="editor-field"><label htmlFor="buttonFilled">Fondo</label><select id="buttonFilled" name="buttonFilled" value={String(buttonAppearance.filled)} onChange={(e) => setButtonAppearance((current) => ({ ...current, filled: e.target.value === "true" }))}><option value="true">Con color de fondo</option><option value="false">Sin fondo</option></select></div>
                  <div className="editor-field"><label htmlFor="buttonBorder">Borde</label><select id="buttonBorder" name="buttonBorder" value={String(buttonAppearance.border)} onChange={(e) => setButtonAppearance((current) => ({ ...current, border: e.target.value === "true" }))}><option value="false">Sin borde</option><option value="true">Con borde</option></select></div>
                  <div className="editor-field"><label htmlFor="buttonBold">Texto de los botones</label><select id="buttonBold" name="buttonBold" value={String(buttonAppearance.bold)} onChange={(e) => setButtonAppearance((current) => ({ ...current, bold: e.target.value === "true" }))}><option value="true">Negrita</option><option value="false">Normal</option></select></div>
                  <div className="editor-field"><label htmlFor="buttonIcons">Iconos</label><select id="buttonIcons" name="buttonIcons" value={String(buttonAppearance.icons)} onChange={(e) => setButtonAppearance((current) => ({ ...current, icons: e.target.value === "true" }))}><option value="true">Con iconos</option><option value="false">Sin iconos</option></select></div>
                </div>
              </div>
              <div className="editor-group-heading editor-group-wide" hidden={creation && step !== 12 && step !== 13}><div><h3>Tipografías</h3><p>Elige las fuentes para los títulos y los textos de tu invitación.</p></div></div>
              <div className="onboarding-design-option" hidden={creation && step !== 12}><InvitationFontSelect role="heading" eventType={eventType} value={typography} onChange={setTypography} /></div>
              <div className="onboarding-design-option" hidden={creation && step !== 13}><InvitationFontSelect role="body" eventType={eventType} value={bodyTypography} onChange={setBodyTypography} /></div>
              <div hidden={creation && step !== 12 && step !== 13} className="editor-font-sample editor-group-wide" style={{ fontFamily: getInvitationFont(typography).family }}>{hostNames || name || "Tu celebración"}<span style={{ fontFamily: getInvitationFont(bodyTypography).family }}>Nos encantará compartir este día contigo. Una celebración para recordar.</span></div>
            </div>
          </section>
          <section className="editor-sections-field" id="event-extras" hidden={creation && step !== 14}>
            <div className="editor-group-heading"><span className="editor-group-number">3</span><div><h2>Detalles adicionales</h2><p>Agrega horarios, confirmación de asistencia, regalos y más. Todo esto es opcional.</p></div></div>
            <div className="editor-sections-heading"><span>{sections.filter((section) => section.enabled).length} secciones activas</span></div>
            {creation && <p className="onboarding-example-note" role="note"><strong>Estos son datos ficticios.</strong> Cambia los textos, nombres, horarios y enlaces por los datos reales de tu evento antes de confirmar. Si este apartado no aplica, puedes omitirlo.</p>}
            <div className="editor-section-list">
              {sections.map((section, index) => {
                const option = sectionOptions.find((item) => item.type === section.type)!;
                const base = `section-${section.id}`;
                return <fieldset hidden={creation && currentExtra?.id !== section.id} disabled={creation && !section.enabled && (step !== 14 || currentExtra?.id !== section.id)} className={`editor-section-card${section.enabled ? " is-enabled" : " is-disabled"}`} key={section.id}>
                  <div className="editor-section-card-head">
                    <label className="editor-section-toggle"><input hidden={creation} disabled={creation} type="checkbox" checked={section.enabled} onChange={(e) => updateSection(section.id, { enabled: e.target.checked })} /><span className="editor-section-icon">{sectionIcon(section.type)}</span><span className="editor-section-toggle-copy"><strong>{section.title || option.title}</strong><small>{option.description}</small></span></label>
                    <div className="editor-section-actions" hidden={creation}><button type="button" aria-label="Mover sección arriba" disabled={index === 0} onClick={() => moveSection(index, -1)}><FiArrowUp /></button><button type="button" aria-label="Mover sección abajo" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)}><FiArrowDown /></button><button type="button" aria-label="Eliminar sección" onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}><FiTrash2 /></button></div>
                  </div>
                  <details className="editor-section-details" open={creation ? true : undefined}><summary>Editar esta sección</summary><div className="editor-section-fields">
                    <div className="editor-field"><label htmlFor={`${base}-title`}>Título</label><input id={`${base}-title`} value={section.title} maxLength={100} onChange={(e) => updateSection(section.id, { title: e.target.value })} /></div>
                    <div className="editor-field"><label htmlFor={`${base}-content`}>{section.type === "dress_code" ? "Indicaciones" : section.type === "rsvp" ? "Instrucciones" : section.type === "gifts" ? "Mensaje" : section.type === "program" ? "Horario y actividad (un momento por renglón)" : section.type === "parents" ? "Nombres (una pareja o persona por renglón)" : "Descripción"}</label><textarea id={`${base}-content`} rows={section.type === "program" || section.type === "parents" ? 5 : 3} maxLength={2000} value={section.content} onChange={(e) => updateSection(section.id, { content: e.target.value })} placeholder={section.type === "program" ? "5:30 p. m. — Recepción de invitados\n6:00 p. m. — Ceremonia\n7:00 p. m. — Cóctel" : section.type === "parents" ? "Ej. Joaquín Reyes y Patricia Fuentes\nRodrigo Navarro y Lucía Cortés" : "Escribe aquí la información para tus invitados…"} /></div>
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "gallery" || section.type === "parents") && <div className="editor-field"><label htmlFor={`${base}-detail`}>{section.type === "parents" ? "Mensaje de agradecimiento" : section.type === "gallery" ? "Texto de apoyo" : "Fecha u horario"}</label><input id={`${base}-detail`} maxLength={240} value={section.detail} onChange={(e) => updateSection(section.id, { detail: e.target.value })} placeholder={getInvitationEventContent(eventType).sections[section.type].detail || "Agrega un detalle para tus invitados"} /></div>}
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "gifts") && <div className="editor-field"><label htmlFor={`${base}-link`}>{section.type === "gifts" ? "Enlace a mesa de regalos" : "Ubicación o enlace de Google Maps"}</label><input id={`${base}-link`} type={section.type === "gifts" ? "url" : "text"} maxLength={500} value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder={section.type === "gifts" ? "https://…" : "Ej. Jardín Las Rosas, Puebla, o un enlace de Maps"} />{section.type !== "gifts" && <><small>Escribe el lugar y la ciudad o pega el enlace de Google Maps.</small>{invitationSectionUrl(section.type, section.link) && <a href={invitationSectionUrl(section.type, section.link)!} target="_blank" rel="noopener noreferrer">Comprobar ubicación en Google Maps ↗</a>}</>}</div>}
                    {section.type === "gallery" && <div className="editor-field"><label>Fotos de la galería</label><CloudinaryImageUpload ensureEvent={creation ? ensureEvent : undefined} onBusyChange={(busy) => setUploadCount((count) => count + (busy ? 1 : -1))} eventId={event.id} images={section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : []} multiple onChange={(images) => updateSection(section.id, { imageUrls: images, imageUrl: images[0] ?? "" })} /></div>}
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "story" || section.type === "custom") && <div className="editor-field"><label>Imagen de esta sección</label><CloudinaryImageUpload ensureEvent={creation ? ensureEvent : undefined} onBusyChange={(busy) => setUploadCount((count) => count + (busy ? 1 : -1))} eventId={event.id} images={section.imageUrl ? [section.imageUrl] : []} multiple={false} onChange={(images) => updateSection(section.id, { imageUrl: images[0] ?? "" })} /></div>}
                    {section.type === "rsvp" && <>
                      <div className="editor-field"><label htmlFor={`${base}-rsvp-mode`}>Cómo recibir las respuestas</label><select id={`${base}-rsvp-mode`} value={section.rsvpMode ?? "external"} onChange={event => updateSection(section.id, { rsvpMode: event.target.value as "external" | "integrated" })}><option value="integrated">En esta invitación · Sí / No y acompañantes</option><option value="external">Enlace externo o WhatsApp</option></select><small>Es opcional: desactiva la sección Confirmación para ocultarla. El formulario integrado permite hasta 5 acompañantes extra por respuesta.</small></div>
                      {section.rsvpMode !== "integrated" && <div className="editor-field"><label htmlFor={`${base}-link`}>Enlace de confirmación o WhatsApp</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://wa.me/…" /></div>}
                    </>}
                    {["ceremony", "reception", "story", "custom"].includes(section.type) && <div className="editor-field"><label htmlFor={`${base}-layout`}>Composición</label><select id={`${base}-layout`} value={section.layout || "auto"} onChange={(e) => updateSection(section.id, { layout: e.target.value as InviteSection["layout"] })}><option value="auto">Automática según el contenido</option><option value="split">Dos columnas</option><option value="centered">Centrada</option><option value="card">Tarjeta</option></select></div>}
                    {section.type === "music" && <div className="editor-field"><label htmlFor={`${base}-link`}>Enlace de canción o playlist</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div>}
                    {section.type === "custom" && <><div className="editor-field"><label htmlFor={`${base}-detail`}>Dato adicional <span>(opcional)</span></label><input id={`${base}-detail`} maxLength={240} value={section.detail} onChange={(e) => updateSection(section.id, { detail: e.target.value })} placeholder="Ej. Salón principal" /></div><div className="editor-field"><label htmlFor={`${base}-link`}>Enlace <span>(opcional)</span></label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div></>}
                  </div></details>
                </fieldset>;
              })}
            </div>
            <div className="editor-add-section" hidden={creation && extraIndex < sections.length - 1}><label htmlFor="add-section">Agregar otro detalle</label><select id="add-section" value="" onChange={(e) => { const type = e.target.value as SectionType; if (type && sections.length < 12) { const section = creation ? makeExampleSection(type, eventType, crypto.randomUUID()) : makeSection(type, crypto.randomUUID()); setSections((current) => [...current, section]); setActiveExtra(section.id); } e.currentTarget.value = ""; }}><option value="">Elige qué quieres agregar…</option>{sectionOptions.map((option) => <option key={option.type} value={option.type}>{option.title}</option>)}</select><small>Elige una opción para agregarla a tu invitación. Puedes incluir hasta 12.</small></div>
          </section>
          {creation && step === 15 && <div className="onboarding-review"><dl>{[["Evento", name], ["Tipo", { wedding: "Boda", birthday: "Cumpleaños", graduation: "Graduación", baby_shower: "Baby shower", anniversary: "Aniversario", other: "Otro evento" }[eventType]], ["Fecha", eventDate ? prettyDate : "Por definir"], ["Hora", eventTime || "Por definir"], ["Lugar", venue || "Por definir"], ["Dirección", address || "Por definir"], ["Detalles adicionales", String(sections.filter((section) => section.enabled).length)]].map(([label, value], index) => <div key={label}><dt>{label}</dt><dd>{value}<button className="onboarding-review-edit" type="button" aria-label={`Modificar ${label?.toLowerCase()}`} onClick={() => setStep([0, 1, 3, 4, 5, 6, 14][index])}>Modificar</button></dd></div>)}</dl></div>}
          </div>
          <div className="onboarding-form-footer">
          {creation && <div className="creation-step-actions"><div>{step > 0 && <button className="onboarding-back" type="button" disabled={busy || uploadCount > 0} onClick={previousCreation}><FiArrowLeft /> Anterior</button>}{step < 15 && <button className="button" type="button" disabled={uploadCount > 0} onClick={() => advanceCreation()}>{step === 14 ? "Confirmar y continuar" : "Continuar"} <FiChevronRight /></button>}</div>{step > 1 && step < 15 && <button className="onboarding-skip" type="button" disabled={uploadCount > 0} onClick={() => advanceCreation(step === 14)}>{step >= 9 && step <= 13 ? "Usar diseño actual" : step === 14 ? "Omitir este apartado" : "Lo agregaré después"}</button>}<button className="onboarding-preview-toggle" type="button" onClick={() => { if (window.matchMedia("(min-width: 1024px)").matches) setShowCreationPreview((shown) => !shown); else setPreviewExpanded(true); }}><FiEye />{showCreationPreview ? "Ocultar vista previa" : "Ver cómo va quedando"}</button></div>}
          <div className="editor-form-actions" hidden={creation && step !== 15}>
            <button className={`button editor-save${isPublished ? " is-primary" : ""}`} type="submit" disabled={busy || uploadCount > 0 || (!creation && !dirty)}><FiSave /> {pending ? "Guardando…" : isPublished ? "Guardar cambios" : creation ? "Crear invitación" : "Guardar borrador"}</button>
            {!creation && !isPublished && <button className="button editor-publish" type="submit" formAction={publishAction} disabled={busy || uploadCount > 0 || protection.code === "conflict"}><FiEye /> {publishing ? "Guardando…" : event.paidAt ? "Revisar publicación" : `Pagar y publicar · ${invitationPriceLabel} MXN`}</button>}
            <p>{isPublished ? "Al guardar, los cambios se verán en tu enlace público." : "Puedes editar y previsualizar gratis. El enlace se habilita después de confirmar el pago."}</p>
          </div>
          </div>
        </form>
      </section>
      <aside className="editor-preview-panel" hidden={creation && !showCreationPreview && !previewExpanded}><div className="editor-preview-title"><div><span>VISTA PREVIA</span><small>Se actualiza al editar</small></div><span className="preview-draft-chip">{isPublished ? <><FiCheck /> PUBLICADA</> : <><FiLock /> PRIVADA</>}</span></div>
        {!creation && !event.paidAt && <div className="editor-payment-notice"><FiLock /><div><strong>Pendiente de pago</strong><p>{invitationPriceLabel} MXN por evento · IVA incluido · 12 meses activa. Tu enlace permanece privado hasta confirmar el pago.</p><EditorProtectedLink guard={confirmNavigation} href={`/dashboard/eventos/${event.id}/pago`}>Ver detalles del pago</EditorProtectedLink></div></div>}
        <InvitationLivePreview expanded={previewExpanded} onClose={closePreview}><InvitationCanvas eventType={eventType} name={name} hostNames={hostNames} date={prettyDate} eventDateKey={eventDate} eventTime={eventTime} venue={venue} address={address} message={message} imageUrl={imageUrl} accent={accent} typography={typography} bodyTypography={bodyTypography} heroHorizontal={heroHorizontal} heroVertical={heroVertical} buttonAppearance={buttonAppearance} templateId={templateId} texture={texture} sections={sections} full /></InvitationLivePreview>
        <button className="editor-open-preview" type="button" onClick={() => setPreviewExpanded(true)}><FiEye /> Ver invitación completa</button>
        <p className="editor-preview-note">La vista previa incluye tus cambios actuales. Abrirla no guarda ni publica.</p>
        {isPublished && event.slug && <>
          <EditorProtectedLink guard={confirmNavigation} className="editor-public-invitation" href={invitationPath(event)!} target="_blank" rel="noopener noreferrer"><FiEye aria-hidden="true" /> Abrir invitación pública</EditorProtectedLink>
          {dirty && <p className="editor-preview-note">El enlace público muestra la última versión guardada. Guarda tus cambios para actualizarla.</p>}
        </>}
      </aside>
    </div>
  </main>;
}

function InvitationFontSelect({ role, eventType, value, onChange }: { role: FontRole; eventType: string; value: string; onChange: (value: string) => void }) {
  const recommended = recommendedInvitationFonts(eventType, role);
  const id = role === "heading" ? "typography" : "bodyTypography";
  return <div className="editor-field editor-typography-field">
    <label htmlFor={id}>{role === "heading" ? "Tipografía de los títulos" : "Tipografía de los textos"}</label>
    <select id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} style={{ fontFamily: getInvitationFont(value).family }}>
      <optgroup label="Recomendadas para este evento">{recommended.map((fontId) => { const font = getInvitationFont(fontId); return <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>{font.label}</option>; })}</optgroup>
      <optgroup label="Más tipografías">{invitationFonts.filter((font) => !recommended.includes(font.id)).map((font) => <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>{font.label}</option>)}</optgroup>
    </select>
    <small className="editor-field-help">{role === "heading" ? "Para nombres y títulos de la invitación." : "Para descripciones, horarios, indicaciones y demás textos."} Todas las fuentes están disponibles; las recomendaciones cambian según el evento.</small>
  </div>;
}

export function CloudinaryImageUpload({ eventId, images, multiple, onChange, ensureEvent, onBusyChange }: {
  ensureEvent?: () => Promise<string>;
  onBusyChange?: (busy: boolean) => void;
  eventId: string;
  images: string[];
  multiple: boolean;
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const maxImages = multiple ? Math.max(0, ACCOUNT_LIMITS.imagesPerGallery - images.length) : 1;

  async function uploadFiles(files: File[]) {
    setError("");
    const remaining = maxImages;
    if (remaining <= 0) {
      setError(`La galería ya tiene las ${ACCOUNT_LIMITS.imagesPerGallery} fotos permitidas. Quita una para agregar otra.`);
      return;
    }
    const selected = files.slice(0, remaining);
    if (files.length > remaining) setError(`Solo puedes agregar ${remaining} foto${remaining === 1 ? "" : "s"} más.`);
    const nextImages = multiple ? [...images] : [];
    setUploading(true);
    onBusyChange?.(true);

    try {
      for (const file of selected) {
        if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
          throw new Error("Usa imágenes JPG, PNG, WebP o AVIF.");
        }
        if (file.size > ACCOUNT_LIMITS.imageSizeBytes) throw new Error(`Cada imagen debe pesar ${ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB o menos.`);
        const uploadForm = new FormData();
        uploadForm.set("file", file);
        uploadForm.set("eventId", ensureEvent ? await ensureEvent() : eventId);
        const uploadResponse = await fetch("/api/cloudinary/upload", { method: "POST", body: uploadForm });
        const uploaded = await uploadResponse.json() as { secureUrl?: string; error?: string };
        if (!uploadResponse.ok || !uploaded.secureUrl) throw new Error(uploaded.error || "No pudimos subir esta imagen.");
        nextImages.push(uploaded.secureUrl);
        onChange(nextImages.slice(0, ACCOUNT_LIMITS.imagesPerGallery));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  }

  return <div className="image-upload-field">
    <label className={`image-upload-button${uploading ? " is-uploading" : ""}`}>
      <FiImage aria-hidden="true" /><span>{uploading ? "Subiendo imagen…" : multiple ? "Agregar fotos" : images.length ? "Reemplazar imagen" : "Subir imagen"}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} disabled={uploading} onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = "";
        if (files.length) void uploadFiles(files);
      }} />
    </label>
    <small className="image-upload-help">JPG, PNG, WebP o AVIF · máximo {ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB por imagen {multiple && <> · {Math.max(0, ACCOUNT_LIMITS.imagesPerGallery - images.length)} de {ACCOUNT_LIMITS.imagesPerGallery} espacios disponibles en esta galería</>}</small>
    {error && <p className="image-upload-error" role="alert">{error}</p>}
    {images.length > 0 && <div className="image-upload-previews">{images.map((url, index) => <div className="image-upload-preview" key={`${url}-${index}`}>
      <Image src={url} alt={`Imagen ${index + 1}`} width={160} height={160} unoptimized />
      <button type="button" disabled={uploading} aria-label={`Quitar imagen ${index + 1}`} onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}><FiTrash2 /></button>
    </div>)}</div>}
  </div>;
}

function GalleryBento({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const safeIndex = images.length ? Math.min(activeIndex, images.length - 1) : 0;
  const change = (direction: -1 | 1) => setActiveIndex((safeIndex + direction + images.length) % images.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const ownerDocument = closeButtonRef.current?.ownerDocument ?? document;
    const opener = openButtonRef.current;
    const previousOverflow = ownerDocument.body.style.overflow;
    ownerDocument.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const controls = Array.from(closeButtonRef.current?.parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? []);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && ownerDocument.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && ownerDocument.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft" && images.length > 1) setActiveIndex((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight" && images.length > 1) setActiveIndex((current) => (current + 1) % images.length);
    };
    ownerDocument.addEventListener("keydown", onKeyDown);
    return () => {
      ownerDocument.removeEventListener("keydown", onKeyDown);
      ownerDocument.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [lightboxOpen, images.length]);

  if (!images.length) return null;

  return <>
    <div className="invite-gallery-bento" data-photo-count={images.length} aria-label={`${title}: galería de fotos`}>
      {images.map((url, index) => <button className="invite-gallery-tile" type="button" key={`${url}-${index}`} aria-label={`Ver foto ${index + 1} de ${images.length} completa`} onClick={(event) => { openButtonRef.current = event.currentTarget; setActiveIndex(index); setLightboxOpen(true); }}>
        <Image src={url} alt={`${title}, foto ${index + 1}`} fill sizes={index % 6 === 0 ? "(max-width: 760px) 100vw, 560px" : "(max-width: 760px) 50vw, 280px"} unoptimized />
        <span className="invite-gallery-tile-open" aria-hidden="true"><FiMaximize2 /></span>
      </button>)}
    </div>
    {lightboxOpen && <div className="invite-gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${title}: foto ${safeIndex + 1} de ${images.length}`} onClick={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}>
      <button ref={closeButtonRef} className="invite-gallery-lightbox-close" type="button" aria-label="Cerrar imagen ampliada" onClick={() => setLightboxOpen(false)}><FiX aria-hidden="true" /></button>
      {images.length > 1 && <button className="invite-gallery-lightbox-arrow is-previous" type="button" aria-label="Foto anterior" onClick={() => change(-1)}><FiChevronLeft /></button>}
      <div className="invite-gallery-lightbox-image"><Image src={images[safeIndex]} alt={`${title}, foto ${safeIndex + 1} de ${images.length}`} fill sizes="100vw" unoptimized /></div>
      {images.length > 1 && <button className="invite-gallery-lightbox-arrow is-next" type="button" aria-label="Foto siguiente" onClick={() => change(1)}><FiChevronRight /></button>}
      <span className="invite-gallery-lightbox-count">{safeIndex + 1} / {images.length}</span>
    </div>}
  </>;
}

function sectionIcon(type: SectionType) {
  switch (type) {
    case "story": return <FiHeart />;
    case "ceremony": case "reception": return <FiMapPin />;
    case "program": return <FiClock />;
    case "parents": return <FiUsers />;
    case "dress_code": return <FiTag />;
    case "gifts": return <FiGift />;
    case "rsvp": return <FiCheck />;
    case "gallery": return <FiImage />;
    case "music": return <FiMusic />;
    default: return <FiPlus />;
  }
}

function parseProgramEntry(line: string, index: number) {
  const cleaned = line.trim().replace(/^(?:[-*•▪◦]+)\s*/, "");
  const match = cleaned.match(/^(\d{1,2}(?::\d{2})?(?:\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm))?)\s*(?:[—–-]|:)\s*(.+)$/i);
  if (match) return { id: `${index}-${cleaned}`, time: match[1].trim(), description: match[2].trim() };
  return { id: `${index}-${cleaned}`, time: "", description: cleaned };
}

export function InvitationCanvas({ eventType, name, hostNames, date, eventDateKey = "", eventTime = "", venue, address, message, imageUrl, locationImageUrl, accent, typography = "default", bodyTypography = "inter", heroHorizontal = "left", heroVertical = "center", buttonAppearance = defaultButtonAppearance, templateId = "none", texture = "none", sections, publicEventId }: {
  eventType: string; name: string; hostNames: string; date: string; eventDateKey?: string; eventTime?: string; venue: string; address: string; message: string; imageUrl: string; locationImageUrl?: string; accent: string; typography?: string; bodyTypography?: string; heroHorizontal?: string; heroVertical?: string; buttonAppearance?: InvitationButtonAppearance; templateId?: string; texture?: string; sections: InviteSection[]; full?: boolean; publicEventId?: string;
}) {
  if (eventType === "wedding" && getWeddingDesign(templateId)) return <WeddingInvitation templateId={templateId} accent={accent} name={name} hostNames={hostNames} date={date} eventDateKey={eventDateKey} eventTime={eventTime} venue={venue} address={address} message={message} imageUrl={imageUrl} sections={sections} publicEventId={publicEventId} />;
  return <InvitationWebsite eventType={eventType} name={name} hostNames={hostNames} date={date} eventDateKey={eventDateKey} eventTime={eventTime} venue={venue} address={address} message={message} imageUrl={imageUrl} locationImageUrl={locationImageUrl} accent={accent} typography={typography} bodyTypography={bodyTypography} heroHorizontal={heroHorizontal} heroVertical={heroVertical} buttonAppearance={buttonAppearance} templateId={templateId} texture={texture} sections={sections} publicEventId={publicEventId} />;
}

function InvitationWebsite({ eventType, name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, locationImageUrl, accent, typography = "default", bodyTypography = "inter", heroHorizontal = "left", heroVertical = "center", buttonAppearance = defaultButtonAppearance, templateId = "none", texture = "none", sections, publicEventId }: {
  eventType: string; name: string; hostNames: string; date: string; eventDateKey: string; eventTime: string; venue: string; address: string; message: string; imageUrl: string; locationImageUrl?: string; accent: string; typography?: string; bodyTypography?: string; heroHorizontal?: string; heroVertical?: string; buttonAppearance?: InvitationButtonAppearance; templateId?: string; texture?: string; sections: InviteSection[]; publicEventId?: string;
}) {
  const motionRef = useInvitationMotion();
  const content = getInvitationEventContent(eventType);
  const visibleSections = sections.filter((section) => section.enabled && ((section.type === "rsvp" && section.rsvpMode === "integrated") || section.content || section.detail || section.link || section.imageUrl || section.imageUrls?.length));
  const dressCode = visibleSections.find((section) => section.type === "dress_code");
  const confirmation = visibleSections.find((section) => section.type === "rsvp");
  const pairedSections = dressCode && confirmation && Math.abs(visibleSections.indexOf(dressCode) - visibleSections.indexOf(confirmation)) === 1 ? visibleSections.filter((section) => section.id === dressCode.id || section.id === confirmation.id) : [];
  const template = getInvitationTemplate(eventType, templateId);
  const title = hostNames || name || "Una celebración especial";
  const dateAndTime = eventTime ? `${date} · ${formatEventTime(eventTime)}` : date;
  return <article ref={motionRef} className={`invite-website${eventType === "wedding" ? " invite-wedding-editorial" : ""}`} data-button-shape={buttonAppearance.shape} data-button-filled={String(buttonAppearance.filled)} data-button-icons={String(buttonAppearance.icons)} data-button-border={String(buttonAppearance.border)} data-button-bold={String(buttonAppearance.bold)} data-texture={texture} data-typography={typography} data-body-typography={bodyTypography} data-has-flower={template?.assets.flower ? "true" : undefined} data-has-separator={template?.assets.separator ? "true" : undefined} data-decorated={template ? "true" : undefined} data-template={template ? `${eventType}-${template.id}` : undefined} style={{ "--invite-accent": accent, "--invite-heading-font": getInvitationFont(typography).family, "--invite-body-font": getInvitationFont(bodyTypography).family, "--template-top-right": template?.assets.topRight ? `url("${template.assets.topRight}")` : "none", "--template-bottom-left": template?.assets.bottomLeft ? `url("${template.assets.bottomLeft}")` : "none", "--template-top-left": template?.assets.topLeft ? `url("${template.assets.topLeft}")` : "none", "--template-bottom-right": template?.assets.bottomRight ? `url("${template.assets.bottomRight}")` : "none", "--template-separator": template?.assets.separator ? `url("${template.assets.separator}")` : "none", "--template-decoration": template?.assets.decoration ? `url("${template.assets.decoration}")` : "none", "--template-flower": template?.assets.flower ? `url("${template.assets.flower}")` : "none" } as React.CSSProperties}>
    <section data-hero-horizontal={heroHorizontal} data-hero-vertical={heroVertical} className={`invite-website-hero${imageUrl ? " has-cover-image" : ""}`} style={imageUrl ? { backgroundImage: `linear-gradient(${heroHorizontal === "right" ? "270deg" : heroHorizontal === "center" ? "0deg" : "90deg"},#10100fd9 0%,#10100f66 58%,#10100f12 100%),url("${imageUrl.replaceAll('"', '')}")` } : undefined}>
      <div className="invite-hero-glow" aria-hidden="true" />
      <div className="invite-hero-content"><span className="invite-hero-kicker">{content.heroKicker}</span><span className="invite-hero-rule" /><p className="invite-hero-intro">{content.heroIntro}</p><h1>{title}</h1><p className="invite-hero-event-name">{name || content.defaultName}</p><div className="invite-hero-date"><FiCalendar /> {dateAndTime}</div><a className="invite-hero-button" href="#invite-details">Acompáñanos <FiArrowDown /></a></div>
      <div className="invite-hero-side-note"><span>ESTÁS INVITADO</span><i>✦</i><span>CON CARIÑO</span></div>
    </section>
    <section className="invite-welcome" id="invite-details">{template && <InvitationDecoration template={template} />}<span className="invite-section-kicker">NOS ENCANTARÍA COMPARTIRLO CONTIGO</span><span className="invite-ornament">✦</span><h2>{content.welcomeTitle}</h2><p>{message || content.message}</p><strong>{title}</strong></section>
    {(venue || address) && <section className={`invite-main-location${locationImageUrl ? " has-location-image" : ""}`}><div className="invite-location-photo" style={(locationImageUrl || imageUrl) ? { backgroundImage: `url("${(locationImageUrl || imageUrl).replaceAll('"', '')}")` } : undefined}><span className="invite-photo-caption">EL LUGAR DE NUESTRO ENCUENTRO</span></div><div className="invite-location-main-copy"><span className="invite-section-kicker">GUARDA LA FECHA</span><h2>{venue || "El lugar de la celebración"}</h2><p className="invite-location-address">{address || "Pronto compartiremos la ubicación"}</p><a className="invite-static-link" href={invitationMapUrl(venue, address)} target="_blank" rel="noopener noreferrer"><FiMapPin /> Ver ubicación</a></div></section>}
    {visibleSections.length > 0 && <section className="invite-extra-sections">{visibleSections.map((section, index) => {
      if (pairedSections.some((paired) => paired.id === section.id)) {
        if (section.id !== pairedSections[0].id) return null;
        return <div className="invite-practical-details" key={section.id}>{pairedSections.map((paired) => <InviteWebsiteSection eventType={eventType} key={paired.id} section={paired} index={visibleSections.indexOf(paired)} decoration={sectionDecoration(template, paired.type)} publicEventId={publicEventId} />)}</div>;
      }
      return <InviteWebsiteSection eventType={eventType} key={section.id} section={section} index={index} decoration={sectionDecoration(template, section.type)} template={template} publicEventId={publicEventId} />;
    })}</section>}
    <section className="invite-countdown-panel">{template && <InvitationDecoration template={template} bottomOnly />}<span className="invite-section-kicker">RESERVA LA FECHA</span><h2>{dateAndTime}</h2>{eventDateKey && eventTime ? <CountdownTimer date={eventDateKey} time={eventTime} /> : <p>Nos encantará celebrar contigo</p>}<span className="invite-countdown-decoration">✦</span></section>
    <footer className="invite-website-footer"><span className="invite-footer-ornament">✦</span><p>Gracias por ser parte de este momento</p><strong>{title}</strong><small>HECHO CON CARIÑO PARA CELEBRAR</small></footer>
  </article>;
}

function formatEventTime(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return time;
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(new Date(`1970-01-01T${time}:00Z`));
}

function CountdownTimer({ date, time }: { date: string; time: string }) {
  const [now, setNow] = useState<number | null>(null);
  const target = Date.parse(`${date}T${time}:00-06:00`);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!Number.isFinite(target)) return null;
  if (now !== null && now >= target) return <p className="invite-countdown-started">¡Llegó el gran día! Que empiece la celebración.</p>;

  const totalSeconds = now === null ? 0 : Math.floor((target - now) / 1000);
  const values = [
    { value: now === null ? "--" : String(Math.floor(totalSeconds / 86400)), label: "días" },
    { value: now === null ? "--" : String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0"), label: "horas" },
    { value: now === null ? "--" : String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"), label: "minutos" },
    { value: now === null ? "--" : String(totalSeconds % 60).padStart(2, "0"), label: "segundos" },
  ];

  return <div className="invite-countdown-clock" aria-label="Cuenta regresiva para el evento">
    {values.map((item) => <div className="invite-countdown-unit" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
  </div>;
}

function InviteWebsiteSection({ section, index = 0, decoration, template, eventType, publicEventId }: { section: InviteSection; index?: number; decoration?: string; template?: InvitationTemplate | null; eventType: string; publicEventId?: string }) {
  if (section.type === "dress_code" || section.type === "gifts") decoration = undefined;
  if (section.type === "parents") {
    const ornament = decoration || template?.assets.flower || template?.assets.separator || template?.assets.decoration;
    const families = section.content.split("\n").map((line) => line.trim()).filter(Boolean);
    return <section className="invite-content-block invite-content-parents invite-parents-tribute">
      {template && <InvitationDecoration template={template} bottomOnly />}
      <div className="invite-content-copy">
        {ornament && <div className="invite-parents-ornament" aria-hidden="true"><Image src={ornament} alt="" fill sizes="140px" unoptimized /></div>}
        <span className="invite-section-kicker">{eventType === "wedding" ? "CON LA BENDICIÓN DE" : "GRACIAS POR ESTAR"}</span>
        <h2>{section.title === "Padres" ? "Nuestros padres" : section.title}</h2>
        {section.detail && <p className="invite-content-detail">{section.detail}</p>}
        <ul className="invite-parents-list">{families.map((family, index) => <li key={`${index}-${family}`}><span className="invite-parents-rule" aria-hidden="true" />{family.split(/\s+y\s+/i).map((name, nameIndex) => <span className="invite-parent-name" key={nameIndex}>{nameIndex > 0 && <span className="invite-parents-and" aria-label="y">&amp;</span>}{name}</span>)}</li>)}</ul>
      </div>
    </section>;
  }
  const isGallery = section.type === "gallery";
  const sectionUrl = invitationSectionUrl(section.type, section.link);
  const giftLeft = section.type === "gifts" ? template?.assets.decoration : undefined;
  const giftRight = section.type === "gifts" ? template?.decorations?.[0] : undefined;
  const galleryImages = section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : [];
  return <section data-layout={section.layout === "auto" || !section.layout ? (section.imageUrl ? "split" : "centered") : section.layout} data-has-section-decoration={decoration ? "true" : undefined} className={`invite-content-block invite-content-${section.type}${index % 2 ? " invite-content-offset" : ""}${section.imageUrl || galleryImages.length ? " has-section-image" : ""}`}>
    {decoration && section.type !== "story" && <span className="invite-section-decoration" aria-hidden="true"><Image src={decoration} alt="" fill sizes="(max-width: 760px) 48px, 90px" unoptimized /></span>}
    {isGallery && galleryImages.length > 0 ? <div className="invite-content-image invite-gallery-feature"><GalleryBento images={galleryImages} title={section.title} /></div> : section.imageUrl && <div className="invite-content-image" style={{ backgroundImage: `url("${section.imageUrl.replaceAll('"', '')}")` }} role="img" aria-label={section.title} />}
      <div className="invite-content-copy"><span className="invite-content-icon">{sectionIcon(section.type)}</span>{section.type === "story" && decoration && <span className="invite-story-ornament" aria-hidden="true"><Image src={decoration} alt="" fill sizes="94px" unoptimized /></span>}{section.type === "gifts" && (giftLeft || giftRight) ? <div className="invite-gifts-heading">{giftLeft && <span className="invite-gifts-heading-ornament" aria-hidden="true"><Image src={giftLeft} alt="" fill sizes="(max-width: 760px) 44px, 96px" unoptimized /></span>}<h2>{section.title}</h2>{giftRight && <span className="invite-gifts-heading-ornament" aria-hidden="true"><Image src={giftRight} alt="" fill sizes="(max-width: 760px) 44px, 96px" unoptimized /></span>}</div> : <h2>{section.title}</h2>}{section.detail && <p className="invite-content-detail">{section.detail}</p>}{section.type === "program" && <ol className="invite-program-list">{section.content.split("\n").map(parseProgramEntry).filter((entry) => entry.description).map((entry, index) => <li key={entry.id}><span className={entry.time ? "invite-program-time" : "invite-program-index"}>{entry.time || String(index + 1).padStart(2, "0")}</span><div className="invite-program-copy"><i aria-hidden="true" /><p>{entry.description}</p></div></li>)}</ol>}{section.content && section.type !== "program" && <p className="invite-content-body">{section.content}</p>}
      {section.type === "rsvp" && section.rsvpMode === "integrated" ? <RsvpForm eventId={publicEventId} /> : sectionUrl && <a className="invite-static-link" href={sectionUrl} target="_blank" rel="noopener noreferrer">{invitationLinkLabel(section.type)} <FiArrowDown /></a>}
    </div>
  </section>;
}
