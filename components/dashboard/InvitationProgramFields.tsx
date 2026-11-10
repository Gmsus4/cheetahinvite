"use client";

import { useState } from "react";
import { FiArrowUp, FiArrowDown, FiPlus, FiTrash2 } from "react-icons/fi";
import { parseInvitationProgram, serializeInvitationProgram, type ProgramActivity } from "@/lib/invitation-program";

export function InvitationProgramFields({ id, content, onChange, fieldErrors = {} }: { fieldErrors?: Record<string, string>; id: string; content: string; onChange(content: string): void }) {
  const items = parseInvitationProgram(content);
  const [error, setError] = useState("");
  function update(next: ProgramActivity[]) {
    const value = serializeInvitationProgram(next);
    if (value.length > 2000) {
      setError("El itinerario alcanzó el límite de texto. Acorta alguna actividad para continuar.");
      return;
    }
    setError("");
    onChange(value);
  }
  function move(index: number, direction: number) {
    const next = [...items];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    update(next);
  }
  return <fieldset className="guided-program" data-preview-field={`${id}-content`} data-preview-label="Actividades del itinerario">
    <legend>Actividades del itinerario</legend>
    <p>Agrega cada momento por separado. La hora es opcional; puedes cambiar el orden con las flechas.</p>
    <ol>
      {items.map((item, index) => <li key={index}>
        <div className="guided-program-row-heading"><span>Actividad {index + 1}</span><div role="group" aria-label={`Acciones de la actividad ${index + 1}`}>
          <button type="button" title="Subir" aria-label={`Subir actividad ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}><FiArrowUp aria-hidden="true" /></button>
          <button type="button" title="Bajar" aria-label={`Bajar actividad ${index + 1}`} disabled={index === items.length - 1} onClick={() => move(index, 1)}><FiArrowDown aria-hidden="true" /></button>
          <button type="button" title="Eliminar" aria-label={`Eliminar actividad ${index + 1}`} disabled={items.length === 1 && !item.time && !item.activity} onClick={() => update(items.filter((_, position) => position !== index))}><FiTrash2 aria-hidden="true" /></button>
        </div></div>
        <div className="guided-program-row-fields">
          <div className="guided-field"><label htmlFor={`${id}-activity-${index}-time`}>Hora <span>(opcional)</span></label><input id={`${id}-activity-${index}-time`} type="time" value={item.time} onChange={event => update(items.map((row, position) => position === index ? { ...row, time: event.target.value } : row))} /></div>
          <div className="guided-field"><label htmlFor={`${id}-activity-${index}-text`}>¿Qué sucederá?</label><input id={`${id}-activity-${index}-text`} aria-invalid={Boolean(fieldErrors[`${id}-activity-${index}-text`])} aria-describedby={fieldErrors[`${id}-activity-${index}-text`] ? `${id}-activity-${index}-error` : undefined} value={item.activity} maxLength={2000} placeholder="Ej. Llegada de invitados" onChange={event => update(items.map((row, position) => position === index ? { ...row, activity: event.target.value } : row))} /></div>
        </div>
        {fieldErrors[`${id}-activity-${index}-text`] && <small id={`${id}-activity-${index}-error`} role="alert" style={{ color: 'var(--danger)' }}>{fieldErrors[`${id}-activity-${index}-text`]}</small>}
      </li>)}
    </ol>
    <button className="guided-program-add" type="button" onClick={() => update([...items, { time: "", activity: "" }])}><FiPlus aria-hidden="true" />Agregar actividad</button>
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}
