"use client";

import { useId, type CSSProperties } from "react";
import { atmosphereStyle } from "@/lib/invitation-atmosphere";
import { FiCheck, FiLayers, FiSliders, FiInfo, FiCircle, FiRotateCcw } from "react-icons/fi";
import type { EditorValues, InvitationPanelStyle } from "@/lib/invitation-editor";
import { invitationPalette } from "@/lib/shared-invitation";
import { getInvitationFont } from "@/lib/invitation-fonts";
import styles from "./InvitationSurfacePicker.module.css";

const options = [
  { value: "auto", label: "Por defecto", description: "Combina los acabados de cada sección." },
  { value: "blur", label: "Blur", description: "Un fondo suave y translúcido." },
  { value: "blur-color", label: "Blur color", description: "Transparencia con tu color temático." },
  { value: "color", label: "Color", description: "Tu color temático, sin transparencia." },
] as const;

export function InvitationSurfacePicker({ values, onChange, onBlurChange }: {
  values: Pick<EditorValues, "blurIntensity" | "panelStyle" | "accent" | "backgroundImageUrl" | "hostNames" | "name" | "typography" | "bodyTypography">;
  onChange(value: InvitationPanelStyle): void;
  onBlurChange(value: number): void;
}) {
  const sliderId = useId();
  const intensity = values.blurIntensity ?? 50;
  const palette = invitationPalette(values.accent);
  const selected = values.panelStyle ?? "auto";
  const theme = {
    ...atmosphereStyle(values.accent, values),
    "--blur-progress": `${intensity}%`,
    "--surface-base": palette.dark,
    "--surface-tint": palette.accent,
    "--surface-heading": getInvitationFont(values.typography).family,
    "--surface-body": getInvitationFont(values.bodyTypography).family,
  } as CSSProperties;
  return <fieldset className={styles.picker} style={theme}>
    <legend className={styles.srOnly}>El fondo de tus secciones</legend>
    <div className={styles.heading}><span className={styles.headingIcon} aria-hidden="true"><FiLayers /></span><div><span className={styles.eyebrow}>EL TOQUE FINAL</span><h2>Un fondo a tu estilo</h2></div></div>
    <p className={styles.intro}>Texturas suaves, color y transparencia. Encuentra el acabado que acompaña tu celebración.</p>
    <div className={styles.options} role="group" aria-label="Fondo de todas las secciones">
      {options.map(option => <button className={styles.option} key={option.value} type="button" aria-pressed={selected === option.value} onClick={() => onChange(option.value)}>
        <span className={styles.preview} aria-hidden="true">
          <span className={styles.backdrop} style={values.backgroundImageUrl ? { backgroundImage: `url(${JSON.stringify(values.backgroundImageUrl)})` } : undefined} />
          <span className={styles.samples}>
            {(["blur", "blur-color", "color"] as const).map((surface, index) => <span key={surface} className={styles.sample} data-surface={option.value === "auto" ? surface : option.value}>
              {index === 0 ? <><span className={styles.kicker}>UN DÍA ESPECIAL</span><span className={styles.names}>{values.hostNames || values.name || "Tu celebración"}</span></> : <><span className={styles.line} /><span className={styles.line} /></>}
            </span>)}
          </span>
        </span>
        <span className={styles.caption}><strong>{option.label}</strong><span className={styles.check} aria-hidden="true">{selected === option.value && <FiCheck />}</span></span>
        <span className={styles.description}>{option.description}</span>
      </button>)}
    </div>
    <div className={styles.intensity} data-disabled={selected === "color"}>
      <div className={styles.intensityHeading}>
        <div className={styles.intensityTitle}><span className={styles.sliderIcon} aria-hidden="true"><FiSliders /></span><div><label htmlFor={sliderId}>Intensidad del blur</label><span className={styles.intensitySubtitle}>El equilibrio entre detalle y suavidad</span></div></div>
        <div className={styles.valueActions}>
          <output className={styles.value} htmlFor={sliderId}>{intensity}<span>%</span></output>
          <button className={styles.reset} type="button" disabled={intensity === 50} title="Volver a la intensidad original (50%)" onClick={() => onBlurChange(50)}>Restablecer<FiRotateCcw aria-hidden="true" /></button>
        </div>
      </div>
      <div className={styles.sliderRow}>
        <span className={styles.clearIcon} aria-hidden="true"><FiCircle /></span>
        <input id={sliderId} type="range" min={0} max={100} step={1} value={intensity} disabled={selected === "color"} aria-describedby={sliderId + "-help"} aria-valuetext={intensity + "% de intensidad"} onChange={event => onBlurChange(Number(event.target.value))} />
        <span className={styles.blurIcon} aria-hidden="true"><FiCircle /></span>
      </div>
      <div className={styles.scale} aria-hidden="true"><span>Nítido</span><span>Suave</span><span>Difuminado</span></div>
      <p className={styles.sliderHelp} id={sliderId + "-help"}>{selected === "color" ? "Elige Blur o Blur color para ajustar la intensidad." : "Muévelo y descubre el cambio en las muestras. Tus textos siempre se mantienen nítidos."}</p>
    </div>
    <p className={styles.help} role="status"><FiInfo aria-hidden="true" /><span>{selected === "auto"
      ? "Se conservan los fondos originales y tus ajustes para cada sección."
      : "Se aplica a todas las secciones. Vuelve a «Por defecto» para recuperar o modificar tus ajustes individuales."}</span></p>
  </fieldset>;
}
