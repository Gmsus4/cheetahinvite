"use client";

import type { ReactNode } from "react";
import { FiAlignLeft, FiAlignCenter, FiAlignRight } from "react-icons/fi";
import type { InviteSection, InvitationPanelStyle } from "@/lib/invitation-editor";
import { invitationSurfaceOptions } from "@/lib/invitation-style-journey";
import { InvitationWhatsAppFields } from "./InvitationWhatsAppFields";
import { InvitationProgramFields } from "./InvitationProgramFields";
import { rsvpCompanionLimit } from "@/lib/rsvp";
import { CloudinaryImageUpload } from "./CloudinaryImageUpload";
import { InvitationImageFocusFields } from "./InvitationMobileImageFocus";

type SectionFieldsProps = { globalPanelStyle?: InvitationPanelStyle; globalShowIcons?: boolean; section: InviteSection; onChange(changes: Partial<InviteSection>): void; uploadProps: { eventId: string; ensureEvent?: () => Promise<string>; onBusyChange(active: boolean): void }; allowSectionPhoto?: boolean; showStyleControls?: boolean; mediaClassName?: string; locationFields?: ReactNode };

function Field({ label, id, help, wide, children }: { label: string; id: string; help?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`guided-field${wide ? " guided-wide" : ""}`} data-preview-field={id} data-preview-label={label}><label htmlFor={id}>{label}</label>{children}{help && <small>{help}</small>}</div>;
}

export function SectionTextAlignmentFields({ section, onChange }: Pick<SectionFieldsProps, "section" | "onChange">) {
  return <fieldset className="guided-section-surface">
    <legend>Alineación del texto</legend>
    <div role="group" aria-label={`Alineación del texto de ${section.title}`}>
      {([['auto', 'Automática', null], ['left', 'Izquierda', FiAlignLeft], ['center', 'Centro', FiAlignCenter], ['right', 'Derecha', FiAlignRight]] as const).map(([value, label, Icon]) => <button key={value} type="button" title={label} aria-label={label} aria-pressed={(section.textAlign ?? 'auto') === value} onClick={() => onChange({ textAlign: value })}>{Icon ? <Icon aria-hidden="true" size={20} /> : 'Auto'}</button>)}
    </div>
    <small>Automática conserva el diseño actual. Las otras opciones alinean el texto sin mover la imagen.</small>
  </fieldset>;
}

export function SectionFields(props: SectionFieldsProps) {
  return <><SectionContentFields {...props} />{props.showStyleControls !== false && <SectionTextAlignmentFields section={props.section} onChange={props.onChange} />}</>;
}

function SectionContentFields({ section, onChange, uploadProps, allowSectionPhoto = false, showStyleControls = true, globalShowIcons = true, globalPanelStyle = "auto", mediaClassName, locationFields }: SectionFieldsProps) {
  const prefix = section.id;
  const mediaClass = `guided-section-media${mediaClassName ? ` ${mediaClassName}` : ""}`;
  const surfaceControl = showStyleControls && allowSectionPhoto && <SectionSurfaceFields section={section} onChange={onChange} globalShowIcons={globalShowIcons} globalPanelStyle={globalPanelStyle} />;
  if (section.type === "countdown") return <>
    <Field label="Título de la sección" id={`${prefix}-title`}><input id={`${prefix}-title`} value={section.title} maxLength={100} onChange={e => onChange({ title: e.target.value })} /></Field>
    <small>La cuenta regresiva usa la fecha y la hora de «Fecha y lugar» y aparece dentro de la portada en escritorio, o debajo de ella en móvil, cuando hay una fecha definida.</small>
    {surfaceControl}
  </>;
  if (section.type === "location") return <>
    <Field label="Título de la sección" id={`${prefix}-title`}><input id={`${prefix}-title`} value={section.title} maxLength={100} onChange={e => onChange({ title: e.target.value, titleCustomized: true })} /></Field>
    {locationFields ?? <small>El lugar y la dirección se editan en «Fecha y lugar».</small>}
    {allowSectionPhoto && <section className={mediaClass} aria-label="Fotografía y acabado del lugar">{surfaceControl}<SectionPhotoFields section={section} onChange={onChange} uploadProps={uploadProps} /></section>}
  </>;
  if (section.type === "gallery") return <>
    <Field label="Título de la sección" id={`${prefix}-title`}><input id={`${prefix}-title`} value={section.title} maxLength={120} onChange={e => onChange({ title: e.target.value })} /></Field>
    {surfaceControl && <div className={mediaClass}>{surfaceControl}</div>}
    {mediaClassName ? <div className={mediaClassName}><SectionPhotoFields section={section} onChange={onChange} uploadProps={uploadProps} /></div> : <SectionPhotoFields section={section} onChange={onChange} uploadProps={uploadProps} />}
  </>;
  return <>
    <Field label="Título de la sección" id={`${prefix}-title`}><input id={`${prefix}-title`} value={section.title} maxLength={120} onChange={e => onChange({ title: e.target.value })} /></Field>
    {section.type === "rsvp" && <Field label="¿Cómo quieres recibir las respuestas?" id={`${prefix}-mode`}><select id={`${prefix}-mode`} value={section.rsvpMode ?? "external"} onChange={e => onChange({ rsvpMode: e.target.value as "integrated" | "external" })}><option value="integrated">Aquí mismo, en la invitación</option><option value="external">En WhatsApp u otro enlace</option></select></Field>}
    {section.type === "rsvp" && section.rsvpMode === "integrated" && <Field label="Acompañantes permitidos por invitado" id={`${prefix}-companions`} help="Son personas adicionales a quien confirma. Elige 0 para una invitación individual. Si cambias el límite después, las respuestas recibidas se conservan."><select id={`${prefix}-companions`} value={rsvpCompanionLimit(section.maxCompanions)} onChange={e => onChange({ maxCompanions: Number(e.target.value) })}>{Array.from({ length: 11 }, (_, count) => <option key={count} value={count}>{count === 0 ? "0 · Sin acompañantes" : `${count} ${count === 1 ? "acompañante" : "acompañantes"} como máximo`}</option>)}</select></Field>}
    {section.type === "program" ? <InvitationProgramFields id={prefix} content={section.content} onChange={content => onChange({ content })} /> : <Field label={({ story: "Cuenta la historia de tu celebración", ceremony: "Nombre del lugar de la ceremonia", reception: "Nombre del lugar de la recepción", parents: "Nombres de las personas que quieres mencionar", dress_code: "¿Cómo deben vestir tus invitados?", gifts: "Mensaje sobre los regalos", rsvp: "Texto de la sección (opcional)", music: "Mensaje para la playlist", custom: "Información adicional" } as Record<string, string>)[section.type]} id={`${prefix}-content`}><textarea id={`${prefix}-content`} rows={section.type === "story" ? 10 : ["ceremony", "reception"].includes(section.type) ? 3 : 6} data-short-content={["ceremony", "reception"].includes(section.type)} value={section.content} maxLength={2000} placeholder={({ story: "Todo empezó cuando…", ceremony: "Ej. Parroquia San José", reception: "Ej. Jardín Las Rosas", dress_code: "Ej. Casual, con calzado cómodo.", gifts: "Tu compañía es nuestro mejor regalo…" } as Record<string, string>)[section.type]} onChange={e => onChange({ content: e.target.value })} /></Field>}
    {(section.type === "ceremony" || section.type === "reception") && <><Field label="Horario" id={`${prefix}-time`}><input id={`${prefix}-time`} value={section.detail} maxLength={240} placeholder="Ej. 5:00 p. m." onChange={e => onChange({ detail: e.target.value })} /></Field><Field label="Dirección o enlace de Google Maps" id={`${prefix}-map`}><input id={`${prefix}-map`} value={section.link} maxLength={500} placeholder="Calle, número y ciudad, o enlace de Maps" onChange={e => onChange({ link: e.target.value })} /></Field></>}
    {(section.type === "gifts" || section.type === "music" || section.type === "custom") && <Field label={section.type === "gifts" ? "Enlace a la mesa de regalos (opcional)" : section.type === "music" ? "Enlace a la playlist" : "Enlace adicional (opcional)"} id={`${prefix}-link`}><input id={`${prefix}-link`} type="url" maxLength={500} value={section.link} placeholder="https://…" onChange={e => onChange({ link: e.target.value })} /></Field>}
    {section.type === "rsvp" && section.rsvpMode !== "integrated" && <InvitationWhatsAppFields key={section.id} section={section} onChange={onChange} />}
    {allowSectionPhoto && <section className={mediaClass} aria-label="Fotografía y acabado de esta sección">{surfaceControl}<SectionPhotoFields section={section} onChange={onChange} uploadProps={uploadProps} /></section>}
  </>;
}

export function SectionSurfaceFields({ section, onChange, globalPanelStyle = "auto", globalShowIcons = true }: Pick<SectionFieldsProps, "section" | "onChange" | "globalPanelStyle" | "globalShowIcons">) {
  const surfaceLocked = globalPanelStyle !== "auto";
  return <><fieldset className="guided-section-surface">
    <legend>Estilo de esta sección</legend>
    <div role="group" aria-label={`Estilo de ${section.title}`}>
      {invitationSurfaceOptions.map(({ value, label }) => <button
        key={value}
        type="button"
        disabled={surfaceLocked}
        aria-pressed={(surfaceLocked ? globalPanelStyle : section.panelStyle ?? 'auto') === value}
        onClick={() => { if (!surfaceLocked) onChange({ panelStyle: value }); }}
      >{label}</button>)}
    </div>
    <small>{surfaceLocked ? 'Para modificar el fondo de una sección específica, selecciona «Automático» en los ajustes de apariencia.' : 'Automático alterna los tres acabados durante el recorrido.'}</small>
  </fieldset>
    {!["cover", "countdown", "gallery"].includes(section.type) && <label className="guided-toggle guided-include-toggle" htmlFor={`${section.id}-show-icon`}>
      <span><strong>Mostrar icono</strong><small>{globalShowIcons ? "Incluye un icono sobre el título de esta sección." : "Activa los iconos en Apariencia para personalizar esta sección."}</small></span>
      <input id={`${section.id}-show-icon`} type="checkbox" role="switch" disabled={!globalShowIcons} checked={globalShowIcons && section.showIcon !== false} onChange={event => onChange({ showIcon: event.target.checked })} /><span className="guided-switch" aria-hidden="true" />
    </label>}
  </>;
}

export function SectionPhotoFields({ section, onChange, uploadProps }: Pick<SectionFieldsProps, "section" | "onChange" | "uploadProps">) {
  if (section.type === "gallery") return <><CloudinaryImageUpload {...uploadProps} multiple images={section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : []} onChange={imageUrls => onChange({ imageUrls, imageUrl: imageUrls[0] ?? "" })} />{(section.imageUrl || Boolean(section.imageUrls?.length)) && <InvitationImageFocusFields section={section} onChange={onChange} />}</>;
  return <div className="guided-section-photo" data-preview-field={`${section.id}-photo`} data-preview-label={`Foto de ${section.title}`}>
    <h3>Foto junto a esta sección <span>Opcional</span></h3>
    <p>En escritorio, las fotos alternan automáticamente entre izquierda y derecha. En móvil, elige si aparece antes o después de la sección.</p>
    <CloudinaryImageUpload {...uploadProps} multiple={false} images={section.imageUrl ? [section.imageUrl] : []} onChange={images => {
      const imageUrl = images[0] ?? "";
      const additional = section.imageUrls?.filter(url => url !== section.imageUrl && url !== imageUrl) ?? [];
      onChange({ imageUrl, ...(section.imageUrls?.length ? { imageUrls: [imageUrl, ...additional].filter(Boolean) } : {}), imagePosition: section.imagePosition ?? "after" });
    }} />
    {section.imageUrl && <InvitationImageFocusFields section={section} onChange={onChange} />}
    {section.imageUrl && <Field label="¿Dónde quieres mostrar la foto en móvil?" id={`${section.id}-photo-position`}><select id={`${section.id}-photo-position`} value={section.imagePosition ?? "after"} onChange={event => onChange({ imagePosition: event.target.value as "before" | "after" })}><option value="before">Antes de esta sección</option><option value="after">Después de esta sección</option></select></Field>}
  </div>;
}
