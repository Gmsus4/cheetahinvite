"use client";

import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiImage } from 'react-icons/fi';
import { extractBackgroundPalette, invitationPaletteChoices, paletteFromAccent } from '@/lib/invitation-palettes';
import type { InvitationPalette } from '@/lib/invitation-palettes';
import { imagePaletteColors, type InvitationImagePalette } from '@/lib/invitation-image-palette';
import styles from './InvitationPalettePicker.module.css';

export function InvitationPalettePicker({ palettes, accent, imagePalette, backgroundImageUrl, onChange, compact = false }: {
  palettes: InvitationPalette[]; accent: string; imagePalette?: InvitationImagePalette | null; backgroundImageUrl?: string; onChange: (accent: string, imagePalette?: InvitationImagePalette | null) => void; compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [photo, setPhoto] = useState<InvitationImagePalette | null>(imagePalette ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const background = useRef(backgroundImageUrl);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { background.current = backgroundImageUrl; }, [backgroundImageUrl]);
  useEffect(() => () => { request.current++; }, []);
  const choices = invitationPaletteChoices(palettes);
  const current = !imagePalette && !choices.some(palette => palette.accent.toLowerCase() === accent.toLowerCase()) ? paletteFromAccent(accent, 'Color personalizado') : null;
  const fromPhoto = imagePalette ?? photo;
  const extra = current;
  const display = extra && !choices.some(palette => palette.accent.toLowerCase() === extra.accent.toLowerCase()) ? [...choices, extra] : choices;
  const initialCount = Math.min(6, palettes.length);
  const visible = compact && !expanded ? display.filter((palette, index) => index < initialCount || palette.accent.toLowerCase() === accent.toLowerCase()) : display;
  function select(value: string, colors: InvitationImagePalette | null = null) {
    if (imagePalette && !colors) setPhoto(imagePalette);
    request.current++;
    setLoading(false);
    setError('');
    onChange(value, colors);
  }
  async function extract(url: string, fromBackground = false) {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const palette = await extractBackgroundPalette(url);
      if (request.current !== id || (fromBackground && background.current !== url)) return;
      if (!palette.colors) throw new Error('No image palette');
      setPhoto(palette.colors);
      onChange(palette.accent, palette.colors);
    } catch {
      if (request.current === id && (!fromBackground || background.current === url)) setError('No pudimos obtener los colores de esta imagen. Intenta de nuevo o elige una de las paletas.');
    } finally {
      if (request.current === id) setLoading(false);
    }
  }
  return <fieldset className="guided-palettes">
    <legend>El color de tu celebración</legend>
    <p>Explora los colores básicos o crea una combinación a partir de tu foto de fondo.</p>
    <div>{visible.map(palette => <label key={palette.accent.toLowerCase()}>
      <input type="radio" name="invitation-palette" checked={!imagePalette && accent.toLowerCase() === palette.accent.toLowerCase()} onChange={() => select(palette.accent)} />
      <span className="guided-palette-swatches" aria-hidden="true">{[palette.paper, palette.panel, palette.accent, palette.dark].map((color, index) => <i key={index} style={{ background: color }} />)}</span>
      <strong>{palette.label}</strong>{accent.toLowerCase() === palette.accent.toLowerCase() && <FiCheck />}
    </label>)}</div>
    {compact && display.length > initialCount && <button className="guided-more-colors" type="button" aria-expanded={expanded} onClick={() => setExpanded(current => !current)}>{expanded ? "Mostrar menos colores" : "Ver más colores"}</button>}
    <section className="guided-photo-palette" aria-labelledby="photo-palette-title" aria-busy={loading}>
      <FiImage aria-hidden="true" /><div><h2 id="photo-palette-title">Los colores de tu foto</h2>
        <p>Obtén cinco tonos de tu imagen: uno claro, uno oscuro y tres acentos. Puedes usar el fondo actual o elegir otra imagen para analizarla.</p>
        <div className={styles.actions}><button type="button" disabled={!backgroundImageUrl || loading} onClick={() => { if (backgroundImageUrl) void extract(backgroundImageUrl, true); }}>{loading ? 'Obteniendo colores…' : 'Obtener paleta del fondo'}</button>
        <button type="button" disabled={loading} onClick={() => fileInput.current?.click()}>Elegir otra imagen</button></div>
        <input hidden ref={fileInput} type="file" accept="image/*" aria-label="Imagen para obtener una paleta de colores" onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = '';
          if (!file) return;
          const url = URL.createObjectURL(file);
          try { await extract(url); } finally { URL.revokeObjectURL(url); }
        }} />
        {loading && <small role="status">Analizando los tonos de tu imagen…</small>}
        {error && <small role="alert">{error}</small>}
        {!loading && fromPhoto && <small role="status">Paleta lista. Elige un tono para el fondo; los cinco estarán disponibles para el texto.</small>}
      </div>
    </section>
    {fromPhoto && <section className={styles.extracted} aria-label="Paleta de cinco colores de la imagen">
      <h2>Los cinco tonos de tu imagen</h2>
      <p>Selecciona un tono para el fondo. En Color del texto puedes usar el claro, el oscuro o cualquiera de los tres acentos.</p>
      <div className={styles.tones}>{imagePaletteColors(fromPhoto).map((color, index) => <button key={`${index}-${color}`} type="button" aria-label={`Usar ${color.toUpperCase()} como fondo`} aria-pressed={Boolean(imagePalette) && accent.toLowerCase() === color.toLowerCase()} onClick={() => select(color, fromPhoto)}>
        <i style={{ backgroundColor: color }} aria-hidden="true" /><strong>{index === 0 ? 'Claro' : index === 1 ? 'Oscuro' : `Acento ${index - 1}`}</strong><span>{color.toUpperCase()}</span>
      </button>)}</div>
    </section>}
  </fieldset>;
}
