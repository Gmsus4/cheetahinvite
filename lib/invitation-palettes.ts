import type { InvitationImagePalette } from "./invitation-image-palette";
export type InvitationPalette = { label: string; accent: string; paper: string; panel: string; ink: string; muted: string; dark: string; colors?: InvitationImagePalette };

type Rgb = [number, number, number];
const hex = (rgb: Rgb) => '#' + rgb.map(value => Math.round(value).toString(16).padStart(2, '0')).join('');
const mix = (rgb: Rgb, target: Rgb, amount: number): Rgb => rgb.map((value, index) => value + (target[index] - value) * amount) as Rgb;

export function paletteFromAccent(accent: string, label = 'De tu foto'): InvitationPalette {
  const safe = /^#[\da-f]{6}$/i.test(accent) ? accent.toLowerCase() : '#58664e';
  const rgb = [1, 3, 5].map(start => parseInt(safe.slice(start, start + 2), 16)) as Rgb;
  return {
    label, accent: safe,
    paper: hex(mix(rgb, [255, 253, 249], .94)),
    panel: hex(mix(rgb, [255, 253, 249], .8)),
    ink: hex(mix(rgb, [12, 15, 19], .78)),
    muted: hex(mix(rgb, [72, 74, 78], .65)),
    // White invitation text needs a dark base even for yellow or near-white photos.
    dark: hex(mix(rgb, [12, 15, 19], .78)),
  };
}

export function paletteFromImageColors(colors: InvitationImagePalette, accent = colors.accents[0]): InvitationPalette {
  return { label: 'De tu imagen', accent, paper: colors.light, panel: colors.light, ink: colors.dark, muted: colors.dark, dark: accent, colors };
}

const brightness = (color: Rgb) => color.reduce((sum, channel, index) => {
  const value = channel / 255;
  return sum + [0.2126, 0.7152, 0.0722][index] * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
}, 0);
const distance = (a: Rgb, b: Rgb) => a.reduce((sum, channel, index) => sum + (channel - b[index]) ** 2, 0);
const rgbFromHex = (color: string): Rgb => [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16)) as Rgb;

/** Five representative image tones; retain light/dark details as well as populous accents. */
export function imagePaletteFromPixels(pixels: ArrayLike<number>): InvitationImagePalette {
  const histogram = new Map<number, { count: number; sum: Rgb }>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const color: Rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const key = (color[0] >> 4) * 256 + (color[1] >> 4) * 16 + (color[2] >> 4);
    const bucket = histogram.get(key) ?? { count: 0, sum: [0, 0, 0] };
    bucket.count++;
    color.forEach((channel, index) => { bucket.sum[index] += channel; });
    histogram.set(key, bucket);
  }
  if (!histogram.size) throw new Error('La imagen no contiene colores visibles.');
  const entries = [...histogram.values()].map(bucket => ({ count: bucket.count, rgb: bucket.sum.map(channel => channel / bucket.count) as Rgb }));
  const substantial = entries.filter(entry => entry.count >= 2);
  const samples = substantial.length ? substantial : entries;
  const ordered = [...samples].sort((a, b) => brightness(a.rgb) - brightness(b.rgb));
  const centers: Rgb[] = [ordered[0].rgb];
  if (ordered.length > 1) centers.push(ordered.at(-1)!.rgb);
  while (centers.length < Math.min(5, samples.length)) {
    const next = samples.reduce((best, entry) => {
      const score = Math.min(...centers.map(center => distance(center, entry.rgb))) * Math.sqrt(entry.count);
      return score > best.score ? { score, rgb: entry.rgb } : best;
    }, { score: -1, rgb: samples[0].rgb });
    centers.push([...next.rgb]);
  }
  let populations: number[] = [];
  for (let pass = 0; pass < 12; pass++) {
    const groups = centers.map(() => ({ count: 0, sum: [0, 0, 0] as Rgb }));
    for (const entry of entries) {
      let nearest = 0;
      centers.forEach((center, index) => { if (distance(center, entry.rgb) < distance(centers[nearest], entry.rgb)) nearest = index; });
      groups[nearest].count += entry.count;
      entry.rgb.forEach((channel, index) => { groups[nearest].sum[index] += channel * entry.count; });
    }
    populations = groups.map(group => group.count);
    groups.forEach((group, index) => { if (group.count) centers[index] = group.sum.map(channel => channel / group.count) as Rgb; });
  }
  const representatives = centers.map((center, index) => ({
    color: entries.reduce((best, entry) => distance(entry.rgb, center) < distance(best.rgb, center) ? entry : best).rgb,
    count: populations[index],
  })).filter((entry, index, all) => entry.count && all.findIndex(other => hex(other.color) === hex(entry.color)) === index);
  representatives.sort((a, b) => brightness(a.color) - brightness(b.color));
  const dominant = [...entries].sort((a, b) => b.count - a.count)[0].rgb;
  const fallback = paletteFromAccent(hex(dominant));
  const darkSample = representatives[0].color, lightSample = representatives.at(-1)!.color;
  const distinctRange = brightness(lightSample) - brightness(darkSample) > 0.12;
  const light = distinctRange ? hex(lightSample) : fallback.paper;
  const dark = distinctRange ? hex(darkSample) : brightness(darkSample) < 0.08 ? hex(darkSample) : fallback.ink;
  const used = new Set([light, dark]);
  const accents: string[] = [];
  const add = (color: string) => { if (!used.has(color) && accents.length < 3) { used.add(color); accents.push(color); } };
  [...representatives].sort((a, b) => b.count - a.count).forEach(entry => add(hex(entry.color)));
  add(hex(dominant));
  for (const amount of [0.25, 0.5, 0.75, 0.1, 0.9]) {
    add(hex(mix(dominant, rgbFromHex(light), amount)));
    add(hex(mix(dominant, rgbFromHex(dark), amount)));
  }
  return { light, dark, accents: accents as [string, string, string] };
}

export const basicInvitationPalettes = [
  ['Rojo', '#c43d4b'], ['Naranja', '#e47732'], ['Amarillo', '#e3b93e'],
  ['Verde', '#3f9468'], ['Turquesa', '#329f9b'], ['Azul', '#397ac5'],
  ['Morado', '#8152b3'], ['Rosa', '#cf709c'], ['Café', '#94684d'],
  ['Blanco y perla', '#eee9e0'], ['Gris', '#80858e'], ['Negro', '#20232a'],
].map(([label, accent]) => paletteFromAccent(accent, label));

export function invitationPaletteChoices(palettes: InvitationPalette[]) {
  return [...palettes, ...basicInvitationPalettes].filter((palette, index, all) =>
    all.findIndex(other => other.accent.toLowerCase() === palette.accent.toLowerCase()) === index);
}

/** Quantized population sampling: a tiny vivid detail must not outweigh the background. */
export function dominantImageColor(pixels: ArrayLike<number>): string {
  const buckets = new Map<number, { count: number; sum: Rgb }>();
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const rgb: Rgb = [pixels[index], pixels[index + 1], pixels[index + 2]];
    const key = (rgb[0] >> 5) * 64 + (rgb[1] >> 5) * 8 + (rgb[2] >> 5);
    const bucket = buckets.get(key) ?? { count: 0, sum: [0, 0, 0] };
    bucket.count++;
    rgb.forEach((value, channel) => { bucket.sum[channel] += value; });
    buckets.set(key, bucket);
  }
  if (!buckets.size) throw new Error('La imagen no contiene colores visibles.');
  const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  return hex(dominant.sum.map(value => value / dominant.count) as Rgb);
}

export async function extractBackgroundPalette(url: string): Promise<InvitationPalette> {
  const image = new window.Image();
  image.crossOrigin = 'anonymous';
  image.referrerPolicy = 'no-referrer';
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => { image.onload = null; image.onerror = null; reject(new Error('La imagen tardó demasiado en cargar.')); }, 15000);
    image.onload = () => { window.clearTimeout(timer); resolve(); };
    image.onerror = () => { window.clearTimeout(timer); reject(new Error('No se pudo leer la foto de fondo.')); };
    image.src = url;
  });
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('La imagen no es válida.');
  const scale = Math.min(1, 128 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Este navegador no puede analizar la imagen.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return paletteFromImageColors(imagePaletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data));
}
