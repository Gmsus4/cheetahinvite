"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { FiArrowDown, FiArrowLeft, FiArrowUp, FiCalendar, FiCheck, FiChevronLeft, FiChevronRight, FiClock, FiEye, FiGift, FiHeart, FiImage, FiLock, FiMapPin, FiMusic, FiPlus, FiSave, FiTag, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { publishEvent, saveEventForPreview, updateEvent } from "@/app/dashboard/eventos/[id]/actions";

type EventData = {
  id: string; name: string; eventType: string; eventDate: Date | null; hostNames: string | null; status: "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED"; slug: string | null;
  venue: string | null; address: string | null; message: string | null; imageUrl: string | null; accent: string; sections: unknown;
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
  { type: "gallery", title: "Galería", description: "Sube hasta 12 fotos para mostrar en un carrusel." },
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
  const [eventType, setEventType] = useState(event.eventType);
  const [eventDate, setEventDate] = useState(dateInputValue(event.eventDate));
  const [hostNames, setHostNames] = useState(event.hostNames ?? "");
  const [venue, setVenue] = useState(event.venue ?? "");
  const [address, setAddress] = useState(event.address ?? "");
  const [message, setMessage] = useState(event.message ?? "");
  const [imageUrl, setImageUrl] = useState(event.imageUrl ?? "");
  const [accent, setAccent] = useState(event.accent || "#E9560A");
  const [sections, setSections] = useState<InviteSection[]>(() => {
    if (Array.isArray(event.sections)) return event.sections as InviteSection[];
    return ["story", "ceremony", "reception", "dress_code", "gifts", "rsvp"].map((type) => makeSection(type as SectionType));
  });
  const save = updateEvent.bind(null, event.id);
  const saveAndPreview = saveEventForPreview.bind(null, event.id);
  const publish = publishEvent.bind(null, event.id);
  const [state, formAction, pending] = useActionState(async (_: string, formData: FormData) => {
    await save(formData);
    return "";
  }, "");

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
      <Link className="brand editor-brand" href="/dashboard"><Image src="/cheetah-mascot.png" alt="" width={34} height={38} /><span className="brand-name">Cheetah<span>Invite</span></span></Link>
      <Link className="editor-back" href="/dashboard"><FiArrowLeft /> Volver a mis eventos</Link>
    </header>
    <div className="editor-layout">
      <section className="editor-form-panel">
        <div className="editor-heading"><p className="dashboard-eyebrow">PERSONALIZA TU CELEBRACIÓN</p><h1>Edita tu invitación</h1><p>Diseña cada detalle y revisa cómo se verá para tus invitados.</p><div className="editor-draft-reminder"><FiLock /> Privada mientras sea borrador</div></div>
        {(saved || published || state) && <p className="editor-success" role="status"><FiCheck /> {published ? "Tu invitación ya está publicada y lista para compartir." : "Cambios guardados correctamente."}</p>}
        {error && <p className="editor-error" role="alert">{error === "imagen" ? "Usa una URL válida que comience con http:// o https://." : "Revisa los campos e inténtalo de nuevo."}</p>}
        <form id="event-editor-form" action={formAction} className="editor-form">
          <input type="hidden" name="sections" value={JSON.stringify(sections)} />
          <div className="editor-field"><label htmlFor="event-name">Nombre del evento</label><input id="event-name" name="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="editor-field"><label htmlFor="event-type">Tipo de evento</label><select id="event-type" name="eventType" value={eventType} onChange={e => setEventType(e.target.value)}><option value="wedding">Boda</option><option value="birthday">Cumpleaños</option><option value="graduation">Graduación</option><option value="baby_shower">Baby shower</option><option value="anniversary">Aniversario</option><option value="other">Otro evento</option></select></div>
          <div className="editor-field"><label htmlFor="event-date">Fecha y hora</label><div className="editor-input-icon"><FiCalendar /><input id="event-date" name="eventDate" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div></div>
          <div className="editor-field"><label htmlFor="host-names">Anfitriones o festejados</label><input id="host-names" name="hostNames" placeholder="Ej. Mariana y Andrés" maxLength={120} value={hostNames} onChange={e => setHostNames(e.target.value)} /></div>
          <div className="editor-field"><label htmlFor="venue">Lugar</label><input id="venue" name="venue" placeholder="Ej. Jardín Los Olivos" maxLength={160} value={venue} onChange={e => setVenue(e.target.value)} /></div>
          <div className="editor-field"><label htmlFor="address">Dirección</label><input id="address" name="address" placeholder="Calle, ciudad" maxLength={240} value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="editor-field"><label htmlFor="message">Mensaje para tus invitados</label><textarea id="message" name="message" rows={4} maxLength={1200} placeholder="Nos encantará compartir este día contigo…" value={message} onChange={e => setMessage(e.target.value)} /></div>
          <div className="editor-field"><label>Imagen de portada</label><input type="hidden" name="imageUrl" value={imageUrl} /><CloudinaryImageUpload eventId={event.id} images={imageUrl ? [imageUrl] : []} multiple={false} onChange={(images) => setImageUrl(images[0] ?? "")} /></div>
          <div className="editor-field editor-color-field"><label htmlFor="accent">Color de acento</label><div><input id="accent" name="accent" type="color" value={accent} onChange={e => setAccent(e.target.value)} /><span>{accent.toUpperCase()}</span></div></div>
          <div className="editor-sections-field">
            <div className="editor-sections-heading"><div><h2>Secciones de tu invitación</h2><p>Elige qué mostrar y organiza el orden de la página.</p></div><span>{sections.filter((section) => section.enabled).length} visibles</span></div>
            <div className="editor-section-list">
              {sections.map((section, index) => {
                const option = sectionOptions.find((item) => item.type === section.type)!;
                const base = `section-${section.id}`;
                return <fieldset className={`editor-section-card${section.enabled ? " is-enabled" : " is-disabled"}`} key={section.id}>
                  <div className="editor-section-card-head">
                    <label className="editor-section-toggle"><input type="checkbox" checked={section.enabled} onChange={(e) => updateSection(section.id, { enabled: e.target.checked })} /><span className="editor-section-icon">{sectionIcon(section.type)}</span><span className="editor-section-toggle-copy"><strong>{section.title || option.title}</strong><small>{option.description}</small></span></label>
                    <div className="editor-section-actions"><button type="button" aria-label="Mover sección arriba" disabled={index === 0} onClick={() => moveSection(index, -1)}><FiArrowUp /></button><button type="button" aria-label="Mover sección abajo" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)}><FiArrowDown /></button><button type="button" aria-label="Eliminar sección" onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}><FiTrash2 /></button></div>
                  </div>
                  <div className="editor-section-fields">
                    <div className="editor-field"><label htmlFor={`${base}-title`}>Título</label><input id={`${base}-title`} value={section.title} maxLength={100} onChange={(e) => updateSection(section.id, { title: e.target.value })} /></div>
                    <div className="editor-field"><label htmlFor={`${base}-content`}>{section.type === "dress_code" ? "Indicaciones" : section.type === "rsvp" ? "Instrucciones" : section.type === "gifts" ? "Mensaje" : section.type === "program" ? "Horario y actividad (un momento por renglón)" : section.type === "parents" ? "Nombres (una pareja o persona por renglón)" : "Descripción"}</label><textarea id={`${base}-content`} rows={section.type === "program" || section.type === "parents" ? 5 : 3} maxLength={2000} value={section.content} onChange={(e) => updateSection(section.id, { content: e.target.value })} placeholder={section.type === "program" ? "5:30 p. m. — Recepción de invitados\n6:00 p. m. — Ceremonia\n7:00 p. m. — Cóctel" : section.type === "parents" ? "Ej. Joaquín Reyes y Patricia Fuentes\nRodrigo Navarro y Lucía Cortés" : "Escribe aquí la información para tus invitados…"} /></div>
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "gallery") && <div className="editor-field"><label htmlFor={`${base}-detail`}>{section.type === "gallery" ? "Texto de apoyo" : "Fecha u horario"}</label><input id={`${base}-detail`} maxLength={240} value={section.detail} onChange={(e) => updateSection(section.id, { detail: e.target.value })} placeholder={section.type === "gallery" ? "Momentos que queremos recordar" : "Ej. 5:00 p. m."} /></div>}
                    {(section.type === "ceremony" || section.type === "reception" || section.type === "gifts") && <div className="editor-field"><label htmlFor={`${base}-link`}>{section.type === "gifts" ? "Enlace a mesa de regalos" : "Enlace a mapa"}</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div>}
                    {section.type === "gallery" && <div className="editor-field"><label>Fotos de la galería</label><CloudinaryImageUpload eventId={event.id} images={section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : []} multiple onChange={(images) => updateSection(section.id, { imageUrls: images, imageUrl: images[0] ?? "" })} /></div>}
                    {(section.type === "ceremony" || section.type === "reception") && <div className="editor-field"><label>Imagen de esta sección</label><CloudinaryImageUpload eventId={event.id} images={section.imageUrl ? [section.imageUrl] : []} multiple={false} onChange={(images) => updateSection(section.id, { imageUrl: images[0] ?? "" })} /></div>}
                    {section.type === "rsvp" && <div className="editor-field"><label htmlFor={`${base}-link`}>Enlace de confirmación o WhatsApp</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://wa.me/…" /></div>}
                    {section.type === "music" && <div className="editor-field"><label htmlFor={`${base}-link`}>Enlace de canción o playlist</label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div>}
                    {section.type === "custom" && <><div className="editor-field"><label htmlFor={`${base}-detail`}>Dato adicional <span>(opcional)</span></label><input id={`${base}-detail`} maxLength={240} value={section.detail} onChange={(e) => updateSection(section.id, { detail: e.target.value })} placeholder="Ej. Salón principal" /></div><div className="editor-field"><label htmlFor={`${base}-link`}>Enlace <span>(opcional)</span></label><input id={`${base}-link`} type="url" value={section.link} onChange={(e) => updateSection(section.id, { link: e.target.value })} placeholder="https://…" /></div></>}
                  </div>
                </fieldset>;
              })}
            </div>
            <div className="editor-add-section"><label htmlFor="add-section">Agregar una sección</label><select id="add-section" value="" onChange={(e) => { const type = e.target.value as SectionType; if (type && sections.length < 12) setSections((current) => [...current, makeSection(type, crypto.randomUUID())]); e.currentTarget.value = ""; }}><option value="">Selecciona un bloque…</option>{sectionOptions.map((option) => <option key={option.type} value={option.type}>{option.title}</option>)}</select><small>Puedes agregar hasta 12 secciones y cambiar su orden.</small></div>
          </div>
          <button className="button editor-save" type="submit" disabled={pending}><FiSave /> {pending ? "Guardando…" : "Guardar borrador"}</button>
          <button className="button editor-publish" type="submit" formAction={publish}><FiEye /> {event.status === "PUBLISHED" ? "Guardar cambios y publicar" : "Publicar invitación"}</button>
        </form>
      </section>
      <aside className="editor-preview-panel"><div className="editor-preview-title"><div><span>VISTA PREVIA</span><small>Se actualiza al editar</small></div><span className="preview-draft-chip">{event.status === "PUBLISHED" ? <><FiCheck /> PUBLICADA</> : <><FiLock /> PRIVADA</>}</span></div>
        <InvitationCanvas eventType={eventType} name={name} hostNames={hostNames} date={prettyDate} venue={venue} address={address} message={message} imageUrl={imageUrl} accent={accent} sections={sections} />
        <button className="editor-open-preview" type="submit" form="event-editor-form" formAction={saveAndPreview}><FiEye /> Guardar y ver invitación completa</button>
        <p className="editor-preview-note">{event.status === "PUBLISHED" ? <><FiCheck /> Guardaremos tus cambios y podrás ver la versión actualizada de tu enlace público.</> : <><FiLock /> Guardaremos tus cambios y abriremos la vista privada. No tiene un enlace público.</>}</p>
      </aside>
    </div>
  </main>;
}

function CloudinaryImageUpload({ eventId, images, multiple, onChange }: {
  eventId: string;
  images: string[];
  multiple: boolean;
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const maxImages = multiple ? 12 : 1;

  async function uploadFiles(files: File[]) {
    setError("");
    const remaining = multiple ? maxImages - images.length : 1;
    if (remaining <= 0) {
      setError(multiple ? "La galería ya tiene el máximo de 12 fotos." : "Quita la imagen actual antes de subir otra.");
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
        if (file.size > 10 * 1024 * 1024) throw new Error("Cada imagen debe pesar 10 MB o menos.");

        const signingResponse = await fetch("/api/cloudinary/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        const signing = await signingResponse.json() as {
          cloudName?: string; apiKey?: string; timestamp?: number; folder?: string; publicId?: string; uploadPreset?: string; signature?: string; error?: string;
        };
        if (!signingResponse.ok || !signing.cloudName || !signing.apiKey || !signing.timestamp || !signing.folder || !signing.publicId || !signing.uploadPreset || !signing.signature) {
          throw new Error(signing.error || "No pudimos preparar la subida.");
        }

        const form = new FormData();
        form.set("file", file);
        form.set("api_key", signing.apiKey);
        form.set("timestamp", String(signing.timestamp));
        form.set("folder", signing.folder);
        form.set("public_id", signing.publicId);
        form.set("upload_preset", signing.uploadPreset);
        form.set("signature", signing.signature);
        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signing.cloudName)}/image/upload`, { method: "POST", body: form });
        const uploaded = await uploadResponse.json() as { secure_url?: string; error?: { message?: string } };
        if (!uploadResponse.ok || !uploaded.secure_url) throw new Error(uploaded.error?.message || "Cloudinary no pudo subir esta imagen.");
        nextImages.push(uploaded.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/"));
        onChange(nextImages.slice(0, maxImages));
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
    <small className="image-upload-help">JPG, PNG, WebP o AVIF · máximo 10 MB{multiple ? ` por foto · ${images.length}/12 fotos` : ""}</small>
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft" && images.length > 1) setActiveIndex((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight" && images.length > 1) setActiveIndex((current) => (current + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
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

export function InvitationCanvas({ eventType, name, hostNames, date, venue, address, message, imageUrl, accent, sections, full = false }: {
  eventType: string; name: string; hostNames: string; date: string; venue: string; address: string; message: string; imageUrl: string; accent: string; sections: InviteSection[]; full?: boolean;
}) {
  if (full) return <InvitationWebsite eventType={eventType} name={name} hostNames={hostNames} date={date} venue={venue} address={address} message={message} imageUrl={imageUrl} accent={accent} sections={sections} />;
  const visibleSections = sections.filter((section) => section.enabled && (section.content || section.detail || section.link || section.imageUrl || section.imageUrls?.length));
  return <article className={`invitation-preview${full ? " invitation-preview-full" : ""}`} style={{ "--preview-accent": accent } as React.CSSProperties}>
    <div className="invitation-preview-cover" style={imageUrl ? { backgroundImage: `linear-gradient(180deg, #0b13201a, #0b132099), url("${imageUrl.replaceAll('"', '')}")` } : undefined}>
      {!imageUrl && <span className="preview-cover-mark">✦</span>}
      <span className="preview-type">{eventLabels[eventType] ?? "Una celebración"}</span>
      <div className="preview-cover-title"><span>TE INVITAMOS A CELEBRAR</span><h2>{hostNames || name || "Tus nombres aquí"}</h2><p>{date}</p></div>
    </div>
    <div className="invitation-preview-copy"><span className="preview-overline">UN DÍA PARA RECORDAR</span><h2>{hostNames || "Tus nombres aquí"}</h2><p className="preview-name">{name || "Una celebración especial"}</p><span className="preview-divider" />
      <p className="preview-date"><FiCalendar /> {date}</p>{venue && <p className="preview-place"><FiMapPin /> {venue}</p>}{address && <p className="preview-address">{address}</p>}
      {message && <blockquote>{message}</blockquote>}
    </div>
    {visibleSections.map((section) => <div className={`invitation-preview-section preview-section-${section.type}`} key={section.id}>
      {section.imageUrl && <div className="preview-section-image" style={{ backgroundImage: `url("${section.imageUrl.replaceAll('"', '')}")` }} />}
      <span className="preview-section-mark">{sectionIcon(section.type)}</span><h3>{section.title || "Tu sección"}</h3>{section.detail && <p className="preview-section-detail">{section.detail}</p>}{section.content && <p>{section.content}</p>}{section.link && <span className="preview-section-link">{section.type === "rsvp" ? "Confirmar asistencia" : section.type === "gifts" ? "Ver mesa de regalos" : section.type === "music" ? "Escuchar música" : "Ver ubicación"}</span>}
    </div>)}
    <footer className="invitation-preview-signoff"><span>CON CARIÑO</span><strong>{hostNames || name || "Nos encantará verte"}</strong><i>✦</i></footer>
  </article>;
}

function InvitationWebsite({ eventType, name, hostNames, date, venue, address, message, imageUrl, accent, sections }: {
  eventType: string; name: string; hostNames: string; date: string; venue: string; address: string; message: string; imageUrl: string; accent: string; sections: InviteSection[];
}) {
  const visibleSections = sections.filter((section) => section.enabled && (section.content || section.detail || section.link || section.imageUrl || section.imageUrls?.length));
  const title = hostNames || name || "Una celebración especial";
  return <article className="invite-website" style={{ "--invite-accent": accent } as React.CSSProperties}>
    <nav className="invite-website-nav"><span className="invite-nav-monogram">{title.trim().charAt(0).toUpperCase()}</span><span>{eventLabels[eventType] ?? "Invitación especial"}</span><a href="#invite-details" aria-label="Ir a los detalles"><FiArrowDown /></a></nav>
    <section className={`invite-website-hero${imageUrl ? " has-cover-image" : ""}`} style={imageUrl ? { backgroundImage: `linear-gradient(90deg,#10100fd9 0%,#10100f66 58%,#10100f12 100%),url("${imageUrl.replaceAll('"', '')}")` } : undefined}>
      <div className="invite-hero-glow" aria-hidden="true" />
      <div className="invite-hero-content"><span className="invite-hero-kicker">UNA FECHA · UN RECUERDO · UNA CELEBRACIÓN</span><span className="invite-hero-rule" /><p className="invite-hero-intro">Con mucha ilusión te invitamos a celebrar</p><h1>{title}</h1><p className="invite-hero-event-name">{name || eventLabels[eventType] || "Un día muy especial"}</p><div className="invite-hero-date"><FiCalendar /> {date}</div><a className="invite-hero-button" href="#invite-details">Descubre la invitación <FiArrowDown /></a></div>
      <div className="invite-hero-side-note"><span>ESTÁS INVITADO</span><i>✦</i><span>CON CARIÑO</span></div>
    </section>
    <section className="invite-welcome" id="invite-details"><span className="invite-section-kicker">NOS ENCANTARÍA COMPARTIRLO CONTIGO</span><span className="invite-ornament">✦</span><h2>Un momento para celebrar</h2><p>{message || "Hay días que se vuelven inolvidables cuando los compartimos con las personas que queremos. Nos encantará contar contigo."}</p><strong>{title}</strong></section>
    {(venue || address) && <section className="invite-main-location"><div className="invite-location-photo" style={imageUrl ? { backgroundImage: `url("${imageUrl.replaceAll('"', '')}")` } : undefined}><span className="invite-photo-caption">EL LUGAR DE NUESTRO ENCUENTRO</span></div><div className="invite-location-main-copy"><span className="invite-section-kicker">GUARDA LA FECHA</span><h2>{venue || "El lugar de la celebración"}</h2><p className="invite-location-address">{address || "Pronto compartiremos la ubicación"}</p><span className="invite-static-link"><FiMapPin /> Ver ubicación al publicar</span></div></section>}
    {visibleSections.length > 0 && <section className="invite-extra-sections">{visibleSections.map((section, index) => <InviteWebsiteSection key={section.id} section={section} index={index} />)}</section>}
    <section className="invite-countdown-panel"><span className="invite-section-kicker">RESERVA LA FECHA</span><h2>{date}</h2><p>Nos encantará celebrar contigo</p><span className="invite-countdown-decoration">✦</span></section>
    <footer className="invite-website-footer"><span className="invite-footer-ornament">✦</span><p>Gracias por ser parte de este momento</p><strong>{title}</strong><small>HECHO CON CARIÑO PARA CELEBRAR</small></footer>
  </article>;
}

function InviteWebsiteSection({ section, index = 0 }: { section: InviteSection; index?: number }) {
  const isGallery = section.type === "gallery";
  const isRsvp = section.type === "rsvp";
  const isGift = section.type === "gifts";
  const galleryImages = section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : [];
  return <section className={`invite-content-block invite-content-${section.type}${index % 2 ? " invite-content-offset" : ""}`}>
    {isGallery && galleryImages.length > 0 ? <div className="invite-content-image invite-gallery-feature"><GalleryCarousel images={galleryImages} title={section.title} /></div> : section.imageUrl && <div className="invite-content-image" style={{ backgroundImage: `url("${section.imageUrl.replaceAll('"', '')}")` }} role="img" aria-label={section.title} />}
      <div className="invite-content-copy"><span className="invite-content-icon">{sectionIcon(section.type)}</span><span className="invite-section-kicker">{section.type === "ceremony" ? "CEREMONIA" : section.type === "reception" ? "RECEPCIÓN" : section.type === "program" ? "HORARIOS Y ACTIVIDADES" : section.type === "parents" ? "CON LA BENDICIÓN DE" : section.type === "dress_code" ? "CÓDIGO DE VESTIMENTA" : section.type === "rsvp" ? "CONFIRMACIÓN" : section.type === "gifts" ? "MESA DE REGALOS" : section.type === "gallery" ? "NUESTROS MOMENTOS" : section.type === "music" ? "NUESTRA CANCIÓN" : "UN DETALLE ESPECIAL"}</span><h2>{section.title}</h2>{section.detail && <p className="invite-content-detail">{section.detail}</p>}{section.type === "program" && <ol className="invite-program-list">{section.content.split("\n").map(parseProgramEntry).filter((entry) => entry.description).map((entry, index) => <li key={entry.id}><span className={entry.time ? "invite-program-time" : "invite-program-index"}>{entry.time || String(index + 1).padStart(2, "0")}</span><div className="invite-program-copy"><i aria-hidden="true" /><p>{entry.description}</p></div></li>)}</ol>}{section.type === "parents" && <ul className="invite-parents-list">{section.content.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => <li key={line}>{line}</li>)}</ul>}{section.content && section.type !== "program" && section.type !== "parents" && <p className="invite-content-body">{section.content}</p>}
      {(section.link || isRsvp || isGift) && <span className="invite-static-link">{isRsvp ? "Confirmar asistencia al publicar" : isGift ? "Consultar mesa de regalos al publicar" : isGallery ? "Ver galería" : section.type === "music" ? "Escuchar al publicar" : "Abrir mapa al publicar"} <FiArrowDown /></span>}
    </div>
  </section>;
}
