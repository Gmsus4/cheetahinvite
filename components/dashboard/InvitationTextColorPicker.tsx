"use client";

import { useEffect, useId, useState } from "react";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import type { EditorValues } from "@/lib/invitation-editor";
import { imagePaletteColors } from "@/lib/invitation-image-palette";
import { invitationTextColor, invitationTextContrast, textContrastRatio } from "@/lib/invitation-text-color";
import styles from "./InvitationTextColorPicker.module.css";

const options = [
  { value: "auto", label: "Por defecto (blanco)" },
  { value: "black", label: "Negro" }, { value: "white", label: "Blanco" },
  { value: "palette", label: "De la paleta" }, { value: "opposite", label: "Contraste de paleta" }, { value: "custom", label: "Personalizado" },
] as const;

function sampleImage(url: string, signal: AbortSignal): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const finish = (colors?: string[]) => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      image.onload = image.onerror = null;
      if (colors) resolve(colors); else reject(new Error("Image unavailable"));
    };
    const abort = () => { finish(); image.src = ""; };
    const timer = window.setTimeout(abort, 10000);
    signal.addEventListener("abort", abort, { once: true });
    image.onerror = () => finish();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 24;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) { finish(); return; }
        context.drawImage(image, 0, 0, 24, 24);
        const pixels = context.getImageData(0, 0, 24, 24).data;
        const colors: string[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] === 0) continue;
          colors.push("#" + [...pixels.slice(i, i + 3)].map(channel => channel.toString(16).padStart(2, "0")).join(""));
        }
        finish(colors);
      } catch { finish(); }
    };
    image.src = url;
  });
}

export function InvitationTextColorPicker({ values, onChange }: { values: Pick<EditorValues, "imagePalette" | "textColorMode" | "textColor" | "accent" | "backgroundImageUrl" | "backgroundDimIntensity" | "coverLayout" | "imageUrl">; onChange(changes: Partial<EditorValues>): void }) {
  const id = useId();
  const mode = values.textColorMode ?? "auto";
  const color = values.textColor ?? "#FFFFFF";
  const text = invitationTextColor(values.accent, mode, color, values.imagePalette);
  const sources = JSON.stringify([values.backgroundImageUrl || "", values.coverLayout === "overlay" ? values.imageUrl : ""]);
  const [sample, setSample] = useState<{ key: string; backgrounds: string[]; overlay: string[]; failed: boolean }>({ key: "", backgrounds: [], overlay: [], failed: false });
  useEffect(() => {
    const controller = new AbortController();
    const urls = JSON.parse(sources) as string[];
    void Promise.allSettled(urls.map(url => url ? sampleImage(url, controller.signal) : Promise.resolve([]))).then(results => {
      if (controller.signal.aborted) return;
      setSample({ key: sources, backgrounds: results[0].status === "fulfilled" ? results[0].value : [], overlay: results[1].status === "fulfilled" ? results[1].value : [], failed: results.some(result => result.status === "rejected") });
    });
    return () => controller.abort();
  }, [sources]);
  const hasPhotos = Boolean(values.backgroundImageUrl || (values.coverLayout === "overlay" && values.imageUrl));
  const ready = sample.key === sources;
  const ratio = Math.min(invitationTextContrast(text, values.accent, values.backgroundDimIntensity ?? 0, ready ? sample.backgrounds : [], values.imagePalette), ...(ready ? sample.overlay.map(background => textContrastRatio(text, background)) : []));
  const low = ratio < 4.5;
  const uncertain = hasPhotos && (!ready || sample.failed);
  const StatusIcon = low || uncertain ? FiAlertTriangle : FiCheckCircle;
  return <fieldset className={styles.picker}>
    <legend>Color del texto</legend>
    <p>Por defecto conserva el blanco habitual y permite personalizar cada apartado. Otro color se aplica a toda la invitación y bloquea los ajustes individuales.</p>
    <div className={styles.options} role="group" aria-label="Color general del texto">
      {options.map(option => <button key={option.value} type="button" aria-pressed={mode === option.value} onClick={() => onChange({ textColorMode: option.value })}>
        <span className={styles.swatch} style={{ backgroundColor: invitationTextColor(values.accent, option.value, color, values.imagePalette) }} aria-hidden="true" />{option.label}
      </button>)}
    </div>
    {mode === "opposite" && <p>Usa una variante clara de la misma paleta si su color es oscuro, u oscura si es claro.</p>}
    {mode === "palette" && values.imagePalette && <div className={styles.paletteTones} role="group" aria-label="Tonos de la paleta para el texto">{imagePaletteColors(values.imagePalette).map(tone => <button key={tone} type="button" aria-label={tone.toUpperCase()} aria-pressed={text.toLowerCase() === tone.toLowerCase()} onClick={() => onChange({ textColor: tone })}><i style={{ backgroundColor: tone }} aria-hidden="true" /><span>{tone.toUpperCase()}</span></button>)}</div>}
    {mode === "custom" && <div className={styles.custom}><label htmlFor={`${id}-color`}>Elige tu color</label><input id={`${id}-color`} type="color" value={color} onChange={event => onChange({ textColor: event.target.value })} /><output htmlFor={`${id}-color`}>{color.toUpperCase()}</output></div>}
    <div className={styles.contrast} data-warning={low || uncertain} role="status" aria-live="polite" aria-atomic="true">
      <StatusIcon aria-hidden="true" /><div><strong>{low ? "Contraste bajo" : uncertain ? ready ? "Contraste de la foto sin verificar" : "Analizando contraste de las fotos…" : "Buen contraste estimado"}</strong><p>{ratio.toFixed(2)}:1 · Referencia para texto normal: 4.5:1.</p>
      {low && <p>El texto puede ser difícil de leer. Prueba otro color o un fondo que lo haga resaltar.</p>}
      {hasPhotos && <p>{ready && sample.failed ? "No pudimos analizar alguna foto. La cifra usa los fondos disponibles; revisa la vista previa." : "Estimación conservadora: el contraste puede variar por la zona de la foto, la transparencia y el acabado. Revisa la vista previa."}</p>}
      </div>
    </div>
  </fieldset>;
}
