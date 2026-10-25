"use client";

import Image from "next/image";
import { InvitationTemplatePicker } from "./InvitationTemplatePicker";
import { InvitationDecoration } from "./InvitationDecoration";
import { getInvitationTemplate, templateAccent, sectionDecoration } from "@/lib/invitation-templates";
import { CustomInvitationLinkField } from "./CustomInvitationLinkField";
import { invitationPath, normalizeInvitationSlug } from "@/lib/invitation-url";
import { InvitationLivePreview } from "./InvitationLivePreview";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { FiArrowDown, FiArrowLeft, FiArrowUp, FiCalendar, FiCheck, FiChevronLeft, FiChevronRight, FiClock, FiEye, FiGift, FiHeart, FiImage, FiLock, FiMapPin, FiMusic, FiPlus, FiSave, FiTag, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { publishEvent, updateEvent } from "@/app/dashboard/eventos/[id]/actions";
import { BrandEmblem } from "@/components/BrandEmblem";
import { invitationPriceLabel, isInvitationPublished } from "@/lib/invitation-payment";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { getInvitationFont, invitationFonts, recommendedInvitationFonts, type FontRole } from "@/lib/invitation-fonts";

type EventData = {
  id: string; ownerId: string; customSlug: string | null; templateId: string; name: string; eventType: string; eventDate: Date | null; eventTime: string | null; hostNames: string | null; paidAt: Date | null; expiresAt: Date | null; status: "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED"; slug: string | null;
  venue: string | null; address: string | null; message: string | null; imageUrl: string | null; imageUploads: number; accent: string; typography: string; bodyTypography: string; sections: unknown;
};

export type SectionType = "story" | "ceremony" | "reception" | "program" | "parents" | "dress_code" | "gifts" | "rsvp" | "gallery" | "music" | "custom";
export type InviteSection = { id: string; type: SectionType; title: string; content: string; detail: string; link: string; imageUrl: string; imageUrls?: string[]; enabled: boolean };

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
  return { id, type, title: option.title, content: "", detail: "", link: "", imageUrl: "", imageUrls: [], enabled: true };
}

const eventLabels: Record<string, string> = { wedding: "Nuestra boda", birthday: "Una celebración especial", graduation: "Mi graduación", baby_shower: "Baby shower", anniversary: "Nuestro aniversario", other: "Una celebración especial" };
const dateInputValue = (date: Date | null) => date ? new Date(date).toISOString().slice(0, 10) : "";

export function EventEditor({ event, saved, error, published }: { event: EventData; saved: boolean; error: string; published: boolean }) {
  const [name, setName] = useState(event.name);
  const [customSlug, setCustomSlug] = useState(event.customSlug ?? "");
  const [eventType, setEventType] = useState(event.eventType);
  const [templateId, setTemplateId] = useState(event.templateId ?? "none");
  const [eventDate, setEventDate] = useState(dateInputValue(event.eventDate));
  const [eventTime, setEventTime] = useState(event.eventTime ?? "");
  const [hostNames, setHostNames] = useState(event.hostNames ?? "");
  const [venue, setVenue] = useState(event.venue ?? "");
  const [address, setAddress] = useState(event.address ?? "");
  const [message, setMessage] = useState(event.message ?? "");
  const [imageUrl, setImageUrl] = useState(event.imageUrl ?? "");
  const [imageUploads, setImageUploads] = useState(event.imageUploads);
  const [accent, setAccent] = useState(event.accent || "#E9560A");
  const [typography, setTypography] = useState(event.typography || "default");
  const [bodyTypography, setBodyTypography] = useState(event.bodyTypography || "inter");
  const [sections, setSections] = useState<InviteSection[]>(() => {
    if (Array.isArray(event.sections)) return event.sections as InviteSection[];
    return ["story", "ceremony", "reception", "dress_code", "gifts", "rsvp"].map((type) => makeSection(type as SectionType));
  });
  const isPublished = isInvitationPublished(event);
  const save = updateEvent.bind(null, event.id);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const closePreview = useCallback(() => setPreviewExpanded(false), []);
  const publish = publishEvent.bind(null, event.id);
  const snapshot = JSON.stringify([name, eventType, eventDate, eventTime, hostNames, venue, address, message, imageUrl, accent, typography, bodyTypography, sections, customSlug, templateId]);
  const initialSnapshot = JSON.stringify([event.name, event.eventType, dateInputValue(event.eventDate), event.eventTime ?? "", event.hostNames ?? "", event.venue ?? "", event.address ?? "", event.message ?? "", event.imageUrl ?? "", event.accent || "#E9560A", event.typography || "default", event.bodyTypography || "inter", Array.isArray(event.sections) ? event.sections : ["story", "ceremony", "reception", "dress_code", "gifts", "rsvp"].map((type) => makeSection(type as SectionType)), event.customSlug ?? "", event.templateId ?? "none"]);
  const [, publishAction, publishing] = useActionState(async (_: string, formData: FormData) => { await publish(formData); return ""; }, "");
  const [state, formAction, pending] = useActionState(async (_: string, formData: FormData) => {
    const submittedSnapshot = snapshot;
    await save(formData);
    return submittedSnapshot;
  }, "");

  const dirty = snapshot !== (state || initialSnapshot);
  const busy = pending || publishing;
  const prettyDate = eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${eventDate}T12:00:00Z`)) : "La fecha";
  const updateSection = (id: string, changes: Partial<InviteSection>) => setSections((current) => current.map((section) => section.id === id ? { ...section, ...changes } : section));
  const moveSection = (index: number, direction: -1 | 1) => setSections((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const copy = [...current];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  });

  return <main className="editor-page">
    <header className="editor-header">
      <Link className="brand editor-brand" href="/dashboard"><BrandEmblem size={36} /><span className="brand-name">Cheetah<span>Invite</span></span></Link>
      <Link className="editor-back" href="/dashboard"><FiArrowLeft /> Volver a mis eventos</Link>
    </header>
    <div className="editor-layout">
      <section className="editor-form-panel">
        <div className="editor-heading"><p className="dashboard-eyebrow">TU INVITACIÓN</p><h1>Completa los detalles</h1><p>Empieza con la información principal. Después puedes agregar fotos y detalles opcionales.</p><div className="editor-draft-reminder">{isPublished ? <><FiCheck /> Invitación publicada</> : <><FiLock /> Tu invitación es privada hasta confirmar el pago</>}</div></div>
        <nav className="editor-step-nav" aria-label="Secciones del editor">
          <a href="#event-details"><span>1</span> Datos</a><a href="#event-cover"><span>2</span> Portada</a><a href="#event-extras"><span>3</span> Detalles opcionales</a>
        </nav>
        {!dirty && (saved || (published && isPublished) || state) && <p className="editor-success" role="status"><FiCheck /> {published && isPublished ? "Tu invitación ya está publicada y lista para compartir." : "Cambios guardados correctamente."}</p>}
        {error && <p className="editor-error" role="alert">{error === "enlace-ocupado" ? "Ya tienes otra invitación con ese enlace. Elige otro nombre." : error === "enlace" ? "El enlace debe tener entre 2 y 80 caracteres, con letras, números y guiones." : error === "imagen" ? "Usa una URL válida que comience con http:// o https://." : "Revisa los campos e inténtalo de nuevo."}</p>}
        <form id="event-editor-form" action={formAction} className="editor-form">
          <input type="hidden" name="sections" value={JSON.stringify(sections)} />
          <section className="editor-group" id="event-details">
            <div className="editor-group-heading"><span className="editor-group-number">1</span><div><h2>Datos de la celebración</h2><p>Esta información aparecerá en tu invitación.</p></div></div>
            <div className="editor-group-fields">
              <div className="editor-field"><label htmlFor="event-name">¿Cómo se llama tu evento? <span>(obligatorio)</span></label><input id="event-name" name="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Nuestra boda" /></div>
              <CustomInvitationLinkField eventId={event.id} ownerId={event.ownerId} value={customSlug} savedValue={event.customSlug} suggestion={normalizeInvitationSlug(hostNames || name).slice(0, 80).replace(/-$/, "")} onChange={setCustomSlug} />
              <div className="editor-field"><label htmlFor="event-type">Tipo de celebración</label><select id="event-type" name="eventType" value={eventType} onChange={e => { setEventType(e.target.value); setTemplateId("none"); }}><option value="wedding">Boda</option><option value="birthday">Cumpleaños</option><option value="graduation">Graduación</option><option value="baby_shower">Baby shower</option><option value="anniversary">Aniversario</option><option value="other">Otro evento</option></select></div>
              <div className="editor-field"><label htmlFor="host-names">¿A quién celebramos? <span>(opcional)</span></label><input id="host-names" name="hostNames" placeholder="Ej. Mariana y Andrés" maxLength={120} value={hostNames} onChange={e => setHostNames(e.target.value)} /></div>
              <div className="editor-field"><label htmlFor="event-date">Fecha <span>(opcional)</span></label><div className="editor-input-icon"><FiCalendar /><input id="event-date" name="eventDate" type="date" value={eventDate} onChange={e => { setEventDate(e.target.value); if (!e.target.value) setEventTime(""); }} /></div></div>
              <div className="editor-field"><label htmlFor="event-time">Hora <span>(opcional)</span></label><div className="editor-input-icon"><FiClock /><input id="event-time" name="eventTime" type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} disabled={!eventDate} /></div><small className="editor-field-help">El contador se mostrará cuando agregues fecha y hora.</small></div>
              <div className="editor-field"><label htmlFor="venue">Lugar <span>(opcional)</span></label><input id="venue" name="venue" placeholder="Ej. Jardín Los Olivos" maxLength={160} value={venue} onChange={e => setVenue(e.target.value)} /></div>
              <div className="editor-field"><label htmlFor="address">Dirección <span>(opcional)</span></label><input id="address" name="address" placeholder="Calle, ciudad" maxLength={240} value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div className="editor-field editor-group-wide"><label htmlFor="message">Mensaje para tus invitados <span>(opcional)</span></label><textarea id="message" name="message" rows={3} maxLength={1200} placeholder="Nos encantará compartir este día contigo…" value={message} onChange={e => setMessage(e.target.value)} /></div>
            </div>
          </section>
          <section className="editor-group" id="event-cover">
            <div className="editor-group-heading"><span className="editor-group-number">2</span><div><h2>Personaliza la portada</h2><p>Agrega una foto y elige un color. Puedes hacerlo ahora o después.</p></div></div>
            <div className="editor-group-fields editor-cover-fields">
              <div className="editor-field"><label>Foto de portada <span>(opcional)</span></label><input type="hidden" name="imageUrl" value={imageUrl} /><CloudinaryImageUpload eventId={event.id} images={imageUrl ? [imageUrl] : []} multiple={false} imageUploads={imageUploads} onUpload={() => setImageUploads((count) => count + 1)} onChange={(images) => setImageUrl(images[0] ?? "")} /></div>
              <p className="editor-field-help editor-image-quota">{imageUploads} de {ACCOUNT_LIMITS.imagesPerInvitation} imágenes subidas. Las imágenes reemplazadas también cuentan.</p>
              <InvitationTemplatePicker eventType={eventType} value={templateId} onChange={(id) => { setTemplateId(id); const recommended = templateAccent(eventType, id); if (recommended) setAccent(recommended); }} />
              <div className="editor-field editor-color-field"><label htmlFor="accent">Color principal</label><div><input id="accent" name="accent" type="color" value={accent} onChange={e => setAccent(e.target.value)} /><span>{accent.toUpperCase()}</span></div><small className="editor-field-help">Se usará en algunos detalles de diseño.</small></div>
              <InvitationFontSelect role="heading" eventType={eventType} value={typography} onChange={setTypography} />
              <InvitationFontSelect role="body" eventType={eventType} value={bodyTypography} onChange={setBodyTypography} />
              <div className="editor-font-sample editor-group-wide" style={{ fontFamily: getInvitationFont(typography).family }}>{hostNames || name || "Tu celebración"}<span style={{ fontFamily: getInvitationFont(bodyTypography).family }}>Nos encantará compartir este día contigo. Una celebración para recordar.</span></div>
            </div>
          </section>
          <section className="editor-sections-field" id="event-extras">
            <div className="editor-group-heading"><span className="editor-group-number">3</span><div><h2>Detalles adicionales</h2><p>Agrega horarios, confirmación de asistencia, regalos y más. Todo esto es opcional.</p></div></div>
            <div className="editor-sections-heading"><span>{sections.filter((section) => section.enabled).length} secciones activas</span></div>
            <div className="editor-section-list">
              {sections.map((section, index) => {
                const option = sectionOptions.find((item) => item.type === section.type)!;
                const base = `section-${section.id}`;
                return <fieldset className={`editor-section-card${section.enabled ? " is-enabled" : " is-disabled"}`} key={section.id}>
                  <div className="editor-section-card-head">
                    <label className="editor-section-toggle"><input type="checkbox" checked={section.enabled} onChange={(e) => updateSection(section.id, { enabled: e.target.checked })} /><span className="editor-section-icon">{sectionIcon(section.type)}</span><span className="editor-section-toggle-copy"><strong>{section.title || option.title}</strong><small>{option.description}</small></span></label>
                    <div className="editor-section-actions"><button type="button" aria-label="Mover sección arriba" disabled={index === 0} onClick={() => moveSection(index, -1)}><FiArrowUp /></button><button type="button" aria-label="Mover sección abajo" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)}><FiArrowDown /></button><button type="button" aria-label="Eliminar sección" onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}><FiTrash2 /></button></div>
                  </div>
                  <details className="editor-section-details"><summary>Editar esta sección</summary><div className="editor-section-fields">
                    <div className="editor-field"><label htmlFor={`${base}-title`}>Título</label><input id={`${base}-title`} value={section.title} maxLength={100} onChange={(e) => updateSection(section.id, { title: e.target.value })} /></div>
                    <div className="editor-field"><label htmlFor={`${base}-content`}>{section.type === "dress_code" ? "Indicaciones" : section.type === "rsvp" ? "Instrucciones" : section.type === "gifts" ? "Mensaje" : section.type === "program" ? "Horario y actividad (un momento por renglón)" : section.type === "parents" ? "Nombres (una pareja o persona por renglón)" : "Descripción"}</label><textarea id={`${base}-content`} rows={section.type === "program" || section.type === "parents" ? 5 : 3} maxLength={2000} value={section.content} onChange={(e) => updateSection(section.id, { content: e.target.value })} placeholder={section.type === "program" ? "5:30 p. m. — Recepción de invitados\n6:00 p. m. — Ceremonia\n7:00 p. m. — Cóctel" : section.type === "parents" ? "Ej. Joaquín Reyes y Patricia Fuentes\nRodrigo Navarro y Lucía Cortés" : "Escribe aquí la información para tus invitados…"} /></div>
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "gallery") && <div className="editor-field"><label htmlFor={`${base}-detail`}>{section.type === "gallery" ? "Texto de apoyo" : "Fecha u horario"}</label><input id={`${base}-detail`} maxLength={240} value={section.detail} onChange={(e) => updateSection(section.id, { detail: e.target.value })} placeholder={section.type === "gallery" ? "Momentos que queremos recordar" : "Ej. 5:00 p. m."} /></div>}
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "gifts") && <div className="editor-field"><label htmlFor={`${base}-link`}>{section.type === "gifts" ? "Enlace a mesa de regalos" : "Enlace a mapa"}</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div>}
                    {section.type === "gallery" && <div className="editor-field"><label>Fotos de la galería</label><CloudinaryImageUpload eventId={event.id} images={section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : []} multiple imageUploads={imageUploads} onUpload={() => setImageUploads((count) => count + 1)} onChange={(images) => updateSection(section.id, { imageUrls: images, imageUrl: images[0] ?? "" })} /></div>}
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "story" || section.type === "custom") && <div className="editor-field"><label>Imagen de esta sección</label><CloudinaryImageUpload eventId={event.id} images={section.imageUrl ? [section.imageUrl] : []} multiple={false} imageUploads={imageUploads} onUpload={() => setImageUploads((count) => count + 1)} onChange={(images) => updateSection(section.id, { imageUrl: images[0] ?? "" })} /></div>}
                    {section.type === "rsvp" && <div className="editor-field"><label htmlFor={`${base}-link`}>Enlace de confirmación o WhatsApp</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://wa.me/…" /></div>}
                    {section.type === "music" && <div className="editor-field"><label htmlFor={`${base}-link`}>Enlace de canción o playlist</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div>}
                    {section.type === "custom" && <><div className="editor-field"><label htmlFor={`${base}-detail`}>Dato adicional <span>(opcional)</span></label><input id={`${base}-detail`} maxLength={240} value={section.detail} onChange={(e) => updateSection(section.id, { detail: e.target.value })} placeholder="Ej. Salón principal" /></div><div className="editor-field"><label htmlFor={`${base}-link`}>Enlace <span>(opcional)</span></label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div></>}
                  </div></details>
                </fieldset>;
              })}
            </div>
            <div className="editor-add-section"><label htmlFor="add-section">Agregar otro detalle</label><select id="add-section" value="" onChange={(e) => { const type = e.target.value as SectionType; if (type && sections.length < 12) setSections((current) => [...current, makeSection(type, crypto.randomUUID())]); e.currentTarget.value = ""; }}><option value="">Elige qué quieres agregar…</option>{sectionOptions.map((option) => <option key={option.type} value={option.type}>{option.title}</option>)}</select><small>Elige una opción para agregarla a tu invitación. Puedes incluir hasta 12.</small></div>
          </section>
          <div className="editor-form-actions">
            <p className={`editor-save-status${dirty ? " is-dirty" : ""}`} role="status" aria-live="polite">{busy ? "Guardando…" : dirty ? "Cambios sin guardar" : state || saved || published ? "Cambios guardados" : "Todo está al día"}</p>
            <button className={`button editor-save${isPublished ? " is-primary" : ""}`} type="submit" disabled={busy || !dirty}><FiSave /> {pending ? "Guardando…" : isPublished ? "Guardar cambios" : "Guardar borrador"}</button>
            {!isPublished && <button className="button editor-publish" type="submit" formAction={publishAction} disabled={busy}><FiEye /> {publishing ? "Guardando…" : event.paidAt ? "Revisar publicación" : `Pagar y publicar · ${invitationPriceLabel} MXN`}</button>}
            <p>{isPublished ? "Al guardar, los cambios se verán en tu enlace público." : "Puedes editar y previsualizar gratis. El enlace se habilita después de confirmar el pago."}</p>
          </div>
        </form>
      </section>
      <aside className="editor-preview-panel"><div className="editor-preview-title"><div><span>VISTA PREVIA</span><small>Se actualiza al editar</small></div><span className="preview-draft-chip">{isPublished ? <><FiCheck /> PUBLICADA</> : <><FiLock /> PRIVADA</>}</span></div>
        {!event.paidAt && <div className="editor-payment-notice"><FiLock /><div><strong>Pendiente de pago</strong><p>{invitationPriceLabel} MXN por evento · 12 meses activa. Tu enlace permanece privado hasta confirmar el pago.</p><Link href={`/dashboard/eventos/${event.id}/pago`}>Ver detalles del pago</Link></div></div>}
        <InvitationLivePreview expanded={previewExpanded} onClose={closePreview}><InvitationCanvas eventType={eventType} name={name} hostNames={hostNames} date={prettyDate} eventDateKey={eventDate} eventTime={eventTime} venue={venue} address={address} message={message} imageUrl={imageUrl} accent={accent} typography={typography} bodyTypography={bodyTypography} templateId={templateId} sections={sections} full /></InvitationLivePreview>
        <button className="editor-open-preview" type="button" onClick={() => setPreviewExpanded(true)}><FiEye /> Ver invitación completa</button>
        <p className="editor-preview-note">La vista previa incluye tus cambios actuales. Abrirla no guarda ni publica.</p>
        {isPublished && event.slug && <>
          <Link className="editor-public-invitation" href={invitationPath(event)!} target="_blank" rel="noopener noreferrer"><FiEye /> Abrir invitación pública ↗</Link>
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

function CloudinaryImageUpload({ eventId, images, multiple, imageUploads, onUpload, onChange }: {
  eventId: string;
  images: string[];
  multiple: boolean;
  imageUploads: number;
  onUpload: () => void;
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const maxImages = multiple ? Math.max(0, ACCOUNT_LIMITS.imagesPerInvitation - imageUploads) : 1;

  async function uploadFiles(files: File[]) {
    setError("");
    if (imageUploads >= ACCOUNT_LIMITS.imagesPerInvitation) {
      setError(`Ya usaste las ${ACCOUNT_LIMITS.imagesPerInvitation} imágenes disponibles para esta invitación.`);
      return;
    }
    const remaining = multiple ? Math.min(maxImages, ACCOUNT_LIMITS.imagesPerInvitation - images.length) : 1;
    if (remaining <= 0) {
      setError(imageUploads >= ACCOUNT_LIMITS.imagesPerInvitation ? `Ya se usaron las ${ACCOUNT_LIMITS.imagesPerInvitation} subidas permitidas para esta invitación.` : multiple ? "La galería ya tiene el máximo de fotos." : "Quita la imagen actual antes de subir otra.");
      return;
    }
    const selected = files.slice(0, remaining);
    if (files.length > remaining) setError(`Solo puedes agregar ${remaining} foto${remaining === 1 ? "" : "s"} más.`);
    const nextImages = multiple ? [...images] : [];
    setUploading(true);

    try {
      for (const file of selected) {
        if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
          throw new Error("Usa imágenes JPG, PNG, WebP o AVIF.");
        }
        if (file.size > ACCOUNT_LIMITS.imageSizeBytes) throw new Error(`Cada imagen debe pesar ${ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB o menos.`);
        const uploadForm = new FormData();
        uploadForm.set("file", file);
        uploadForm.set("eventId", eventId);
        const uploadResponse = await fetch("/api/cloudinary/upload", { method: "POST", body: uploadForm });
        const uploaded = await uploadResponse.json() as { secureUrl?: string; error?: string };
        if (!uploadResponse.ok || !uploaded.secureUrl) throw new Error(uploaded.error || "No pudimos subir esta imagen.");
        nextImages.push(uploaded.secureUrl);
        onChange(nextImages.slice(0, ACCOUNT_LIMITS.imagesPerInvitation));
        onUpload();
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
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
    <small className="image-upload-help">JPG, PNG, WebP o AVIF · máximo {ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB por imagen · {Math.max(0, ACCOUNT_LIMITS.imagesPerInvitation - imageUploads)} subidas disponibles</small>
    {error && <p className="image-upload-error" role="alert">{error}</p>}
    {images.length > 0 && <div className="image-upload-previews">{images.map((url, index) => <div className="image-upload-preview" key={`${url}-${index}`}>
      <Image src={url} alt={`Imagen ${index + 1}`} width={160} height={160} unoptimized />
      <button type="button" disabled={uploading} aria-label={`Quitar imagen ${index + 1}`} onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}><FiTrash2 /></button>
    </div>)}</div>}
  </div>;
}

function GalleryCarousel({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const safeIndex = images.length ? Math.min(activeIndex, images.length - 1) : 0;
  const change = (direction: -1 | 1) => setActiveIndex((safeIndex + direction + images.length) % images.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const ownerDocument = closeButtonRef.current?.ownerDocument ?? document;
    const previousOverflow = ownerDocument.body.style.overflow;
    ownerDocument.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft" && images.length > 1) setActiveIndex((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight" && images.length > 1) setActiveIndex((current) => (current + 1) % images.length);
    };
    ownerDocument.addEventListener("keydown", onKeyDown);
    return () => {
      ownerDocument.removeEventListener("keydown", onKeyDown);
      ownerDocument.body.style.overflow = previousOverflow;
      openButtonRef.current?.focus();
    };
  }, [lightboxOpen, images.length]);

  if (!images.length) return null;

  return <>
    <div className="invite-gallery-carousel" aria-label={`${title}: galería de fotos`}>
      <div className="invite-gallery-image-frame">
        <Image src={images[safeIndex]} alt={`${title}, foto ${safeIndex + 1} de ${images.length}`} fill sizes="(max-width: 760px) 100vw, 50vw" unoptimized />
      </div>
      <button ref={openButtonRef} className="invite-gallery-open" type="button" onClick={() => setLightboxOpen(true)}><FiEye /> Ver imagen completa</button>
      {images.length > 1 && <>
        <button className="invite-gallery-arrow is-previous" type="button" aria-label="Foto anterior" onClick={() => change(-1)}><FiChevronLeft /></button>
        <button className="invite-gallery-arrow is-next" type="button" aria-label="Foto siguiente" onClick={() => change(1)}><FiChevronRight /></button>
        <span className="invite-gallery-count">{safeIndex + 1} / {images.length}</span>
        <div className="invite-gallery-dots" aria-label="Selecciona una foto">{images.map((_, index) => <button key={index} type="button" aria-label={`Mostrar foto ${index + 1}`} aria-current={index === safeIndex} onClick={() => setActiveIndex(index)} />)}</div>
      </>}
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

export function InvitationCanvas({ eventType, name, hostNames, date, eventDateKey = "", eventTime = "", venue, address, message, imageUrl, accent, typography = "default", bodyTypography = "inter", templateId = "none", sections }: {
  eventType: string; name: string; hostNames: string; date: string; eventDateKey?: string; eventTime?: string; venue: string; address: string; message: string; imageUrl: string; accent: string; typography?: string; bodyTypography?: string; templateId?: string; sections: InviteSection[]; full?: boolean;
}) {
  return <InvitationWebsite eventType={eventType} name={name} hostNames={hostNames} date={date} eventDateKey={eventDateKey} eventTime={eventTime} venue={venue} address={address} message={message} imageUrl={imageUrl} accent={accent} typography={typography} bodyTypography={bodyTypography} templateId={templateId} sections={sections} />;
}

function InvitationWebsite({ eventType, name, hostNames, date, eventDateKey, eventTime, venue, address, message, imageUrl, accent, typography = "default", bodyTypography = "inter", templateId = "none", sections }: {
  eventType: string; name: string; hostNames: string; date: string; eventDateKey: string; eventTime: string; venue: string; address: string; message: string; imageUrl: string; accent: string; typography?: string; bodyTypography?: string; templateId?: string; sections: InviteSection[];
}) {
  const visibleSections = sections.filter((section) => section.enabled && (section.content || section.detail || section.link || section.imageUrl || section.imageUrls?.length));
  const dressCode = visibleSections.find((section) => section.type === "dress_code");
  const confirmation = visibleSections.find((section) => section.type === "rsvp");
  const pairedSections = dressCode && confirmation ? visibleSections.filter((section) => section.id === dressCode.id || section.id === confirmation.id) : [];
  const template = getInvitationTemplate(eventType, templateId);
  const title = hostNames || name || "Una celebración especial";
  const dateAndTime = eventTime ? `${date} · ${formatEventTime(eventTime)}` : date;
  return <article className={`invite-website${eventType === "wedding" ? " invite-wedding-editorial" : ""}`} data-typography={typography} data-body-typography={bodyTypography} data-has-flower={template?.assets.flower ? "true" : undefined} data-has-separator={template?.assets.separator ? "true" : undefined} data-decorated={template ? "true" : undefined} data-template={template ? `${eventType}-${template.id}` : undefined} style={{ "--invite-accent": accent, "--invite-heading-font": getInvitationFont(typography).family, "--invite-body-font": getInvitationFont(bodyTypography).family, "--template-top-right": template?.assets.topRight ? `url("${template.assets.topRight}")` : "none", "--template-bottom-left": template?.assets.bottomLeft ? `url("${template.assets.bottomLeft}")` : "none", "--template-top-left": template?.assets.topLeft ? `url("${template.assets.topLeft}")` : "none", "--template-bottom-right": template?.assets.bottomRight ? `url("${template.assets.bottomRight}")` : "none", "--template-separator": template?.assets.separator ? `url("${template.assets.separator}")` : "none", "--template-decoration": template?.assets.decoration ? `url("${template.assets.decoration}")` : "none", "--template-flower": template?.assets.flower ? `url("${template.assets.flower}")` : "none" } as React.CSSProperties}>
    <section className={`invite-website-hero${imageUrl ? " has-cover-image" : ""}`} style={imageUrl ? { backgroundImage: `linear-gradient(90deg,#10100fd9 0%,#10100f66 58%,#10100f12 100%),url("${imageUrl.replaceAll('"', '')}")` } : undefined}>
      <div className="invite-hero-glow" aria-hidden="true" />
      <div className="invite-hero-content"><span className="invite-hero-kicker">{eventType === "wedding" ? "NOS CASAMOS" : "UNA FECHA · UN RECUERDO · UNA CELEBRACIÓN"}</span><span className="invite-hero-rule" /><p className="invite-hero-intro">Con mucha ilusión te invitamos a celebrar</p><h1>{title}</h1><p className="invite-hero-event-name">{name || eventLabels[eventType] || "Un día muy especial"}</p><div className="invite-hero-date"><FiCalendar /> {dateAndTime}</div><a className="invite-hero-button" href="#invite-details">Acompáñanos <FiArrowDown /></a></div>
      <div className="invite-hero-side-note"><span>ESTÁS INVITADO</span><i>✦</i><span>CON CARIÑO</span></div>
    </section>
    <section className="invite-welcome" id="invite-details">{template && <InvitationDecoration template={template} />}<span className="invite-section-kicker">NOS ENCANTARÍA COMPARTIRLO CONTIGO</span><span className="invite-ornament">✦</span><h2>{eventType === "wedding" ? "Bienvenidos" : "Un momento para celebrar"}</h2><p>{message || "Hay días que se vuelven inolvidables cuando los compartimos con las personas que queremos. Nos encantará contar contigo."}</p><strong>{title}</strong></section>
    {(venue || address) && <section className="invite-main-location"><div className="invite-location-photo" style={imageUrl ? { backgroundImage: `url("${imageUrl.replaceAll('"', '')}")` } : undefined}><span className="invite-photo-caption">EL LUGAR DE NUESTRO ENCUENTRO</span></div><div className="invite-location-main-copy"><span className="invite-section-kicker">GUARDA LA FECHA</span><h2>{venue || "El lugar de la celebración"}</h2><p className="invite-location-address">{address || "Pronto compartiremos la ubicación"}</p><span className="invite-static-link"><FiMapPin /> Ver ubicación al publicar</span></div></section>}
    {visibleSections.length > 0 && <section className="invite-extra-sections">{visibleSections.map((section, index) => {
      if (pairedSections.some((paired) => paired.id === section.id)) {
        if (section.id !== pairedSections[0].id) return null;
        return <div className="invite-practical-details" key={section.id}>{pairedSections.map((paired) => <InviteWebsiteSection key={paired.id} section={paired} index={visibleSections.indexOf(paired)} decoration={sectionDecoration(template, paired.type)} />)}</div>;
      }
      return <InviteWebsiteSection key={section.id} section={section} index={index} decoration={sectionDecoration(template, section.type)} />;
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

function InviteWebsiteSection({ section, index = 0, decoration }: { section: InviteSection; index?: number; decoration?: string }) {
  const isGallery = section.type === "gallery";
  const isRsvp = section.type === "rsvp";
  const isGift = section.type === "gifts";
  const galleryImages = section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : [];
  return <section data-has-section-decoration={decoration ? "true" : undefined} className={`invite-content-block invite-content-${section.type}${index % 2 ? " invite-content-offset" : ""}${section.imageUrl || galleryImages.length ? " has-section-image" : ""}`}>
    {decoration && <span className="invite-section-decoration" aria-hidden="true"><Image src={decoration} alt="" fill sizes="(max-width: 760px) 48px, 90px" unoptimized /></span>}
    {isGallery && galleryImages.length > 0 ? <div className="invite-content-image invite-gallery-feature"><GalleryCarousel images={galleryImages} title={section.title} /></div> : section.imageUrl && <div className="invite-content-image" style={{ backgroundImage: `url("${section.imageUrl.replaceAll('"', '')}")` }} role="img" aria-label={section.title} />}
      <div className="invite-content-copy"><span className="invite-content-icon">{sectionIcon(section.type)}</span><span className="invite-section-kicker">{section.type === "story" ? "NUESTRA HISTORIA" : section.type === "ceremony" ? "CEREMONIA" : section.type === "reception" ? "RECEPCIÓN" : section.type === "program" ? "HORARIOS Y ACTIVIDADES" : section.type === "parents" ? "CON LA BENDICIÓN DE" : section.type === "dress_code" ? "CÓDIGO DE VESTIMENTA" : section.type === "rsvp" ? "CONFIRMACIÓN" : section.type === "gifts" ? "MESA DE REGALOS" : section.type === "gallery" ? "NUESTROS MOMENTOS" : section.type === "music" ? "NUESTRA CANCIÓN" : "UN DETALLE ESPECIAL"}</span><h2>{section.title}</h2>{section.detail && <p className="invite-content-detail">{section.detail}</p>}{section.type === "program" && <ol className="invite-program-list">{section.content.split("\n").map(parseProgramEntry).filter((entry) => entry.description).map((entry, index) => <li key={entry.id}><span className={entry.time ? "invite-program-time" : "invite-program-index"}>{entry.time || String(index + 1).padStart(2, "0")}</span><div className="invite-program-copy"><i aria-hidden="true" /><p>{entry.description}</p></div></li>)}</ol>}{section.type === "parents" && <ul className="invite-parents-list">{section.content.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => <li key={line}>{line}</li>)}</ul>}{section.content && section.type !== "program" && section.type !== "parents" && <p className="invite-content-body">{section.content}</p>}
      {(section.link || isRsvp || isGift) && <span className="invite-static-link">{isRsvp ? "Confirmar asistencia al publicar" : isGift ? "Consultar mesa de regalos al publicar" : isGallery ? "Ver galería" : section.type === "music" ? "Escuchar al publicar" : "Abrir mapa al publicar"} <FiArrowDown /></span>}
    </div>
  </section>;
}
