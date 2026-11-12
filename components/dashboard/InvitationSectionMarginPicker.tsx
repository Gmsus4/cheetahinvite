"use client";

import type { InviteSection } from "@/lib/invitation-editor";
import styles from "./InvitationSectionMarginPicker.module.css";

const options = [
  { value: "default", label: "Por defecto" },
  { value: "wide", label: "Más espacio" },
  { value: "none", label: "Sin espacio" },
] as const;

export function InvitationSectionMarginPicker({ section, onChange, scope }: { scope?: "text" | "photo"; section: InviteSection; onChange(changes: Partial<InviteSection>): void }) {
  const hasPhotos = section.type !== "countdown" && section.type !== "closing";
  const fields: ("textMargin" | "photoMargin")[] = scope === "photo" ? ["photoMargin"] : scope === "text" ? ["textMargin"] : ["textMargin", ...(hasPhotos ? ["photoMargin" as const] : [])];
  return <section className={styles.groups} aria-label="Bordes en móvil">
    <p className={styles.help}>{scope === "photo" ? "Ajusta el espacio a los lados de las fotos en móvil." : scope === "text" ? "Ajusta el espacio a los lados del contenido en móvil." : "Ajusta el contenido y las fotos por separado en móvil."} En escritorio se conserva el ancho del diseño.</p>
    {fields.map(field => <fieldset className={styles.picker} key={field}>
    <legend>{field === "textMargin" ? "Bordes del contenido" : "Bordes de las fotos"}</legend>
    <div className={styles.options} role="group" aria-label={`Bordes ${field === "textMargin" ? "del contenido" : "de las fotos"} de ${section.title}`}>
      {options.map(option => <button key={option.value} type="button" aria-pressed={(section[field] ?? section.margin ?? "default") === option.value} onClick={() => onChange({ [field]: option.value })}>
        <span className={styles.sample} data-margin={option.value} aria-hidden="true"><i /></span>
        <span>{option.label}</span>
      </button>)}
    </div>
  </fieldset>)}
  </section>;
}
