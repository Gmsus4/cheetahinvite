"use client";

import { useRef, useState, type ComponentProps } from "react";
import { FiAlignCenter, FiArrowLeft, FiDroplet, FiEye, FiEyeOff, FiImage, FiLayers, FiMaximize, FiType } from "react-icons/fi";
import { InvitationSectionStyleMenu } from "./InvitationSectionStyleMenu";
import styles from "./InvitationBlockTools.module.css";

type Props = Pick<ComponentProps<typeof InvitationSectionStyleMenu>, "section" | "values" | "disabled" | "onChange">;
type Tool = NonNullable<ComponentProps<typeof InvitationSectionStyleMenu>["mode"]>;
const tools = [
  { mode: "style", label: "Estilo", Icon: FiLayers },
  { mode: "alignment", label: "Alineación", Icon: FiAlignCenter },
  { mode: "background-color", label: "Color del bloque", Icon: FiDroplet },
  { mode: "text-color", label: "Color del texto", Icon: FiType },
  { mode: "text-margin", label: "Márgenes del contenido", Icon: FiMaximize },
  { mode: "photo-margin", label: "Márgenes de las fotos", Icon: FiImage },
] as const;

export function InvitationBlockTools({ section, values, disabled, onChange }: Props) {
  const [active, setActive] = useState<Tool | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const toolButtons = useRef(new Map<Tool, HTMLButtonElement>());
  const selected = tools.find(tool => tool.mode === active);
  const visibleTools = tools.filter(tool => !(section.type === "closing" && tool.mode === "style") && !(tool.mode === "photo-margin" && (section.type === "closing" || section.type === "countdown")));
  function open(mode: Tool) {
    setActive(mode);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function back() {
    const previous = active;
    setActive(null);
    requestAnimationFrame(() => { if (previous) toolButtons.current.get(previous)?.focus(); });
  }
  return <div className={styles.tools}>
    {selected ? <>
      <div className={styles.heading}>
        <button type="button" onClick={back} aria-label="Volver a las herramientas" disabled={disabled}><FiArrowLeft aria-hidden="true" /></button>
        <h3 ref={heading} tabIndex={-1}>{selected.label}</h3>
      </div>
      <InvitationSectionStyleMenu key={selected.mode} inline mode={selected.mode} section={section} label={selected.label} values={values} disabled={disabled} onChange={onChange} />
    </> : <>
      <p>Elige qué quieres cambiar en este bloque.</p>
      <div className={styles.grid}>
        {visibleTools.map(({ mode, label, Icon }) => <button key={mode} ref={button => { if (button) toolButtons.current.set(mode, button); else toolButtons.current.delete(mode); }} type="button" disabled={disabled} onClick={() => open(mode)}><span><Icon aria-hidden="true" /></span>{label}</button>)}
      </div>
      {section.type !== "cover" && <button type="button" className={styles.visibility} role="switch" aria-checked={section.enabled} disabled={disabled} onClick={() => onChange({ enabled: !section.enabled })}>
        {section.enabled ? <FiEye aria-hidden="true" /> : <FiEyeOff aria-hidden="true" />}<span>Mostrar este bloque</span><strong>{section.enabled ? "Visible" : "Oculto"}</strong>
      </button>}
    </>}
  </div>;
}
