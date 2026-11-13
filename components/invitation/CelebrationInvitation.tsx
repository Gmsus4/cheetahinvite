"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { isInvitationCoverLayout } from "@/lib/invitation-cover-layout";
import { parseInvitationProgram } from "@/lib/invitation-program";
import { normalizeEventLocations } from "@/lib/invitation-locations";
import { FiMaximize, FiEyeOff, FiAlignCenter, FiArrowUpRight, FiClock, FiEdit3, FiGift, FiHeart, FiMapPin, FiMusic, FiUsers, FiLayers, FiImage, FiMoreHorizontal } from "react-icons/fi";
import type { InviteSection } from "@/lib/invitation-editor";
import { getInvitationEventContent, invitationPresentation } from "@/lib/invitation-event-content";
import { atmospherePanelStyle, atmosphereSections, atmosphereStyle, atmosphereTextStyle, atmosphereTime } from "@/lib/invitation-atmosphere";
import { invitationLinkLabel, invitationLocationUrl, invitationSectionUrl } from "@/lib/invitation-links";
import type { InvitationEditTarget, InvitationProps } from "@/lib/invitation-editor";
import { CountdownTimer } from "./CountdownTimer";
import { rsvpCompanionLimit } from "@/lib/rsvp";
import { RsvpForm } from "./RsvpForm";
import { InvitationPhotoCarousel } from "./InvitationPhotoCarousel";
import { useInvitationMotion } from "@/components/dashboard/useInvitationMotion";
import { orderedInvitationSections, usesPrimaryLocation, locationSectionTitle } from "@/lib/invitation-sections";

const sectionIcons = { closing: FiHeart, countdown: FiClock, cover: FiImage, location: FiMapPin, story: FiHeart, ceremony: FiHeart, reception: FiMapPin, program: FiClock, parents: FiUsers, dress_code: FiUsers, gifts: FiGift, gallery: FiImage, rsvp: FiHeart, music: FiMusic, custom: FiHeart };

type EditHandler = (target: InvitationEditTarget) => void;
type MarginControlRenderer = (section: InviteSection, label: string, photo: boolean) => ReactNode;
type StyleControlRenderer = (section: InviteSection, label: string) => ReactNode;

function SurfaceControl({ section, label, onEdit, renderStyleControl }: { section?: InviteSection; label: string; onEdit?: EditHandler; renderStyleControl?: StyleControlRenderer }) {
  if (!section || !onEdit) return null;
  return renderStyleControl ? renderStyleControl(section, label) : <button type="button" className="wa-edit-button wa-edit-surface" data-tour="block-style" aria-label={label} aria-haspopup="dialog" onClick={() => onEdit({ kind: "section-surface", sectionId: section.id })}><FiLayers aria-hidden="true" /><span>Estilo</span></button>;
}

function EditControl({ target, label, text, onEdit }: { target: InvitationEditTarget; label: string; text?: string; onEdit?: EditHandler }) {
  const Icon = target.kind === "cover-photo" || target.kind === "section-photo" ? FiImage : FiEdit3;
  return onEdit ? <button type="button" className="wa-edit-button" data-mobile-primary data-tour={target.kind === "cover-photo" || target.kind === "section-photo" ? "block-photo" : "block-edit"} aria-label={`Editar ${label}`} aria-haspopup="dialog" onClick={() => onEdit(target)}><Icon aria-hidden="true" /><span>{text ?? `Editar ${label}`}</span></button> : null;
}

function AlignmentControl({ section, onEdit, renderAlignmentControl }: { section?: InviteSection; onEdit?: EditHandler; renderAlignmentControl?: StyleControlRenderer }) {
  if (section && onEdit && renderAlignmentControl) return renderAlignmentControl(section, `Editar alineación del texto de ${section.title}`);
  return section && onEdit ? <button type="button" className="wa-edit-button wa-edit-alignment" data-tour="block-alignment" aria-label={`Editar alineación del texto de ${section.title}`} aria-haspopup="dialog" onClick={() => onEdit({ kind: "section-alignment", sectionId: section.id })}><FiAlignCenter aria-hidden="true" /><span>Alineación</span></button> : null;
}

function MarginControl({ section, onEdit, photo = false, renderMarginControl }: { section?: InviteSection; onEdit?: EditHandler; photo?: boolean; renderMarginControl?: MarginControlRenderer }) {
  if (section && onEdit && renderMarginControl) return renderMarginControl(section, `Editar bordes ${photo ? "de las fotos" : "del contenido"} de ${section.title}`, photo);
  return section && onEdit ? <button type="button" className="wa-edit-button wa-edit-margin" aria-label={`Editar bordes ${photo ? "de las fotos" : "del contenido"} de ${section.title}`} aria-haspopup="dialog" onClick={() => onEdit({ kind: photo ? "section-photo-margin" : "section-margin", sectionId: section.id })}><FiMaximize aria-hidden="true" /><span>{photo ? "Bordes de las fotos" : "Bordes del contenido"}</span></button> : null;
}

function PhotoControls({ section, target, label, text, onEdit, renderMarginControl }: { section?: InviteSection; target: InvitationEditTarget; label: string; text?: string; onEdit?: EditHandler; renderMarginControl?: MarginControlRenderer }) {
  return onEdit ? <div className="wa-edit-actions wa-edit-photo-actions" role="group" aria-label={`Acciones de ${label}`}>
    <EditControl target={target} label={label} text={text} onEdit={onEdit} />
    <MarginControl section={section} onEdit={onEdit} photo renderMarginControl={renderMarginControl} />
  </div> : null;
}

function BackgroundColorControl({ section, onEdit, renderBackgroundColorControl }: { section?: InviteSection; onEdit?: EditHandler; renderBackgroundColorControl?: StyleControlRenderer }) {
  return section && onEdit && renderBackgroundColorControl ? renderBackgroundColorControl(section, `Editar color del bloque de ${section.title}`) : null;
}

function TextColorControl({ section, onEdit, renderTextColorControl }: { section?: InviteSection; onEdit?: EditHandler; renderTextColorControl?: StyleControlRenderer }) {
  return section && onEdit && renderTextColorControl ? renderTextColorControl(section, `Editar color del texto de ${section.title}`) : null;
}

function MoreControl({ section, onEdit }: { section?: InviteSection; onEdit?: EditHandler }) {
  return section && onEdit ? <button type="button" className="wa-edit-button wa-edit-more" data-mobile-primary data-tour="block-more" aria-label={`Más opciones de ${section.title}`} aria-haspopup="dialog" onClick={() => onEdit({ kind: "section-tools", sectionId: section.id })}><FiMoreHorizontal aria-hidden="true" /><span>Más</span></button> : null;
}

function VisibilityControl({ section, onEdit }: { section?: InviteSection; onEdit?: EditHandler }) {
  return section && section.type !== "cover" && onEdit ? <button type="button" className="wa-edit-button" data-tour="block-visibility" aria-label={`Cambiar visibilidad de ${section.title}`} aria-haspopup="dialog" onClick={() => onEdit({ kind: "section-visibility", sectionId: section.id })}><FiEyeOff aria-hidden="true" /><span>Visibilidad</span></button> : null;
}

export function CelebrationInvitation(inputProps: InvitationProps & { preview?: boolean; showPlaceholders?: boolean; onEdit?: EditHandler; renderStyleControl?: StyleControlRenderer; renderAlignmentControl?: StyleControlRenderer; renderMarginControl?: MarginControlRenderer; renderBackgroundColorControl?: StyleControlRenderer; renderTextColorControl?: StyleControlRenderer }) {
  const motion = useInvitationMotion(!inputProps.preview);
  const props = { ...inputProps, ...normalizeEventLocations(inputProps.venue, inputProps.address, inputProps.sections) };
  const panelStyle = props.panelStyle ?? "auto";
  const selectedCoverLayout = isInvitationCoverLayout(props.coverLayout) ? props.coverLayout : "split";
  const coverLayout = selectedCoverLayout === "overlay" && !props.imageUrl ? "stacked" : selectedCoverLayout;
  const eventType = props.eventType ?? "wedding";
  const content = getInvitationEventContent(eventType);
  const copy = invitationPresentation(eventType);
  const title = props.hostNames.trim() || props.name.trim() || content.defaultName;
  const couple = eventType === "wedding" || eventType === "anniversary";
  const names = couple ? title.split(/\s+(?:y|&)\s+/i) : [title];
  const coverSection = props.sections.find(section => section.type === "cover");
  const coverSurface = atmospherePanelStyle(coverSection, 0, panelStyle);
  const explicitCoverStyle = coverSection?.panelStyle && coverSection.panelStyle !== "auto" ? coverSection.panelStyle : undefined;
  const countdownSection = props.sections.find(section => section.type === "countdown");
  const hasCountdown = Boolean(props.eventDateKey) && countdownSection?.enabled !== false;
  const locationSection = props.sections.find(section => section.type === "location");
  const closingSection = props.sections.find(section => section.type === "closing");
  const detailSections = props.sections.filter(section => section.type !== "reception" && section.type !== "location" && section.type !== "cover" && section.type !== "countdown" && section.type !== "closing");
  const sections = props.onEdit ? orderedInvitationSections(detailSections).filter(section => section.enabled) : atmosphereSections(detailSections);
  const time = atmosphereTime(props.eventTime);
  const date = props.eventDateKey ? props.date : "La fecha, muy pronto";
  const initials = couple ? names.map(name => name.trim()[0]).slice(0, 2).join(" & ") : title.split(/\s+/).map(part => part[0]).slice(0, 2).join("");
  const hasLocation = usesPrimaryLocation(props.sections) && Boolean(props.venue || props.address || locationSection?.link || props.showPlaceholders);
  const firstDetailIndex = 1 + Number(hasCountdown) + Number(hasLocation);

  return <article ref={motion} className="celebration-invitation" data-preview={props.preview || undefined} data-cover-style={explicitCoverStyle} data-panel-style={panelStyle === "auto" ? undefined : panelStyle} data-event-type={eventType} data-photo={Boolean(props.backgroundImageUrl)} data-long-names={title.length > 25 || undefined} style={atmosphereStyle(props.accent, props)}>
    <div className="wa-backdrop" aria-hidden="true">
      {props.backgroundImageUrl && <div className="wa-backdrop-image"><Image src={props.backgroundImageUrl} alt="" fill sizes="100vw" unoptimized loading="eager" /></div>}
      {!props.backgroundImageUrl && <div className="wa-backdrop-shade" />}
      <div className="wa-backdrop-dim" />
    </div>
    <div className="wa-content-frame">
    <div className="wa-column">
      <div className="wa-shell">
      <div className="wa-intro" style={atmosphereTextStyle(props.accent, props, coverSection)} data-cover-layout={coverLayout} data-invitation-field={`cover-block${coverSection ? ` section:${coverSection.id}` : ""}`} data-surface={panelStyle === "auto" && !explicitCoverStyle ? undefined : coverSurface}>
      <header className="wa-cover" data-surface={coverSurface} data-has-media={Boolean(props.imageUrl)} data-invitation-field="cover event-type">
        <div className="wa-cover-heading" data-margin={coverSection?.textMargin ?? coverSection?.margin} data-text-align={coverSection?.textAlign} style={atmosphereTextStyle(props.accent, props, coverSection)} data-editable={Boolean(props.onEdit) || undefined} data-content-surface={coverSurface}>
          {props.onEdit && <div className="wa-edit-actions" role="group" aria-label="Acciones de la portada">
            <EditControl target={{ kind: "cover" }} label="portada" onEdit={props.onEdit} />
            <button type="button" className="wa-edit-button wa-edit-mobile-photo" data-mobile-primary data-tour="block-photo" aria-label="Editar foto de portada" aria-haspopup="dialog" onClick={() => props.onEdit?.({ kind: "cover-photo" })}><FiImage aria-hidden="true" /><span>Foto</span></button>
            <MoreControl section={coverSection} onEdit={props.onEdit} />
            <SurfaceControl section={coverSection} label="Editar estilo de portada" onEdit={props.onEdit} renderStyleControl={props.renderStyleControl} />
            <AlignmentControl section={coverSection} onEdit={props.onEdit} renderAlignmentControl={props.renderAlignmentControl} />
          <BackgroundColorControl section={coverSection} onEdit={props.onEdit} renderBackgroundColorControl={props.renderBackgroundColorControl} />
          <TextColorControl section={coverSection} onEdit={props.onEdit} renderTextColorControl={props.renderTextColorControl} />
          <MarginControl section={coverSection} onEdit={props.onEdit} renderMarginControl={props.renderMarginControl} />
          </div>}
          <span className="wa-kicker" data-invitation-field="w-name">{props.name.trim() || content.defaultName}</span>
          <h1 aria-label={title} data-invitation-field="w-hosts">{names.length === 2 ? <><span className="wa-couple-name">{names[0]}</span><span className="wa-ampersand" aria-hidden="true">&amp;</span><span className="wa-couple-name">{names[1]}</span></> : title}</h1>
          <p className="wa-date" data-invitation-field="w-date w-time">{date}{time && <><span aria-hidden="true"> · </span>{time}</>}</p>
        </div>
        {props.imageUrl ? <div className="wa-portrait" data-photo-margin={coverSection?.photoMargin ?? coverSection?.margin} data-mobile-image-focus={coverSection?.mobileImageFocus} data-desktop-image-focus={coverSection?.desktopImageFocus} data-editable={Boolean(props.onEdit) || undefined} data-invitation-field="cover-photo"><PhotoControls section={coverSection} target={{ kind: "cover-photo" }} label="foto de portada" onEdit={props.onEdit} renderMarginControl={props.renderMarginControl} /><Image src={props.imageUrl} alt={`${copy.photoLabel}: ${title}`} width={900} height={1000} sizes="(max-width:600px) 94vw, 540px" preload unoptimized /></div>
          : <div className="wa-no-photo" data-photo-margin={coverSection?.photoMargin ?? coverSection?.margin} aria-hidden={props.onEdit ? undefined : true} data-editable={Boolean(props.onEdit) || undefined} data-invitation-field="cover-photo"><PhotoControls section={coverSection} target={{ kind: "cover-photo" }} label="foto de portada" onEdit={props.onEdit} renderMarginControl={props.renderMarginControl} /><span>{initials}</span><i>{copy.caption}</i></div>}
      </header>
      {hasCountdown && <section className="wa-panel wa-countdown" data-margin={countdownSection?.textMargin ?? countdownSection?.margin} data-text-align={countdownSection?.textAlign} style={atmosphereTextStyle(props.accent, props, countdownSection)} data-editable={Boolean(props.onEdit) || undefined} data-invitation-field={`countdown${countdownSection ? ` section:${countdownSection.id}` : ""}`} data-surface={atmospherePanelStyle(countdownSection, 1, panelStyle)} aria-label="Cuenta regresiva">
        {props.onEdit && <div className="wa-edit-actions" role="group" aria-label="Acciones de la cuenta regresiva">
          <EditControl target={{ kind: "date" }} label="fecha y hora" onEdit={props.onEdit} />
          <MoreControl section={countdownSection} onEdit={props.onEdit} />
          <SurfaceControl section={countdownSection} label="Editar estilo de la cuenta regresiva" onEdit={props.onEdit} renderStyleControl={props.renderStyleControl} />
          <AlignmentControl section={countdownSection} onEdit={props.onEdit} renderAlignmentControl={props.renderAlignmentControl} />
          <BackgroundColorControl section={countdownSection} onEdit={props.onEdit} renderBackgroundColorControl={props.renderBackgroundColorControl} />
          <TextColorControl section={countdownSection} onEdit={props.onEdit} renderTextColorControl={props.renderTextColorControl} />
          <MarginControl section={countdownSection} onEdit={props.onEdit} renderMarginControl={props.renderMarginControl} />
          <VisibilityControl section={countdownSection} onEdit={props.onEdit} />
        </div>}
        <span className="wa-kicker" data-invitation-field={countdownSection ? `${countdownSection.id}-title` : undefined}>{countdownSection?.title || "Cada vez más cerca"}</span><CountdownTimer date={props.eventDateKey!} time={props.eventTime || "00:00"} />
      </section>}
      </div>
      {hasLocation && <AtmosphereSection showIcons={props.showSectionIcons !== false} section={locationSection ?? { id: "primary-location", type: "location", title: "Lugar del evento", content: "", detail: "", link: "", imageUrl: "", enabled: true }} surface={atmospherePanelStyle(locationSection, 1 + Number(hasCountdown), panelStyle)} onEdit={props.onEdit} renderStyleControl={props.renderStyleControl} renderAlignmentControl={props.renderAlignmentControl} renderMarginControl={props.renderMarginControl} renderBackgroundColorControl={props.renderBackgroundColorControl} renderTextColorControl={props.renderTextColorControl} textStyle={atmosphereTextStyle(props.accent, props, locationSection)} locationDetails={{ venue: props.venue, address: props.address, showPlaceholders: props.showPlaceholders, date: date + (time ? ` · ${time}` : "") }} />}


      {sections.map((section, index) => <AtmosphereSection showIcons={props.showSectionIcons !== false} key={section.id} section={section} surface={atmospherePanelStyle(section, firstDetailIndex + index, panelStyle)} eventId={props.publicEventId} onEdit={props.onEdit} renderStyleControl={props.renderStyleControl} renderAlignmentControl={props.renderAlignmentControl} renderMarginControl={props.renderMarginControl} renderBackgroundColorControl={props.renderBackgroundColorControl} renderTextColorControl={props.renderTextColorControl} textStyle={atmosphereTextStyle(props.accent, props, section)} />)}
      </div>
      {closingSection?.enabled !== false && <footer className="wa-footer" data-margin={closingSection?.textMargin ?? closingSection?.margin} data-editable={Boolean(props.onEdit) || undefined} data-text-align={closingSection?.textAlign} style={atmosphereTextStyle(props.accent, props, closingSection)} data-invitation-field={closingSection ? 'section:' + closingSection.id : undefined}>
        {closingSection && props.onEdit && <div className="wa-edit-actions" role="group" aria-label="Acciones de Despedida">
          <EditControl target={{ kind: "section", sectionId: closingSection.id }} label="despedida" text="Editar" onEdit={props.onEdit} />
          <MoreControl section={closingSection} onEdit={props.onEdit} />
          <AlignmentControl section={closingSection} onEdit={props.onEdit} renderAlignmentControl={props.renderAlignmentControl} />
          <BackgroundColorControl section={closingSection} onEdit={props.onEdit} renderBackgroundColorControl={props.renderBackgroundColorControl} />
          <TextColorControl section={closingSection} onEdit={props.onEdit} renderTextColorControl={props.renderTextColorControl} />
          <MarginControl section={closingSection} onEdit={props.onEdit} renderMarginControl={props.renderMarginControl} />
          <VisibilityControl section={closingSection} onEdit={props.onEdit} />
        </div>}
        <span className="wa-kicker" data-invitation-field={closingSection ? closingSection.id + '-title' : undefined}>{closingSection ? closingSection.title : copy.closingKicker}</span><strong>{title}</strong><p data-invitation-field={closingSection ? closingSection.id + '-content' : undefined}>{closingSection ? closingSection.content : copy.closingMessage}</p><small>Cheetah Invite</small>
      </footer>}
    </div>
    </div>
  </article>;
}

function AtmosphereSection({ section, eventId, surface, onEdit, renderStyleControl, renderAlignmentControl, renderMarginControl, renderBackgroundColorControl, renderTextColorControl, textStyle, locationDetails, showIcons = true }: { showIcons?: boolean; locationDetails?: { venue: string; address: string; date: string; showPlaceholders?: boolean }; section: InviteSection; eventId?: string; surface: Exclude<InvitationProps["panelStyle"], "auto" | undefined>; onEdit?: EditHandler; renderStyleControl?: StyleControlRenderer; renderAlignmentControl?: StyleControlRenderer; renderMarginControl?: MarginControlRenderer; renderBackgroundColorControl?: StyleControlRenderer; renderTextColorControl?: StyleControlRenderer; textStyle?: CSSProperties }) {
  const Icon = sectionIcons[section.type];
  const photoLabel = section.type === "gallery" ? "fotos" : "foto";
  const sectionPhoto = section.type !== "gallery" ? section.imageUrl : "";
  const attachedImages = section.imageUrls?.length ? section.imageUrls : section.imageUrl ? [section.imageUrl] : [];
  const images = sectionPhoto ? attachedImages.filter(src => src !== sectionPhoto) : attachedImages;
  const photoPosition = section.type === "gallery" ? "after" : section.imagePosition ?? "after";
  const photo = sectionPhoto ? <figure className="wa-section-photo" data-photo-position={photoPosition} data-invitation-field={`${section.id}-photo ${section.id}-photo-position`}>
    <Image src={sectionPhoto} alt={`Foto que acompaña ${section.title}`} width={1200} height={800} sizes="(max-width:600px) calc(100vw - 24px), 560px" unoptimized />
  </figure> : null;
  const url = locationDetails ? invitationLocationUrl(locationDetails.venue, locationDetails.address, section.link) : invitationSectionUrl(section.type, section.link);
  const media = (photo || images.length > 0) ? <div className="wa-section-media" data-photo-margin={section.photoMargin ?? section.margin} data-mobile-image-focus={section.mobileImageFocus} data-desktop-image-focus={section.desktopImageFocus} data-editable={Boolean(onEdit) || undefined}>
    <PhotoControls section={section} target={{ kind: "section-photo", sectionId: section.id }} label={`${photoLabel} de ${section.title}`} text={`Editar ${photoLabel}`} onEdit={onEdit} renderMarginControl={renderMarginControl} />
    {photo}
    {images.length > 0 && (section.type === "gallery" ? <InvitationPhotoCarousel images={images} title={section.title} /> : <div className="wa-photo-grid">{images.map((src, index) => <figure key={`${src}-${index}`}><Image src={src} alt={`${section.title} · fotografía ${index + 1}`} width={800} height={1000} sizes="(max-width:600px) 88vw, 500px" unoptimized /></figure>)}</div>)}
  </div> : null;
  return <div className="wa-section-row" style={textStyle} data-section-type={section.type} data-has-media={Boolean(media)} data-photo-position={photoPosition}>
    {photoPosition === "before" && media}<section className={`wa-panel wa-section wa-${section.type}`} data-margin={section.textMargin ?? section.margin} data-text-align={section.textAlign} data-editable={Boolean(onEdit) || undefined} data-surface={surface} aria-label={section.title} data-invitation-field={`section:${section.id}`} style={textStyle}>
    {onEdit && <div className="wa-edit-actions" role="group" aria-label={`Acciones de ${section.title}`}>
      <EditControl target={locationDetails ? { kind: "location" } : { kind: "section", sectionId: section.id }} label={locationDetails ? "lugar" : section.title} text="Editar" onEdit={onEdit} />
      <button type="button" className="wa-edit-button" data-mobile-primary data-tour="block-photo" aria-label={`${media ? "Editar" : "Agregar"} ${photoLabel} ${media ? "de" : "a"} ${section.title}`} aria-haspopup="dialog" onClick={() => onEdit({ kind: "section-photo", sectionId: section.id })}><FiImage aria-hidden="true" /><span>{media ? "Editar" : "Agregar"} {photoLabel}</span></button>
      <MoreControl section={section} onEdit={onEdit} />
      <SurfaceControl section={section} label={locationDetails ? "Editar estilo del lugar principal" : `Editar estilo de ${section.title}`} onEdit={onEdit} renderStyleControl={renderStyleControl} />
      <AlignmentControl section={section} onEdit={onEdit} renderAlignmentControl={renderAlignmentControl} />
          <BackgroundColorControl section={section} onEdit={onEdit} renderBackgroundColorControl={renderBackgroundColorControl} />
          <TextColorControl section={section} onEdit={onEdit} renderTextColorControl={renderTextColorControl} />
      <MarginControl section={section} onEdit={onEdit} renderMarginControl={renderMarginControl} />
      <VisibilityControl section={section} onEdit={onEdit} />
    </div>}
    {showIcons && section.type !== "gallery" && section.showIcon !== false && <Icon className="wa-section-icon" aria-hidden="true" />}<h2 id={locationDetails ? "invitation-location-title" : undefined} data-invitation-field={`${section.id}-title`}>{locationDetails ? locationSectionTitle(section) : section.title}</h2>
    {locationDetails && <><h3 data-invitation-field="w-venue">{locationDetails.venue || "Nos vemos aquí"}</h3><p>{locationDetails.date}</p>{(locationDetails.address || locationDetails.showPlaceholders) && <p data-invitation-field="w-address">{locationDetails.address || "Dirección por definir"}</p>}</>}
    {section.detail && <p className="wa-detail" data-invitation-field={`${section.id}-time`}>{section.detail}</p>}
    {!locationDetails && (section.type === "program" ? <ol className="wa-timeline" data-invitation-field={`${section.id}-content`}>{parseInvitationProgram(section.content).filter(item => item.time || item.activity.trim()).map(({ time, activity }, index) => {
      return <li key={index}>{time && <span className="wa-timeline-time">{time}</span>}<span>{activity}</span></li>;
    })}</ol> : section.content && <p data-invitation-field={`${section.id}-content`}>{section.content}</p>)}
    {onEdit && !locationDetails && !media && !section.content && !section.detail && !url && !(section.type === "rsvp" && section.rsvpMode === "integrated") && <p>{section.type === "gallery" ? "Agrega fotos a este apartado." : "Agrega contenido o una foto a este apartado."}</p>}
    {section.type === "rsvp" && section.rsvpMode === "integrated" ? <RsvpForm eventId={eventId} maxCompanions={rsvpCompanionLimit(section.maxCompanions)} /> : url && <a className="wa-button" href={url} target="_blank" rel="noopener noreferrer" data-invitation-field={`${locationDetails ? "w-map " : ""}${section.id}-link ${section.id}-map ${section.id}-mode`}>{invitationLinkLabel(section.type)}<FiArrowUpRight aria-hidden="true" /></a>}
  </section>{photoPosition === "after" && media}</div>;
}
