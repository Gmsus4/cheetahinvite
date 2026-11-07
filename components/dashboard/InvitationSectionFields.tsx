"use client";

import type { ReactNode } from "react";
import type { InviteSection, InvitationPanelStyle } from "@/lib/invitation-editor";
import { CloudinaryImageUpload } from "./CloudinaryImageUpload";

type SectionFieldsProps = { globalPanelStyle?: InvitationPanelStyle; section: InviteSection; onChange(changes: Partial<InviteSection>): void; uploadProps: { eventId: string; ensureEvent?: () => Promise<string>; onBusyChange(active: boolean): void }; allowSectionPhoto?: boolean };

function Field({ label, id, help, wide, children }: { label: string; id: string; help?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`guided-field${wide ? " guided-wide" : ""}`} data-preview-field={id} data-preview-label={label}><label htmlFor={id}>{label}</label>{children}{help && <small>{help}</small>}</div>;
}

export function SectionFields({ section, onChange, uploadProps, allowSectionPhoto = false, globalPanelStyle = "auto" }: SectionFieldsProps) {
  const prefix = section.id;
  const surfaceLocked = globalPanelStyle !== "auto";
  const surfaceControl = allowSectionPhoto && <fieldset className="guided-section-surface"><legend>Fondo de esta sección</legend><div role="group" aria-label={`Fondo de ${section.title}`}>{([['auto', 'Auto'], ['blur', 'Blur'], ['blur-color', 'BlurColor'], ['color', 'Color']] as const).map(([value, label]) => <button key={value} type="button" disabled={surfaceLocked} aria-pressed={(surfaceLocked ? globalPanelStyle : section.panelStyle ?? 'auto') === value} onClick={() => { if (!surfaceLocked) onChange({ panelStyle: value }); }}>{label}</button>)}</div><small>{surfaceLocked ? 'Para modificar el fondo de una sección específica, selecciona «Por defecto» en los ajustes de apariencia.' : 'Auto alterna los tres acabados durante el recorrido.'}</small></fieldset>;
  if (section.type === "gallery") return <><Field label="Título de la sección" id={`${prefix}-title`}><input id={`${prefix}-title`} value={section.title} maxLength={120} onChange={e => onChange({ title: e.target.value })} /></Field><div className="guided-section-media">{surfaceControl}</div><SectionPhotoFields section={section} onChange={onChange} uploadProps={uploadProps} /></>;
  return <>
    <Field label="Título de la sección" id={`${prefix}-title`}><input id={`${prefix}-title`} value={section.title} maxLength={120} onChange={e => onChange({ title: e.target.value })} /></Field>
    {section.type === "rsvp" && <Field label="¿Cómo quieres recibir las respuestas?" id={`${prefix}-mode`}><select id={`${prefix}-mode`} value={section.rsvpMode ?? "external"} onChange={e => onChange({ rsvpMode: e.target.value as "integrated" | "external" })}><option value="integrated">Aquí mismo, en la invitación</option><option value="external">En WhatsApp u otro enlace</option></select></Field>}
    <Field label={({ story: "Cuenta la historia de tu celebración", ceremony: "Nombre del lugar de la ceremonia", reception: "Nombre del lugar de la recepción", program: "Horario y actividad, un momento por renglón", parents: "Nombres de las personas que quieres mencionar", dress_code: "¿Cómo deben vestir tus invitados?", gifts: "Mensaje sobre los regalos", rsvp: "Mensaje de confirmación (opcional)", music: "Mensaje para la playlist", custom: "Información adicional" } as Record<string, string>)[section.type]} id={`${prefix}-content`} help={section.type === "program" ? "Ejemplo: 17:00 — Ceremonia. Escribe únicamente los horarios reales de tu evento." : undefined}><textarea id={`${prefix}-content`} rows={section.type === "program" ? 5 : 3} value={section.content} maxLength={2000} placeholder={({ story: "Todo empezó cuando…", ceremony: "Ej. Parroquia San José", reception: "Ej. Jardín Las Rosas", dress_code: "Ej. Casual, con calzado cómodo.", gifts: "Tu compañía es nuestro mejor regalo…" } as Record<string, string>)[section.type]} onChange={e => onChange({ content: e.target.value })} /></Field>
    {(section.type === "ceremony" || section.type === "reception") && <><Field label="Horario" id={`${prefix}-time`}><input id={`${prefix}-time`} value={section.detail} maxLength={240} placeholder="Ej. 5:00 p. m." onChange={e => onChange({ detail: e.target.value })} /></Field><Field label="Dirección o enlace de Google Maps" id={`${prefix}-map`}><input id={`${prefix}-map`} value={section.link} maxLength={500} placeholder="Calle, número y ciudad, o enlace de Maps" onChange={e => onChange({ link: e.target.value })} /></Field></>}
    {(section.type === "gifts" || section.type === "music" || section.type === "custom" || (section.type === "rsvp" && section.rsvpMode === "external")) && <Field label={section.type === "gifts" ? "Enlace a la mesa de regalos (opcional)" : section.type === "music" ? "Enlace a la playlist" : section.type === "custom" ? "Enlace adicional (opcional)" : "Enlace de WhatsApp o confirmación"} id={`${prefix}-link`} help={section.type === "rsvp" ? "Por ejemplo: https://wa.me/521 seguido de tu número." : undefined}><input id={`${prefix}-link`} type="url" maxLength={500} value={section.link} placeholder="https://…" onChange={e => onChange({ link: e.target.value })} /></Field>}
    {allowSectionPhoto && <section className="guided-section-media" aria-label="Fotografía y acabado de esta sección">{surfaceControl}<SectionPhotoFields section={section} onChange={onChange} uploadProps={uploadProps} /></section>}
  </>;
}

export function SectionPhotoFields({ section, onChange, uploadProps }: Pick<SectionFieldsProps, "section" | "onChange" | "uploadProps">) {
  if (section.type === "gallery") return <CloudinaryImageUpload {...uploadProps} multiple images={section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : []} onChange={imageUrls => onChange({ imageUrls, imageUrl: imageUrls[0] ?? "" })} />;
  return <div className="guided-section-photo" data-preview-field={`${section.id}-photo`} data-preview-label={`Foto de ${section.title}`}>
    <h3>Foto junto a esta sección <span>Opcional</span></h3>
    <p>En escritorio, las fotos alternan automáticamente entre izquierda y derecha. En móvil, elige si aparece antes o después de la sección.</p>
    <CloudinaryImageUpload {...uploadProps} multiple={false} images={section.imageUrl ? [section.imageUrl] : []} onChange={images => {
      const imageUrl = images[0] ?? "";
      const additional = section.imageUrls?.filter(url => url !== section.imageUrl && url !== imageUrl) ?? [];
      onChange({ imageUrl, ...(section.imageUrls?.length ? { imageUrls: [imageUrl, ...additional].filter(Boolean) } : {}), imagePosition: section.imagePosition ?? "after" });
    }} />
    {section.imageUrl && <Field label="¿Dónde quieres mostrar la foto en móvil?" id={`${section.id}-photo-position`}><select id={`${section.id}-photo-position`} value={section.imagePosition ?? "after"} onChange={event => onChange({ imagePosition: event.target.value as "before" | "after" })}><option value="before">Antes de esta sección</option><option value="after">Después de esta sección</option></select></Field>}
  </div>;
}
