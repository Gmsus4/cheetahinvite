"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { FiMaximize, FiMinimize, FiSquare, FiAlignCenter, FiAlignLeft, FiAlignRight, FiLayers, FiType, FiDroplet, FiGrid, FiEdit3 } from "react-icons/fi";
import type { IconType } from "react-icons";
import { LuDroplet, LuLayers3, LuPaintBucket, LuRectangleHorizontal, LuWandSparkles } from "react-icons/lu";
import { TbBackground } from "react-icons/tb";
import type { EditorValues, InviteSection } from "@/lib/invitation-editor";
import { invitationSurfaceOptions } from "@/lib/invitation-style-journey";
import { imagePaletteColors, imagePaletteTargets, invitationSectionPaletteTarget, resolveInvitationSectionColor } from "@/lib/invitation-image-palette";
import { invitationTextColor, isGlobalTextColorLocked, sectionTextColorOptions } from "@/lib/invitation-text-color";
import styles from "./InvitationSectionStyleMenu.module.css";

const surfaceIcons = { auto: LuLayers3, blur: LuWandSparkles, "blur-color": LuWandSparkles, color: LuPaintBucket, glass: LuRectangleHorizontal, none: TbBackground };

export function InvitationSectionStyleMenu({ section, label, values, disabled, onChange, mode = "style", inline = false }: {
  section: InviteSection;
  label: string;
  values: Pick<EditorValues, "imagePalette" | "sectionColor" | "panelStyle" | "textColorMode" | "textColor" | "accent" | "backgroundDimIntensity" | "backgroundImageUrl">;
  disabled: boolean;
  onChange(changes: Partial<InviteSection>): void;
  inline?: boolean;
  mode?: "style" | "alignment" | "text-margin" | "photo-margin" | "text-color" | "background-color";
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const openQueued = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const backgroundMode = mode === "background-color";
  const colorMode = mode === "text-color";
  const surfaceLocked = backgroundMode ? Boolean(values.sectionColor && values.sectionColor !== "auto") : colorMode ? isGlobalTextColorLocked(values.textColorMode) : mode === "style" && Boolean(values.panelStyle && values.panelStyle !== "auto");
  const lockedMessage = backgroundMode ? "Selecciona Por defecto en Los cinco tonos de tu imagen para personalizar cada bloque" : colorMode ? "Selecciona Por defecto en Color del texto de Apariencia para personalizar cada apartado" : "Selecciona Automático en Apariencia para personalizar el estilo de esta sección";
  const marginField = mode === "photo-margin" ? "photoMargin" : "textMargin";
  const marginMode = mode === "text-margin" || mode === "photo-margin";
  const tones = values.imagePalette ? imagePaletteColors(values.imagePalette) : [];
  const blockSelection = section.sectionColor ?? "auto";
  const paletteTarget = invitationSectionPaletteTarget(blockSelection, values.imagePalette);
  const blockColor = resolveInvitationSectionColor(blockSelection, values.imagePalette) ?? "#FFFFFF";
  const selected = backgroundMode ? blockSelection === "auto" ? "auto" : paletteTarget ? "palette" : "custom" : colorMode ? surfaceLocked ? values.textColorMode : section.textColorMode ?? "auto" : marginMode ? section[marginField] ?? section.margin ?? "default" : mode === "alignment" ? section.textAlign ?? "auto" : surfaceLocked ? values.panelStyle : section.panelStyle ?? "auto";
  const TriggerIcon = backgroundMode ? FiDroplet : colorMode ? FiType : marginMode ? FiMaximize : mode === "alignment" ? FiAlignCenter : FiLayers;
  const options: { value: string; label: string; Icon: IconType; changes: Partial<InviteSection>; tinted?: boolean }[] = backgroundMode
    ? [{ value: "auto", label: "Por defecto", Icon: FiLayers, changes: { sectionColor: "auto" } },
      ...(tones.length ? [{ value: "palette", label: "Mostrar la paleta de colores", Icon: FiGrid, changes: { sectionColor: paletteTarget ?? imagePaletteTargets[0] } }] : []),
      { value: "custom", label: "Personalizado", Icon: FiEdit3, changes: { sectionColor: `custom:${blockColor}` } }]
    : colorMode
    ? sectionTextColorOptions.map(option => ({ ...option, Icon: FiType, changes: { textColorMode: option.value } }))
    : marginMode
    ? ([{ value: "default", label: "Por defecto", Icon: FiSquare }, { value: "wide", label: "Más espacio", Icon: FiMinimize }, { value: "none", label: "Sin espacio", Icon: FiMaximize }] as const).map(option => ({ ...option, changes: { [marginField]: option.value } }))
    : mode === "alignment"
    ? ([{ value: "auto", label: "Automática", Icon: FiType }, { value: "left", label: "Izquierda", Icon: FiAlignLeft }, { value: "center", label: "Centro", Icon: FiAlignCenter }, { value: "right", label: "Derecha", Icon: FiAlignRight }] as const).map(option => ({ ...option, changes: { textAlign: option.value } }))
    : invitationSurfaceOptions.map(option => ({ ...option, Icon: surfaceIcons[option.value], changes: { panelStyle: option.value }, tinted: option.value === "blur-color" }));
  const customColor = (surfaceLocked ? values.textColor : section.textColor) ?? "#FFFFFF";

  useEffect(() => {
    if (disabled || surfaceLocked) {
      openQueued.current = false;
      panel.current?.hidePopover();
    }
  }, [disabled, surfaceLocked]);

  useEffect(() => () => {
    openQueued.current = false;
    window.clearTimeout(closeTimer.current);
  }, []);

  function keepOpen() {
    window.clearTimeout(closeTimer.current);
  }

  function showMenu() {
    keepOpen();
    if (disabled || surfaceLocked || openQueued.current) return;
    openQueued.current = true;
    // Showing an auto popover can restore focus to another trigger while its
    // native show operation is still running. Wait for that operation to finish.
    queueMicrotask(() => {
      if (!openQueued.current) return;
      openQueued.current = false;
      const menu = panel.current;
      if (menu?.isConnected && !menu.matches(":popover-open")) menu.showPopover();
    });
  }

  function scheduleClose() {
    keepOpen();
    openQueued.current = false;
    // Allow the pointer to cross the gap between the trigger and its options.
    closeTimer.current = window.setTimeout(() => {
      if (button.current?.matches(":focus-visible") || panel.current?.querySelector(":focus-visible")) return;
      panel.current?.hidePopover();
    }, 180);
  }

  const position = useCallback(() => {
    if (!button.current || !panel.current) return;
    const bounds = button.current.getBoundingClientRect();
    const paletteWidth = Math.min(300, window.innerWidth - 24);
    const left = Math.max(12, Math.min(bounds.left, window.innerWidth - (colorMode || backgroundMode ? paletteWidth + 12 : 56)));
    const width = Math.min(300, window.innerWidth - left - 12);
    const top = Math.min(bounds.bottom + 8, window.innerHeight - 100);
    panel.current.style.width = `${width}px`;
    panel.current.style.left = `${left}px`;
    panel.current.style.setProperty("--style-tooltip-width", `${Math.max(0, width - 52)}px`);
    panel.current.style.top = `${Math.max(12, top)}px`;
    panel.current.style.maxHeight = `${window.innerHeight - Math.max(12, top) - 12}px`;
  }, [colorMode, backgroundMode]);

  // Margin changes move the trigger during React's commit. Re-anchor before
  // painting so the open options stay directly below it.
  useLayoutEffect(() => {
    if (expanded) position();
  });

  useEffect(() => {
    if (!expanded) return;
    window.addEventListener("resize", position);
    const observer = new ResizeObserver(position);
    const editable = button.current?.closest("[data-editable]");
    if (editable) observer.observe(editable);
    if (button.current?.parentElement) observer.observe(button.current.parentElement);
    // Scrolling the invitation closes the menu instead of leaving it detached.
    const close = (event: Event) => {
      if (!panel.current?.contains(event.target as Node)) panel.current?.hidePopover();
    };
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", close, true);
      observer.disconnect();
    };
  }, [expanded, position]);

  const menuContent = <>
      {options.map(({ value, label: optionLabel, Icon, changes, tinted }) => {
        return <button key={value} type="button" className={styles.option} aria-label={optionLabel} title={surfaceLocked ? `${optionLabel}: ${lockedMessage}` : undefined} aria-pressed={selected === value} disabled={disabled || surfaceLocked} onClick={() => { if (!disabled && !surfaceLocked) { onChange(changes); } }}>
          <>{colorMode ? <span className={styles.colorSwatch} style={{ backgroundColor: invitationTextColor(values.accent, value, customColor, values.imagePalette) }} aria-hidden="true" /> : <Icon aria-hidden="true" />}</>
          {tinted && <LuDroplet className={styles.droplet} aria-hidden="true" />}
          <span className={styles.tooltip} aria-hidden="true">{optionLabel}</span>
        </button>;
      })}
      {backgroundMode && selected === "custom" && <label className={styles.customColor}>Color del bloque<input type="color" aria-label={`Color del bloque de ${section.title}`} value={blockColor} disabled={disabled || surfaceLocked} onChange={event => { if (!disabled && !surfaceLocked) onChange({ sectionColor: `custom:${event.target.value}` }); }} /></label>}
      {backgroundMode && selected === "palette" && <div className={styles.paletteTones} role="group" aria-label={`Paleta de colores para ${section.title}`}>{tones.map((tone, index) => <button key={tone} type="button" aria-label={tone.toUpperCase()} title={tone.toUpperCase()} aria-pressed={paletteTarget === imagePaletteTargets[index]} disabled={disabled || surfaceLocked} onClick={() => { if (!disabled && !surfaceLocked) onChange({ sectionColor: imagePaletteTargets[index] }); }} style={{ backgroundColor: tone }} />)}</div>}
      {colorMode && selected === "custom" && <label className={styles.customColor}>Color personalizado<input type="color" aria-label={`Color personalizado de ${section.title}`} value={customColor} disabled={disabled || surfaceLocked} onChange={event => { if (!disabled && !surfaceLocked) onChange({ textColor: event.target.value }); }} /></label>}
      {colorMode && selected === "palette" && values.imagePalette && <div className={styles.paletteTones} role="group" aria-label={`Tonos de la paleta para ${section.title}`}>{imagePaletteColors(values.imagePalette).map(color => <button key={color} type="button" aria-label={color.toUpperCase()} aria-pressed={invitationTextColor(values.accent, selected, customColor, values.imagePalette).toLowerCase() === color.toLowerCase()} disabled={disabled || surfaceLocked} onClick={() => { if (!disabled && !surfaceLocked) onChange({ textColor: color }); }} style={{ backgroundColor: color }} />)}</div>}
  </>;
  if (inline) return <div className={styles.inline} role="group" aria-label={label}>
    {surfaceLocked && <p className={styles.locked} role="status">{lockedMessage}.</p>}
    {menuContent}
  </div>;

  return <>
    <button ref={button} data-tour={marginMode || colorMode || backgroundMode ? undefined : mode === "alignment" ? "block-alignment" : "block-style"} type="button" className={`wa-edit-button ${backgroundMode ? "wa-edit-background-color" : colorMode ? "wa-edit-color" : marginMode ? "wa-edit-margin" : mode === "alignment" ? "wa-edit-alignment" : "wa-edit-surface"}`} aria-label={label} aria-expanded={expanded} aria-controls={id} popoverTarget={id} popoverTargetAction="show" onPointerEnter={event => { if (event.pointerType !== "touch") showMenu(); }} onPointerLeave={event => { if (event.pointerType !== "touch") scheduleClose(); }} onFocus={showMenu} onBlur={scheduleClose} disabled={disabled || surfaceLocked} title={surfaceLocked ? lockedMessage : undefined}><TriggerIcon aria-hidden="true" /><span>{backgroundMode ? "Color" : colorMode ? "Color del texto" : marginMode ? mode === "photo-margin" ? "Bordes de las fotos" : "Bordes del contenido" : mode === "alignment" ? "Alineación" : "Estilo"}</span></button>
    <div ref={panel} id={id} popover="auto" role="group" className={styles.menu} aria-label={label} onPointerEnter={keepOpen} onPointerLeave={event => { if (event.pointerType !== "touch") scheduleClose(); }} onFocus={keepOpen} onBlur={scheduleClose} onBeforeToggle={event => { if (event.newState === "open") position(); }} onToggle={event => setExpanded(event.newState === "open")}>
      {menuContent.props.children}
    </div>
  </>;
}
