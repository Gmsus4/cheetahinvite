"use client";
import { getInvitationFont, invitationFonts, recommendedInvitationFonts, type FontRole } from "@/lib/invitation-fonts";
export function InvitationFontSelect({ role, eventType, value, onChange }: { role: FontRole; eventType: string; value: string; onChange: (value: string) => void }) {
  const recommended = recommendedInvitationFonts(eventType, role);
  const id = role === "heading" ? "typography" : "bodyTypography";
  return <div className="editor-field editor-typography-field">
    <label htmlFor={id}>{role === "heading" ? "Tipografía de los títulos" : "Tipografía de los textos"}</label>
    <select id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} style={{ fontFamily: getInvitationFont(value).family }}>
      <optgroup label="Recomendadas para este evento">{recommended.map((fontId) => { const font = getInvitationFont(fontId); return <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>{font.label}</option>; })}</optgroup>
      <optgroup label="Más tipografías">{invitationFonts.filter((font) => !recommended.includes(font.id)).map((font) => <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>{font.label}</option>)}</optgroup>
    </select>
    <small className="editor-field-help">{role === "heading" ? "Para nombres y títulos de la invitación." : "Para descripciones, horarios, indicaciones y demás textos."} Todas las fuentes están disponibles; las recomendaciones cambian según el evento.</small>
  </div>;
}
