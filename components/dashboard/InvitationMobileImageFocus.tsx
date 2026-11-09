"use client";

import { FiArrowDown, FiArrowDownLeft, FiArrowDownRight, FiArrowLeft, FiArrowRight, FiArrowUp, FiArrowUpLeft, FiArrowUpRight, FiMinus } from "react-icons/fi";
import type { InviteSection, MobileImageFocus } from "@/lib/invitation-editor";

export function InvitationMobileImageFocus({ value = "center", onChange, device = "mobile" }: { value?: MobileImageFocus; onChange(value: MobileImageFocus): void; device?: "mobile" | "desktop" }) {
  const screen = device === "desktop" ? "escritorio" : "móvil";
  return <fieldset className="guided-section-surface mobile-image-focus">
    <legend>Encuadre de la foto en {screen}</legend>
    <div role="group" aria-label={`Parte visible de la foto en ${screen}`}>
      {([
        { value: "top-left", label: "Arriba izquierda", Icon: FiArrowUpLeft },
        { value: "top", label: "Arriba", Icon: FiArrowUp },
        { value: "top-right", label: "Arriba derecha", Icon: FiArrowUpRight },
        { value: "left", label: "Izquierda", Icon: FiArrowLeft },
        { value: "center", label: "Centro", Icon: FiMinus },
        { value: "right", label: "Derecha", Icon: FiArrowRight },
        { value: "bottom-left", label: "Abajo izquierda", Icon: FiArrowDownLeft },
        { value: "bottom", label: "Abajo", Icon: FiArrowDown },
        { value: "bottom-right", label: "Abajo derecha", Icon: FiArrowDownRight },
      ] as const).map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}><option.Icon aria-hidden="true" /><span>{option.label}</span></button>)}
    </div>
    <small>Elige qué parte de la foto mantener visible cuando se recorte en {screen}.</small>
  </fieldset>;
}

export function InvitationImageFocusFields({ section, onChange }: { section: InviteSection; onChange(changes: Partial<InviteSection>): void }) {
  return <>
    <InvitationMobileImageFocus value={section.mobileImageFocus} onChange={mobileImageFocus => onChange({ mobileImageFocus })} />
    <InvitationMobileImageFocus device="desktop" value={section.desktopImageFocus} onChange={desktopImageFocus => onChange({ desktopImageFocus })} />
  </>;
}
