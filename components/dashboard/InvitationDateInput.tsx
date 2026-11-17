"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { invitationDateIssue, invitationToday } from "@/lib/invitation-date";
import styles from "./InvitationDateInput.module.css";

const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = new Intl.DateTimeFormat("es-MX", { dateStyle: "full", timeZone: "UTC" });
const weekdays = ["do", "lu", "ma", "mi", "ju", "vi", "sá"];
const keyFor = (date: Date) => date.toISOString().slice(0, 10);
function subscribeToday(update: () => void) {
  const interval = window.setInterval(update, 60000);
  window.addEventListener("focus", update);
  return () => { window.clearInterval(interval); window.removeEventListener("focus", update); };
}
const serverToday = () => "";

export function InvitationDateInput({ id, value, onValueChange, disabled, name }: { id: string; value: string; onValueChange(value: string): void; disabled?: boolean; name?: string }) {
  const popupId = useId();
  const helpId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const today = useSyncExternalStore(subscribeToday, invitationToday, serverToday);
  const [month, setMonth] = useState("");
  const [position, setPosition] = useState<CSSProperties>({});
  const first = new Date(`${month || "2000-01"}-01T12:00:00Z`);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(1 - first.getUTCDay() + index);
    return { date, key: keyFor(date) };
  });
  const past = Boolean(today && value && value < today);
  function prepare() {
    const minimum = invitationToday();
    setMonth((value && !invitationDateIssue(value) ? value : minimum).slice(0, 7));
    const bounds = trigger.current!.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    setPosition({ width, left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)), top: Math.max(12, Math.min(bounds.bottom + 6, window.innerHeight - 440)) });
  }
  function select(date: string) {
    // Check again in case the calendar remained open across midnight.
    if (invitationDateIssue(date)) return;
    onValueChange(date);
    popup.current?.hidePopover();
    trigger.current?.focus();
  }
  function moveMonth(offset: number) {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + offset);
    setMonth(keyFor(next).slice(0, 7));
  }
  return <div className={styles.root}>
    {name && <input type="hidden" name={name} value={value} />}
    <button ref={trigger} id={id} type="button" className={styles.trigger} disabled={disabled} popoverTarget={popupId} aria-haspopup="dialog" aria-describedby={past ? helpId : undefined} onClick={prepare}>
      <span>{value ? value.split("-").reverse().join("/") : "Selecciona una fecha"}</span><FiCalendar aria-hidden="true" />
    </button>
    <div ref={popup} id={popupId} popover="auto" role="dialog" aria-label="Elige la fecha del evento" className={styles.calendar} style={position} onToggle={event => {
      if (event.newState === "open") popup.current?.querySelector<HTMLButtonElement>('[data-selected="true"]:not(:disabled), [data-today="true"]:not(:disabled)')?.focus();
    }} onKeyDown={event => {
      const current = event.target as HTMLButtonElement;
      if (!current.dataset.date) return;
      const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (offset === undefined) return;
      event.preventDefault();
      const next = new Date(`${current.dataset.date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + offset);
      const key = keyFor(next);
      if (!invitationDateIssue(key)) popup.current?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus();
    }}>
      <div className={styles.header}>
        <button type="button" aria-label="Mes anterior" disabled={!today || month <= today.slice(0, 7)} onClick={() => moveMonth(-1)}><FiChevronLeft aria-hidden="true" /></button>
        <strong aria-live="polite">{monthLabel.format(first)}</strong>
        <button type="button" aria-label="Mes siguiente" onClick={() => moveMonth(1)}><FiChevronRight aria-hidden="true" /></button>
      </div>
      <p className={styles.hint}>Disponible desde hoy</p>
      <div className={styles.days}>
        {weekdays.map(day => <span key={day} className={styles.weekday} aria-hidden="true">{day}</span>)}
        {days.map(({ date, key }) => <button key={key} type="button" disabled={!today || key < today} aria-label={dayLabel.format(date)} aria-pressed={key === value} aria-current={key === today ? "date" : undefined} data-date={key} data-today={key === today} data-selected={key === value} data-outside={key.slice(0, 7) !== month} onClick={() => select(key)}>{date.getUTCDate()}</button>)}
      </div>
      <div className={styles.footer}>
        <button type="button" onClick={() => select("")}>Borrar</button>
        <button type="button" onClick={() => select(invitationToday())}>Hoy</button>
      </div>
    </div>
    {past && <small id={helpId} role="alert">Elige una fecha de hoy en adelante. No se permiten días que ya pasaron.</small>}
  </div>;
}
