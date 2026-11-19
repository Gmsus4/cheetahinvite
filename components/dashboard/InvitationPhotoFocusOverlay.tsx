"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { FiSliders, FiMove, FiX, FiArrowUpLeft, FiArrowUp, FiArrowUpRight, FiArrowLeft, FiMinus, FiArrowRight, FiArrowDownLeft, FiArrowDown, FiArrowDownRight } from "react-icons/fi";
import { isPhotoShape, isPhotoFit, type InviteSection } from "@/lib/invitation-editor";
import styles from "./InvitationPhotoFocusOverlay.module.css";

const positions = [
  ["top-left", "Arriba izquierda", FiArrowUpLeft], ["top", "Arriba", FiArrowUp], ["top-right", "Arriba derecha", FiArrowUpRight],
  ["left", "Izquierda", FiArrowLeft], ["center", "Centro", FiMinus], ["right", "Derecha", FiArrowRight],
  ["bottom-left", "Abajo izquierda", FiArrowDownLeft], ["bottom", "Abajo", FiArrowDown], ["bottom-right", "Abajo derecha", FiArrowDownRight],
] as const;

export function InvitationPhotoFocusOverlay({ section, disabled, onChange, mode }: { section: InviteSection; disabled: boolean; onChange(changes: Partial<InviteSection>): void; mode?: "settings" }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const settingsId = useId();
  const settingsButton = useRef<HTMLButtonElement>(null);
  const settingsPanel = useRef<HTMLDivElement>(null);
  function positionSettings() {
    const button = settingsButton.current;
    const panel = settingsPanel.current;
    if (!button || !panel) return;
    const bounds = button.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 24);
    const height = Math.min(panel.scrollHeight || 320, window.innerHeight - 24);
    const top = Math.max(12, Math.min(bounds.bottom + 8, window.innerHeight - height - 12));
    panel.style.width = `${width}px`;
    panel.style.left = `${Math.max(12, Math.min(bounds.right - width, window.innerWidth - width - 12))}px`;
    panel.style.top = `${top}px`;
    panel.style.maxHeight = `${window.innerHeight - top - 12}px`;
  }
  useLayoutEffect(() => { if (mode === "settings" && open) positionSettings(); });
  useEffect(() => {
    if (mode !== "settings" || !open) return;
    const close = (event: Event) => { if (!settingsPanel.current?.contains(event.target as Node)) settingsPanel.current?.hidePopover(); };
    window.addEventListener("resize", positionSettings);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("resize", positionSettings); window.removeEventListener("scroll", close, true); };
  }, [mode, open]);
  useEffect(() => {
    if (!open || disabled || mode === "settings") return;
    const photo = root.current?.parentElement;
    const controls = Array.from(photo?.querySelectorAll<HTMLElement>(":scope > .wa-edit-photo-actions, .wa-photo-carousel") ?? []);
    const previous = controls.map(control => control.inert);
    controls.forEach(control => { control.inert = true; });
    return () => controls.forEach((control, index) => { control.inert = previous[index]; });
  }, [open, disabled, mode]);
  if (mode === "settings") return <div className={styles.settings} data-photo-settings>
      <button ref={settingsButton} type="button" className="wa-edit-button" data-tour="photo-format" data-mobile-primary disabled={disabled} popoverTarget={settingsId} aria-controls={settingsId} aria-expanded={open} aria-label={`Formato y ajuste de ${section.title || "la foto"}`}><FiSliders aria-hidden="true" /><span>Formato y ajuste</span></button>
      <div ref={settingsPanel} id={settingsId} popover="auto" role="group" aria-label="Formato y ajuste de la foto" className={styles.settingsPanel} onBeforeToggle={event => { if (event.newState === "open") positionSettings(); }} onToggle={event => setOpen(event.newState === "open")}>
      <fieldset disabled={disabled}>
        <label><span>Formato de la foto</span><select aria-label="Formato de la foto" value={section.photoShape ?? "auto"} onChange={event => { if (isPhotoShape(event.target.value)) onChange({ photoShape: event.target.value }); }}>
          <option value="auto">Diseño original del bloque</option><option value="square">Cuadrado · 1:1</option><option value="landscape">Rectangular · 3:2</option><option value="original">Proporción de la imagen</option>
        </select></label>
        <label><span>Ajustar imagen</span><select aria-label="Ajustar imagen" value={section.photoFit ?? "cover"} onChange={event => { if (isPhotoFit(event.target.value)) onChange({ photoFit: event.target.value }); }}>
          <option value="cover">Cubrir · cover</option><option value="contain">Mostrar completa · contain</option><option value="fill">Estirar · fill</option><option value="none">Tamaño real · none</option><option value="scale-down">Solo reducir · scale-down</option>
        </select></label>
        <p>El formato define el espacio. El ajuste decide si la foto se recorta, deja espacio libre o se estira.</p>
      </fieldset>
      </div>
    </div>;
  return <div ref={root} className={styles.overlay} data-photo-focus data-open={open && !disabled}>
    <button className={styles.trigger} data-tour="photo-focus" type="button" disabled={disabled} aria-expanded={open && !disabled} aria-label={open ? "Cerrar encuadre" : `Ajustar encuadre de ${section.title || "la foto"}`} onClick={() => setOpen(current => !current)}>{open ? <FiX aria-hidden="true" /> : <FiMove aria-hidden="true" />}<span>{open ? "Cerrar encuadre" : "Encuadre"}</span></button>
    {open && !disabled && (["mobile", "desktop"] as const).map(device => {
      const field = device === "mobile" ? "mobileImageFocus" : "desktopImageFocus";
      return <div className={styles.positions} key={device} data-device={device} role="group" aria-label={`Encuadre de ${section.title || "la foto"} en ${device === "mobile" ? "móvil" : "escritorio"}`}>
        {positions.map(([value, label, Icon]) => <button key={value} type="button" title={label} aria-label={label} aria-pressed={section[field] === value} onClick={() => onChange({ [field]: value })}><Icon aria-hidden="true" /></button>)}
      </div>;
    })}
  </div>;
}
