"use client";
import { invitationTextures } from '@/lib/invitation-textures';

export function InvitationTexturePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const texture = invitationTextures.find((item) => item.id === value) ?? invitationTextures[0];
  return <div className="editor-field editor-group-wide">
    <label htmlFor="texture">Textura de fondo</label>
    <select id="texture" name="texture" value={value} onChange={(event) => onChange(event.target.value)}>{invitationTextures.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
    <small className="editor-field-help">{texture.description} Se aplica a los fondos de los bloques, sin cubrir fotos ni adornos.</small>
    <div className="editor-texture-sample" data-texture={value} aria-hidden="true"><span>Un día para recordar</span></div>
  </div>;
}
