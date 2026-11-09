"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FiAlignCenter, FiAlignLeft, FiAlignRight, FiLayers, FiType } from "react-icons/fi";
import type { IconType } from "react-icons";
import { LuDroplet, LuLayers3, LuPaintBucket, LuRectangleHorizontal, LuWandSparkles } from "react-icons/lu";
import { TbBackground } from "react-icons/tb";
import type { EditorValues, InviteSection } from "@/lib/invitation-editor";
import { invitationSurfaceOptions } from "@/lib/invitation-style-journey";
import styles from "./InvitationSectionStyleMenu.module.css";

const surfaceIcons = { auto: LuLayers3, blur: LuWandSparkles, "blur-color": LuWandSparkles, color: LuPaintBucket, glass: LuRectangleHorizontal, none: TbBackground };

export function InvitationSectionStyleMenu({ section, label, values, disabled, onChange, mode = "style" }: {
  section: InviteSection;
  label: string;
  values: Pick<EditorValues, "panelStyle">;
  disabled: boolean;
  onChange(changes: Partial<InviteSection>): void;
  mode?: "style" | "alignment";
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);
  const surfaceLocked = mode === "style" && Boolean(values.panelStyle && values.panelStyle !== "auto");
  const selected = mode === "alignment" ? section.textAlign ?? "auto" : surfaceLocked ? values.panelStyle : section.panelStyle ?? "auto";
  const TriggerIcon = mode === "alignment" ? FiAlignCenter : FiLayers;
  const options: { value: string; label: string; Icon: IconType; changes: Partial<InviteSection>; tinted?: boolean }[] = mode === "alignment"
    ? ([{ value: "auto", label: "Automática", Icon: FiType }, { value: "left", label: "Izquierda", Icon: FiAlignLeft }, { value: "center", label: "Centro", Icon: FiAlignCenter }, { value: "right", label: "Derecha", Icon: FiAlignRight }] as const).map(option => ({ ...option, changes: { textAlign: option.value } }))
    : invitationSurfaceOptions.map(option => ({ ...option, Icon: surfaceIcons[option.value], changes: { panelStyle: option.value }, tinted: option.value === "blur-color" }));

  useEffect(() => {
    if (disabled || surfaceLocked) panel.current?.hidePopover();
  }, [disabled, surfaceLocked]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function keepOpen() {
    window.clearTimeout(closeTimer.current);
  }

  function showMenu() {
    keepOpen();
    if (!disabled && !surfaceLocked && !panel.current?.matches(":popover-open")) panel.current?.showPopover();
  }

  function scheduleClose() {
    keepOpen();
    // Allow the pointer to cross the gap between the trigger and its options.
    closeTimer.current = window.setTimeout(() => {
      if (button.current?.matches(":focus-visible") || panel.current?.querySelector(":focus-visible")) return;
      panel.current?.hidePopover();
    }, 180);
  }

  function position() {
    if (!button.current || !panel.current) return;
    const bounds = button.current.getBoundingClientRect();
    const left = Math.max(12, Math.min(bounds.left, window.innerWidth - 56));
    const width = Math.min(300, window.innerWidth - left - 12);
    const top = Math.min(bounds.bottom + 8, window.innerHeight - 100);
    panel.current.style.width = `${width}px`;
    panel.current.style.left = `${left}px`;
    panel.current.style.setProperty("--style-tooltip-width", `${Math.max(0, width - 52)}px`);
    panel.current.style.top = `${Math.max(12, top)}px`;
    panel.current.style.maxHeight = `${window.innerHeight - Math.max(12, top) - 12}px`;
  }

  useEffect(() => {
    if (!expanded) return;
    window.addEventListener("resize", position);
    // Scrolling the invitation closes the menu instead of leaving it detached.
    const close = (event: Event) => {
      if (!panel.current?.contains(event.target as Node)) panel.current?.hidePopover();
    };
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", close, true);
    };
  }, [expanded]);

  return <>
    <button ref={button} type="button" className={`wa-edit-button ${mode === "alignment" ? "wa-edit-alignment" : "wa-edit-surface"}`} aria-label={label} aria-expanded={expanded} aria-controls={id} popoverTarget={id} popoverTargetAction="show" onPointerEnter={event => { if (event.pointerType !== "touch") showMenu(); }} onPointerLeave={event => { if (event.pointerType !== "touch") scheduleClose(); }} onFocus={showMenu} onBlur={scheduleClose} disabled={disabled || surfaceLocked} title={surfaceLocked ? "Selecciona Automático en Apariencia para personalizar el estilo de esta sección" : undefined}><TriggerIcon aria-hidden="true" /><span>{mode === "alignment" ? "Alineación" : "Estilo"}</span></button>
    <div ref={panel} id={id} popover="auto" role="group" className={styles.menu} aria-label={label} onPointerEnter={keepOpen} onPointerLeave={event => { if (event.pointerType !== "touch") scheduleClose(); }} onFocus={keepOpen} onBlur={scheduleClose} onBeforeToggle={event => { if (event.newState === "open") position(); }} onToggle={event => setExpanded(event.newState === "open")}>
      {options.map(({ value, label: optionLabel, Icon, changes, tinted }) => {
        return <button key={value} type="button" className={styles.option} aria-label={optionLabel} title={surfaceLocked ? `${optionLabel}: selecciona Automático en Apariencia para personalizar esta sección` : undefined} aria-pressed={selected === value} disabled={disabled || surfaceLocked} onClick={() => { if (!disabled && !surfaceLocked) onChange(changes); }}>
          <Icon aria-hidden="true" />
          {tinted && <LuDroplet className={styles.droplet} aria-hidden="true" />}
          <span className={styles.tooltip} aria-hidden="true">{optionLabel}</span>
        </button>;
      })}
    </div>
  </>;
}
