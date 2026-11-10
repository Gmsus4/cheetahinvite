"use client";

import { useState } from "react";
import type { InviteSection } from "@/lib/invitation-editor";
import { invitationWhatsAppLink, parseInvitationWhatsAppLink, splitWhatsAppPhone } from "@/lib/invitation-whatsapp";

export function InvitationWhatsAppFields({ section, onChange, fieldErrors = {} }: { fieldErrors?: Record<string, string>; section: InviteSection; onChange(changes: Partial<InviteSection>): void }) {
  const existing = parseInvitationWhatsAppLink(section.link);
  const [destination, setDestination] = useState(section.whatsappPhone !== undefined || !section.link || existing ? "whatsapp" : "link");
  const phone = section.whatsappPhone ?? existing?.phone ?? "";
  const message = section.whatsappMessage ?? existing?.message ?? "";
  const prefix = section.id;
  const { countryCode, number } = splitWhatsAppPhone(phone);
  const validNumber = countryCode && number && invitationWhatsAppLink(phone, "") && (countryCode !== "52" || number.length === 10);
  const invalidPhone = Boolean(number && !validNumber);
  function update(phone: string, message: string) {
    const parts = splitWhatsAppPhone(phone);
    const complete = parts.countryCode && parts.number && (parts.countryCode !== "52" || parts.number.length === 10);
    onChange({ whatsappPhone: phone, whatsappMessage: message, link: complete ? invitationWhatsAppLink(phone, message) : "" });
  }
  return <>
    <div className="guided-field">
      <label htmlFor={`${prefix}-destination`}>Dónde confirmar</label>
      <select id={`${prefix}-destination`} value={destination} onChange={event => {
        const next = event.target.value;
        setDestination(next);
        if (next === "whatsapp") update("", "");
        else onChange({ whatsappPhone: undefined, whatsappMessage: undefined, link: "" });
      }}><option value="whatsapp">WhatsApp</option><option value="link">Otro enlace de confirmación</option></select>
    </div>
    {fieldErrors[`${prefix}-phone`] && <small role="alert" style={{color:"var(--danger)"}}>{fieldErrors[`${prefix}-phone`]}</small>}
    {fieldErrors[`${prefix}-link`] && <small role="alert" style={{color:"var(--danger)"}}>{fieldErrors[`${prefix}-link`]}</small>}
    {destination === "whatsapp" ? <>
      <div className="guided-field" data-preview-field={`${prefix}-phone`} data-preview-label="Número de WhatsApp">
        <label htmlFor={`${prefix}-phone`}>Número de WhatsApp</label>
        <div className="guided-phone-input">
          <div className="guided-phone-country"><input id={`${prefix}-country-code`} aria-label="Clave de país" type="tel" inputMode="numeric" autoComplete="tel-country-code" pattern="\+?[0-9]*" maxLength={4} value={`+${countryCode}`} onChange={event => update(`+${event.target.value.replace(/\D/g, "").slice(0, 3)} ${number}`, message)} /></div>
          <input id={`${prefix}-phone`} type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]*" maxLength={40} value={number} placeholder="5512345678" aria-invalid={invalidPhone || Boolean(fieldErrors[`${prefix}-phone`])} aria-describedby={`${prefix}-phone-help`} onChange={event => {
            const value = event.target.value;
            // Accept a pasted international number without duplicating its prefix.
            if (/^\s*\+/.test(value)) {
              const pasted = splitWhatsAppPhone(value.trim());
              update(`+${pasted.countryCode} ${pasted.number}`, message);
            } else update(`+${countryCode} ${value.replace(/\D/g, "").slice(0, countryCode === "52" ? 10 : 15 - countryCode.length)}`, message);
          }} />
        </div>
        <small id={`${prefix}-phone-help`} data-invalid={invalidPhone}>{countryCode === "52" ? "Introduce los 10 dígitos de tu número, sin la clave +52." : invalidPhone ? "Revisa la clave de país y el número: deben sumar de 7 a 15 dígitos." : "Introduce tu número sin la clave de país."}</small>
      </div>
      <div className="guided-field" data-preview-field={`${prefix}-whatsapp-message`} data-preview-label="Mensaje de WhatsApp">
        <label htmlFor={`${prefix}-whatsapp-message`}>Mensaje de WhatsApp (opcional)</label>
        <textarea id={`${prefix}-whatsapp-message`} rows={3} maxLength={200} value={message} placeholder="Hola, quiero confirmar mi asistencia al evento." aria-describedby={`${prefix}-whatsapp-help`} onChange={event => update(phone, event.target.value)} />
        <small id={`${prefix}-whatsapp-help`}>Este mensaje aparecerá listo para que tu invitado lo envíe. Generamos el enlace automáticamente.</small>
      </div>
    </> : <div className="guided-field" data-preview-field={`${prefix}-link`} data-preview-label="Enlace de confirmación">
      <label htmlFor={`${prefix}-link`}>Enlace de confirmación</label>
      <input id={`${prefix}-link`} type="url" maxLength={500} value={section.link} placeholder="https://…" onChange={event => onChange({ link: event.target.value })} />
    </div>}
  </>;
}
