"use client";

import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiImage } from 'react-icons/fi';
import { extractBackgroundPalette, invitationPaletteChoices, paletteFromAccent } from '@/lib/invitation-palettes';
import type { InvitationPalette } from '@/lib/invitation-palettes';

export function InvitationPalettePicker({ palettes, accent, backgroundImageUrl, onChange, compact = false }: {
  palettes: InvitationPalette[]; accent: string; backgroundImageUrl?: string; onChange: (accent: string) => void; compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [photo, setPhoto] = useState<{ url: string; palette: InvitationPalette } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const background = useRef(backgroundImageUrl);
  useEffect(() => { background.current = backgroundImageUrl; }, [backgroundImageUrl]);
  useEffect(() => () => { request.current++; }, []);
  const choices = invitationPaletteChoices(palettes);
  const current = !choices.some(palette => palette.accent.toLowerCase() === accent.toLowerCase()) ? paletteFromAccent(accent, 'Color personalizado') : null;
  const fromPhoto = photo && photo.url === backgroundImageUrl ? photo.palette : null;
  const extra = fromPhoto ?? current;
  const display = extra && !choices.some(palette => palette.accent.toLowerCase() === extra.accent.toLowerCase()) ? [...choices, extra] : choices;
  const initialCount = Math.min(6, palettes.length);
  const visible = compact && !expanded ? display.filter((palette, index) => index < initialCount || palette.accent.toLowerCase() === accent.toLowerCase()) : display;
  function select(value: string) {
    request.current++;
    setLoading(false);
    setError('');
    onChange(value);
  }
  async function extract() {
    if (!backgroundImageUrl) return;
    const url = backgroundImageUrl;
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const palette = await extractBackgroundPalette(url);
      if (request.current !== id || background.current !== url) return;
      setPhoto({ url, palette });
      onChange(palette.accent);
    } catch {
      if (request.current === id && background.current === url) setError('No pudimos obtener los colores de esta imagen. Intenta de nuevo o elige una de las paletas.');
    } finally {
      if (request.current === id) setLoading(false);
    }
  }
  return <fieldset className="guided-palettes">
    <legend>El color de tu celebración</legend>
    <p>Explora los colores básicos o crea una combinación a partir de tu foto de fondo.</p>
    <div>{visible.map(palette => <label key={palette.accent.toLowerCase()}>
      <input type="radio" name="invitation-palette" checked={accent.toLowerCase() === palette.accent.toLowerCase()} onChange={() => select(palette.accent)} />
      <span className="guided-palette-swatches" aria-hidden="true">{[palette.paper, palette.panel, palette.accent, palette.dark].map((color, index) => <i key={index} style={{ background: color }} />)}</span>
      <strong>{palette.label}</strong>{accent.toLowerCase() === palette.accent.toLowerCase() && <FiCheck />}
    </label>)}</div>
    {compact && display.length > initialCount && <button className="guided-more-colors" type="button" aria-expanded={expanded} onClick={() => setExpanded(current => !current)}>{expanded ? "Mostrar menos colores" : "Ver más colores"}</button>}
    <section className="guided-photo-palette" aria-labelledby="photo-palette-title" aria-busy={loading}>
      <FiImage aria-hidden="true" /><div><h2 id="photo-palette-title">Los colores de tu foto</h2>
        <p>{backgroundImageUrl ? 'Obtén el tono predominante de la foto de fondo y una combinación a juego para tu invitación.' : 'Agrega una foto de fondo en el paso Portada y fondo para obtener una paleta a partir de sus colores.'}</p>
        <button type="button" disabled={!backgroundImageUrl || loading} onClick={() => void extract()}>{loading ? 'Obteniendo colores…' : 'Obtener paleta de la foto'}</button>
        {loading && <small role="status">Analizando tu foto de fondo…</small>}
        {error && <small role="alert">{error}</small>}
        {!loading && fromPhoto && <small role="status">Paleta obtenida de tu foto. Puedes alternar entre ella y los demás colores.</small>}
      </div>
    </section>
  </fieldset>;
}
