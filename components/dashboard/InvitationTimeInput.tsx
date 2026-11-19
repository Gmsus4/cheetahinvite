"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { FiClock } from "react-icons/fi";
import shared from "./InvitationDateInput.module.css";
import styles from "./InvitationTimeInput.module.css";

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

export function InvitationTimeInput({ id, value, onValueChange, disabled, name, "aria-describedby": describedBy, "aria-invalid": invalid }: {
  id: string; value: string; onValueChange(value: string): void; disabled?: boolean; name?: string;
  "aria-describedby"?: string; "aria-invalid"?: boolean;
}) {
  const popupId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("12:00");
  const [position, setPosition] = useState<CSSProperties>({});
  const [hour, minute] = draft.split(":");

  function prepare() {
    setDraft(/^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "12:00");
    const bounds = trigger.current!.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    setPosition({ width, left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)), top: Math.max(12, Math.min(bounds.bottom + 6, window.innerHeight - 400)) });
  }

  function select(time: string) {
    onValueChange(time);
    popup.current?.hidePopover();
    trigger.current?.focus();
  }

  return <div className={shared.root} data-invalid={invalid || undefined}>
    {name && <input type="hidden" name={name} value={value} />}
    <button ref={trigger} id={id} type="button" className={shared.trigger} disabled={disabled} popoverTarget={popupId} aria-haspopup="dialog" aria-describedby={describedBy} onClick={prepare}>
      <span>{value || "Selecciona una hora"}</span><FiClock aria-hidden="true" />
    </button>
    <div ref={popup} id={popupId} popover="auto" role="dialog" aria-label="Elige la hora del evento" className={`${shared.calendar} ${styles.picker}`} style={position} onToggle={event => {
      if (event.newState !== "open") return;
      popup.current?.querySelectorAll<HTMLButtonElement>('[aria-pressed="true"]').forEach(button => button.scrollIntoView({ block: "center" }));
      popup.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
    }} onKeyDown={event => {
      const current = event.target as HTMLButtonElement;
      if (!current.dataset.part) return;
      const buttons = Array.from(current.parentElement!.querySelectorAll<HTMLButtonElement>("button"));
      const index = buttons.indexOf(current);
      const next = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: buttons.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      buttons[Math.max(0, Math.min(next, buttons.length - 1))]?.focus();
    }}>
      <div className={styles.heading}><strong>Elige la hora</strong><span aria-live="polite">{draft}</span></div>
      <p className={shared.hint}>Formato de 24 horas</p>
      <div className={styles.columns}>
        {[{ label: "Hora", part: "hour", values: hours, selected: hour }, { label: "Minutos", part: "minute", values: minutes, selected: minute }].map(column => <div key={column.part}>
          <div className={styles.label}>{column.label}</div>
          <div className={styles.options} role="group" aria-label={column.label}>
            {column.values.map(option => <button key={option} type="button" data-part={column.part} aria-label={`${column.label}: ${option}`} aria-pressed={option === column.selected} onClick={() => setDraft(column.part === "hour" ? `${option}:${minute}` : `${hour}:${option}`)}>{option}</button>)}
          </div>
        </div>)}
      </div>
      <div className={shared.footer}>
        <button type="button" onClick={() => select("")}>Borrar</button>
        <button type="button" className={styles.confirm} onClick={() => select(draft)}>Listo</button>
      </div>
    </div>
  </div>;
}
