"use client";

import Image from 'next/image';
import { invitationTemplates } from '@/lib/invitation-templates';

export function InvitationTemplatePicker({ eventType, value, onChange, guided = false }: { eventType: string; value: string; onChange: (value: string) => void; guided?: boolean }) {
  return <fieldset className="editor-template-picker editor-group-wide">
    <legend>{guided ? "Elige tu diseño" : "Decoración de la invitación"}</legend>
    <p className="editor-field-help">{eventType === "birthday" ? "Elige una invitación con ilustraciones, texturas y composición propias. Puedes personalizar los textos, las fotos y el color principal." : "Agrega adornos a tus bloques. Tus fotos, textos, colores y tipografías se conservan."}</p>
    <div className="editor-template-options">
      <label className={`editor-template-option${value === 'none' ? ' is-selected' : ''}`}>
        <input type="radio" name="templateId" value="none" checked={value === 'none'} onChange={() => onChange('none')} />
        <span className="editor-template-thumbnail"><i>Tu celebración</i><span>{guided ? "Composición sencilla y personalizable" : "Diseño actual"}</span></span><strong>{guided ? "Esencial" : "Sin plantilla"}</strong>
      </label>
      {invitationTemplates.filter((template) => template.eventType === eventType).map((template) => <label key={template.id} className={`editor-template-option${value === template.id ? ' is-selected' : ''}${!template.available ? ' is-unavailable' : ''}`}>
        <input type="radio" name="templateId" value={template.id} checked={value === template.id} disabled={!template.available} onChange={() => onChange(template.id)} />
        <span className="editor-template-thumbnail">
          {template.assets.topLeft && <Image className="template-thumb-top-left" src={template.assets.topLeft} alt="" width={100} height={110} unoptimized />}
          {template.assets.bottomRight && <Image className="template-thumb-bottom-right" src={template.assets.bottomRight} alt="" width={100} height={110} unoptimized />}
          <i>Tu celebración</i><span>{template.available ? (guided ? 'Ilustraciones y textura de papel' : 'Decoración disponible') : 'Imágenes pendientes'}</span>
        </span><strong>{template.label}</strong>
      </label>)}
    </div>
    {eventType === "birthday" && <a href="/ejemplo-invitacion/cumpleanos-confeti" target="_blank" rel="noopener noreferrer" className="editor-field-help">Ver invitación completa de Confeti ↗</a>}
  </fieldset>;
}
