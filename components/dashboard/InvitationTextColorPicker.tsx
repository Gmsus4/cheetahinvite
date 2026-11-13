"use client";

import type { EditorValues } from "@/lib/invitation-editor";
import { imagePaletteColors } from "@/lib/invitation-image-palette";
import styles from "./InvitationTextColorPicker.module.css";

const options = [
  { value: "auto", label: "Blanco (Por defecto)", color: "#fffaf2" },
  { value: "black", label: "Negro", color: "#000000" },
  { value: "white", label: "Blanco", color: "#FFFFFF" },
] as const;

export function InvitationTextColorPicker({ values, onChange }: { values: Pick<EditorValues, "imagePalette" | "textColorMode" | "textColor">; onChange(changes: Partial<EditorValues>): void }) {
  const mode = values.textColorMode ?? "auto";
  return <fieldset className={styles.picker}>
    <legend>Color del texto</legend>
    <p>Blanco (Por defecto) permite cambiar el texto de cada bloque. Cualquier otro color se aplica a todo el texto de la invitación.</p>
    <div className={styles.options} role="group" aria-label="Color general del texto">
      {options.map(option => <button key={option.value} type="button" aria-pressed={mode === option.value} onClick={() => onChange({ textColorMode: option.value })}>
        <span className={styles.swatch} style={{ backgroundColor: option.color }} aria-hidden="true" />{option.label}
      </button>)}
      {values.imagePalette && imagePaletteColors(values.imagePalette).map(tone => <button key={tone} type="button" aria-pressed={mode === "palette" && values.textColor?.toLowerCase() === tone.toLowerCase()} onClick={() => onChange({ textColorMode: "palette", textColor: tone })}>
        <span className={styles.swatch} style={{ backgroundColor: tone }} aria-hidden="true" />{tone.toUpperCase()}
      </button>)}
    </div>
    {!values.imagePalette && <p>Extrae una paleta de tu imagen para elegir sus cinco colores.</p>}
  </fieldset>;
}
