"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { FiImage, FiAlignCenter, FiLayers } from "react-icons/fi";
import type { InviteSection, InvitationPanelStyle } from "@/lib/invitation-editor";
import { SectionPhotoFields, SectionSurfaceFields, SectionTextAlignmentFields } from "./InvitationSectionFields";
import styles from "./SectionQuickActions.module.css";

type Props = { section: InviteSection; onChange(changes: Partial<InviteSection>): void; globalPanelStyle?: InvitationPanelStyle; globalShowIcons?: boolean; disabled?: boolean; photoFields?: ReactNode; uploadProps: Parameters<typeof SectionPhotoFields>[0]["uploadProps"] };

export function SectionQuickActions({ section, onChange, globalPanelStyle, globalShowIcons, uploadProps, disabled, photoFields }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const id = useId();
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasPhoto = section.type !== "gallery" && section.type !== "countdown";
  const actions = [{ key: "photo", label: "Foto", Icon: FiImage }, { key: "alignment", label: "Alineación", Icon: FiAlignCenter }, { key: "style", label: "Estilo", Icon: FiLayers }].filter(action => action.key !== "photo" || hasPhoto);
  return <div className={styles.actions}>
    <p>La apariencia general se elige en «Dale tu estilo». Aquí puedes ajustar este bloque.</p>
    <div className={styles.buttons} role="group" aria-label={`Opciones de ${section.title}`}>{actions.map(({ key, label, Icon }) => <button key={key} ref={element => { buttons.current[key] = element; }} type="button" disabled={disabled} aria-expanded={active === key} aria-controls={active === key ? id : undefined} onClick={() => setActive(current => current === key ? null : key)}><Icon aria-hidden="true" />{label}</button>)}</div>
    {active && <div id={id} className={styles.panel}>
      {active === "photo" && (photoFields ?? <SectionPhotoFields section={section} onChange={onChange} uploadProps={uploadProps} />)}
      {active === "alignment" && <SectionTextAlignmentFields section={section} onChange={onChange} />}
      {active === "style" && <SectionSurfaceFields section={section} onChange={onChange} globalPanelStyle={globalPanelStyle} globalShowIcons={globalShowIcons} />}
      <button type="button" className={styles.close} disabled={disabled} onClick={() => { buttons.current[active]?.focus(); setActive(null); }}>Cerrar ajustes</button>
    </div>}
  </div>;
}
