"use client";

import { useId, type CSSProperties } from "react";
import { FiHeart } from "react-icons/fi";
import type { EditorValues } from "@/lib/invitation-editor";
import { atmosphereStyle } from "@/lib/invitation-atmosphere";
import { getInvitationFont, recommendedInvitationFonts } from "@/lib/invitation-fonts";
import { invitationStyleSteps, invitationSurfaceOptions } from "@/lib/invitation-style-journey";
import { sharedInvitationDesign } from "@/lib/shared-invitation";
import { InvitationCornersPicker } from "./InvitationCornersPicker";
import { InvitationIconsPicker } from "./InvitationIconsPicker";
import { InvitationTextColorPicker } from "./InvitationTextColorPicker";
import { invitationPaletteChanges } from "@/lib/invitation-palette-selection";
import { InvitationPalettePicker } from "./InvitationPalettePicker";
import { InvitationFontSelect } from "./InvitationFontSelect";
import { InvitationGlassBorderToggle } from "./InvitationGlassBorderToggle";
import { InvitationBackgroundBlurControl } from "./InvitationBackgroundBlurControl";
import { InvitationBackgroundDimControl } from "./InvitationBackgroundDimControl";
import styles from "./InvitationStyleJourney.module.css";

export function InvitationStyleJourney({ values, step, onStepChange, onChange }: { values: EditorValues; step: number; onStepChange(step: number): void; onChange(changes: Partial<EditorValues>): void }) {
  const id = useId();
  const surface = values.panelStyle ?? "auto";
  const intensity = values.blurIntensity ?? 50;
  const option = invitationSurfaceOptions.find(option => option.value === surface)!;
  return <div className={styles.journey}>
    <nav aria-label="Detalles de tu estilo"><ol className={styles.steps}>{invitationStyleSteps.map((item, index) => <li key={item.id}><button type="button" aria-current={step === index ? "step" : undefined} aria-label={`${index + 1}. ${item.label}`} onClick={() => onStepChange(index)}><span aria-hidden="true">{index + 1}</span><strong>{item.label}</strong></button></li>)}</ol></nav>
    <p className={styles.position}>Detalle {step + 1} de {invitationStyleSteps.length} · Puedes continuar con la opción seleccionada</p>
    {step === 0 && <InvitationCornersPicker value={values.sectionCorners} onChange={sectionCorners => onChange({ sectionCorners })} />}
    {step === 1 && <InvitationIconsPicker value={values.showSectionIcons} onChange={showSectionIcons => onChange({ showSectionIcons })} />}
    {step === 2 && <section className={styles.finish} aria-labelledby={`${id}-finish`}>
      <h2 id={`${id}-finish`}>Un fondo a tu estilo</h2>
      <p>Elige cómo se verá el fondo de los bloques. El texto siempre queda nítido.</p>
      <div className={styles.finishes} role="group" aria-label="Acabado de todas las secciones">{invitationSurfaceOptions.map(item => <button type="button" key={item.value} aria-pressed={surface === item.value} onClick={() => onChange({ panelStyle: item.value })}>{item.label}</button>)}</div>
      <p className={styles.help} role="status">{option.description}</p>
      {(surface === "glass" || surface === "auto") && <InvitationGlassBorderToggle value={values.glassBorder} onChange={glassBorder => onChange({ glassBorder })} />}
      {surface !== "color" && surface !== "none" && <div className={styles.intensity} style={{ "--intensity-progress": `${intensity}%` } as CSSProperties}>
        <label htmlFor={`${id}-intensity`}>Intensidad del desenfoque <output htmlFor={`${id}-intensity`}>{intensity}<span>%</span></output></label>
        <input id={`${id}-intensity`} type="range" min={0} max={100} step={1} value={intensity} aria-valuetext={`${intensity}% de intensidad`} aria-describedby={`${id}-intensity-help`} onChange={event => onChange({ blurIntensity: Number(event.target.value) })} />
        <div className={styles.scale} aria-hidden="true"><span>Más detalle</span><span>Más suave</span></div>
        <small id={`${id}-intensity-help`}>Mueve la barra y observa el cambio en la tarjeta de abajo.</small>
      </div>}
      <InvitationBackgroundBlurControl value={values.backgroundBlurIntensity} onChange={backgroundBlurIntensity => onChange({ backgroundBlurIntensity })} />
      <InvitationBackgroundDimControl value={values.backgroundDimIntensity} onChange={backgroundDimIntensity => onChange({ backgroundDimIntensity })} />
    </section>}
    {step === 3 && <><InvitationPalettePicker compact palettes={sharedInvitationDesign.palettes} imagePalette={values.imagePalette} sectionColor={values.sectionColor} accent={values.accent} backgroundImageUrl={values.backgroundImageUrl} onChange={(accent, imagePalette, sectionColor) => onChange(invitationPaletteChanges(values, accent, imagePalette ?? null, sectionColor))} /><InvitationTextColorPicker values={values} onChange={onChange} /></>}
    {step === 4 && <section className={styles.fonts} aria-labelledby={`${id}-fonts`}>
      <h2 id={`${id}-fonts`}>Las letras de tu celebración</h2><p>Una letra para los títulos y otra fácil de leer para los detalles.</p>
      <div className={styles.fontGrid}><InvitationFontSelect role="heading" eventType={values.eventType} value={values.typography} onChange={typography => onChange({ typography })} /><InvitationFontSelect role="body" eventType={values.eventType} value={values.bodyTypography} onChange={bodyTypography => onChange({ bodyTypography })} /></div>
      <button className={styles.suggestion} type="button" onClick={() => onChange({ typography: recommendedInvitationFonts(values.eventType, "heading")[0], bodyTypography: recommendedInvitationFonts(values.eventType, "body")[0] })}>Usar letras recomendadas</button>
    </section>}
    <figure className={styles.example} style={{ ...atmosphereStyle(values.accent, values), "--example-title-font": getInvitationFont(values.typography).family, "--example-body-font": getInvitationFont(values.bodyTypography).family } as CSSProperties}>
      <figcaption>Ejemplo con tus elecciones{!values.backgroundImageUrl && <span>Imagen de muestra · Puedes usar tu propio fondo</span>}</figcaption>
      <div className={styles.scene}>
        <div className={styles.backdrop} style={{ backgroundImage: `url(${JSON.stringify(values.backgroundImageUrl || "/demo/babyshower/jardin.webp")})` }} />
        <div className={styles.backgroundDim} aria-hidden="true" />
        <div className={styles.examplePanel} data-surface={surface === "auto" ? "blur" : surface}>
          {values.showSectionIcons !== false && <FiHeart className={styles.exampleIcon} aria-hidden="true" />}
          <h3>{values.hostNames || values.name || "Tu celebración"}</h3><p>Nos encantará compartir este día contigo.</p><span className={styles.exampleButton}>Cómo llegar</span>
        </div>
      </div>
    </figure>
  </div>;
}
