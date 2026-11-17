"use client";

import Image from "next/image";
import { useState } from "react";
import { FiArrowDown, FiArrowDownLeft, FiArrowDownRight, FiArrowLeft, FiArrowRight, FiArrowUp, FiArrowUpLeft, FiArrowUpRight, FiMinus, FiMonitor, FiSmartphone } from "react-icons/fi";
import type { InviteSection, MobileImageFocus } from "@/lib/invitation-editor";
import type { InvitationCoverLayout } from "@/lib/invitation-cover-layout";
import styles from "./InvitationMobileImageFocus.module.css";

const positions = [
  { value: "top-left", label: "Arriba izquierda", position: "left top", Icon: FiArrowUpLeft },
  { value: "top", label: "Arriba", position: "center top", Icon: FiArrowUp },
  { value: "top-right", label: "Arriba derecha", position: "right top", Icon: FiArrowUpRight },
  { value: "left", label: "Izquierda", position: "left center", Icon: FiArrowLeft },
  { value: "center", label: "Centro", position: "center center", Icon: FiMinus },
  { value: "right", label: "Derecha", position: "right center", Icon: FiArrowRight },
  { value: "bottom-left", label: "Abajo izquierda", position: "left bottom", Icon: FiArrowDownLeft },
  { value: "bottom", label: "Abajo", position: "center bottom", Icon: FiArrowDown },
  { value: "bottom-right", label: "Abajo derecha", position: "right bottom", Icon: FiArrowDownRight },
] as const;

type Device = "mobile" | "desktop";

export function InvitationMobileImageFocus({ value, onChange, device = "mobile", imageUrl, cover = false, coverLayout = "split" }: { value?: MobileImageFocus; onChange(value: MobileImageFocus): void; device?: Device; imageUrl?: string; cover?: boolean; coverLayout?: InvitationCoverLayout }) {
  const screen = device === "desktop" ? "escritorio" : "móvil";
  const selected = positions.find(option => option.value === value) ?? positions[4];
  const defaultPosition = cover && coverLayout === "stacked" ? "center 25%" : cover && coverLayout !== "overlay" ? "center 42%" : "center 35%";
  return <fieldset className={styles.picker}>
    <legend>Encuadre de la foto en {screen}</legend>
    <div className={styles.preview} data-has-image={Boolean(imageUrl)} data-device={device} data-cover={cover} data-cover-layout={cover ? coverLayout : undefined}>
      {imageUrl && <Image className={styles.image} src={imageUrl} alt={`Vista previa del encuadre en ${screen}`} width={900} height={1000} unoptimized style={{ objectPosition: value ? selected.position : defaultPosition }} />}
      <div className={styles.positions} role="group" aria-label={`Parte visible de la foto en ${screen}`}>
        {positions.map(option => <button className={styles.position} key={option.value} type="button" title={option.label} aria-label={option.label} aria-pressed={value === option.value} onClick={() => onChange(option.value)}><option.Icon aria-hidden="true" /><span className={imageUrl ? styles.srOnly : undefined}>{option.label}</span></button>)}
      </div>
    </div>
    <p className={styles.selection} role="status">{value ? selected.label : "Encuadre original"}<span> · {device === "mobile" ? "Móvil" : "Escritorio"}</span></p>
  </fieldset>;
}

export function InvitationImageFocusFields({ section, onChange, imageUrl, coverLayout }: { section: InviteSection; onChange(changes: Partial<InviteSection>): void; imageUrl?: string; coverLayout?: InvitationCoverLayout }) {
  const [device, setDevice] = useState<Device>("mobile");
  const photo = imageUrl ?? (section.type === "gallery" ? section.imageUrls?.[0] || section.imageUrl : section.imageUrl);
  return <section className={styles.editor} aria-label="Ajustar el encuadre de la foto">
    <div className={styles.devices} role="group" aria-label="Dispositivo del encuadre">
      <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><FiSmartphone aria-hidden="true" />Móvil</button>
      <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><FiMonitor aria-hidden="true" />Escritorio</button>
    </div>
    <p className={styles.help}>Pulsa las flechas sobre la foto para elegir qué parte mantener visible.</p>
    <InvitationMobileImageFocus device={device} imageUrl={photo} cover={section.type === "cover"} coverLayout={coverLayout} value={device === "mobile" ? section.mobileImageFocus : section.desktopImageFocus} onChange={value => onChange(device === "mobile" ? { mobileImageFocus: value } : { desktopImageFocus: value })} />
    {section.type === "gallery" && (section.imageUrls?.length ?? 0) > 1 && <p className={styles.help}>Este encuadre se aplica a todas las fotos de la galería.</p>}
  </section>;
}
