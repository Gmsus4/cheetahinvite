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

/** Perceptual distance keeps close oranges distinct without letting a cream background swallow small details. */
function perceptualRgb(rgb: Rgb): Rgb {
  const [r, g, b] = rgb.map(channel => { const v = channel / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
  const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
  const v = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  return [(.2104542553 * l + .793617785 * m - .0040720468 * v) * 100,
    (1.9779984951 * l - 2.428592205 * m + .4505937099 * v) * 100,
    (.0259040371 * l + .7827717662 * m - .808675766 * v) * 100];
}

type ImageColorSample = { count: number; rgb: Rgb; lab: Rgb };

/** Dark outlines can be tiny and split across several nearby compression shades. */
function darkestImageSample(entries: ImageColorSample[], total: number): ImageColorSample {
  const ordered = [...entries].sort((a, b) => brightness(a.rgb) - brightness(b.rgb));
  const minimumSupport = total < 64 ? 1 : Math.max(2, Math.ceil(total * .00005));
  for (const candidate of ordered) {
    let support = 0;
    for (const neighbor of ordered) {
      if (distance(candidate.lab, neighbor.lab) <= 36) support += neighbor.count;
      if (support >= minimumSupport) return candidate;
    }
  }
  return entries.reduce((best, entry) => entry.count > best.count ? entry : best);
}

/** Keep real dark pixels; for light images, darken their own hue just enough. */
function darkImageColor(source: Rgb, light: Rgb): string {
  if (brightness(source) <= .075) return hex(source);
  const maximumLuminance = Math.max(0, Math.min(.075, (brightness(light) + .05) / 4.5 - .05));
  let low = 0, high = 1;
  for (let pass = 0; pass < 24; pass++) {
    const amount = (low + high) / 2;
    const shade = source.map(channel => Math.round(channel * amount)) as Rgb;
    if (brightness(shade) <= maximumLuminance) low = amount;
    else high = amount;
  }
  return hex(source.map(channel => Math.round(channel * low)) as Rgb);
}

/** Select source colors, preserving small dark details and three distinct accents. */
export function imagePaletteFromPixels(pixels: ArrayLike<number>): InvitationImagePalette {
  const histogram = new Map<number, { count: number; sum: Rgb }>();
  let total = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const rgb: Rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const key = (rgb[0] >> 3) * 1024 + (rgb[1] >> 3) * 32 + (rgb[2] >> 3);
    const bucket = histogram.get(key) ?? { count: 0, sum: [0, 0, 0] };
    bucket.count++; total++;
    rgb.forEach((channel, index) => { bucket.sum[index] += channel; });
    histogram.set(key, bucket);
  }
  if (!total) throw new Error('La imagen no contiene colores visibles.');
  const entries = [...histogram.values()].map(bucket => {
    const rgb = bucket.sum.map(channel => channel / bucket.count) as Rgb;
    return { count: bucket.count, rgb, lab: perceptualRgb(rgb) };
  });
  const dominant = entries.reduce((best, entry) => entry.count > best.count ? entry : best);
  // Ignore isolated compression noise when choosing endpoints, but retain small real details.
  const substantial = entries.filter(entry => entry.count >= Math.max(1, total * .0005));
  const samples = substantial.length ? substantial : entries;
  const ordered = [...samples].sort((a, b) => brightness(a.rgb) - brightness(b.rgb));
  const darkest = darkestImageSample(entries, total), lightest = ordered.at(-1)!;
  const centers = [darkest.lab, lightest.lab].filter((center, index, all) => all.findIndex(other => distance(center, other) === 0) === index);
  const count = Math.min(16, samples.length);
  while (centers.length < count) {
    const next = samples.reduce((best, entry) => {
      const score = Math.min(...centers.map(center => distance(center, entry.lab))) * Math.sqrt(entry.count);
      return score > best.score ? { score, lab: entry.lab } : best;
    }, { score: 0, lab: samples[0].lab });
    if (!next.score) break;
    centers.push([...next.lab]);
  }
  let populations: number[] = [];
  for (let pass = 0; pass < 12; pass++) {
    const groups = centers.map(() => ({ count: 0, sum: [0, 0, 0] as Rgb }));
    for (const entry of entries) {
      let nearest = 0;
      centers.forEach((center, index) => { if (distance(center, entry.lab) < distance(centers[nearest], entry.lab)) nearest = index; });
      const group = groups[nearest]; group.count += entry.count;
      entry.lab.forEach((channel, index) => { group.sum[index] += channel * entry.count; });
    }
    populations = groups.map(group => group.count);
    groups.forEach((group, index) => { if (group.count) centers[index] = group.sum.map(channel => channel / group.count) as Rgb; });
  }
  const representatives = centers.map((center, index) => ({
    ...samples.reduce((best, entry) => distance(entry.lab, center) < distance(best.lab, center) ? entry : best),
    count: populations[index],
  })).filter((entry, index, all) => entry.count && all.findIndex(other => hex(other.rgb) === hex(entry.rgb)) === index);
  // A tiny white highlight is not the light background. Use populated clusters
  // for endpoints so antialiasing does not consume an accent slot.
  const endpoints = representatives.filter(entry => entry.count >= Math.max(1, total * .003));
  const ranked = [...(endpoints.length ? endpoints : representatives)].sort((a, b) => brightness(a.rgb) - brightness(b.rgb));
  const bright = ranked.at(-1)!;
  const lightTone = ranked.filter(entry => entry.lab[0] >= bright.lab[0] - 10).reduce((best, entry) => entry.count > best.count ? entry : best, bright);
  const distinctRange = brightness(lightTone.rgb) - brightness(darkest.rgb) > .12;
  const fallback = paletteFromAccent(hex(dominant.rgb));
  const light = distinctRange ? hex(lightTone.rgb) : fallback.paper;
  const dark = darkImageColor(darkest.rgb, rgbFromHex(light));
  const used = new Set([light, dark]);
  const selected = [perceptualRgb(rgbFromHex(light)), perceptualRgb(rgbFromHex(dark))];
  const accents: string[] = [];
  while (accents.length < 3) {
    const next = representatives.filter(entry => !used.has(hex(entry.rgb))).reduce<typeof representatives[number] | undefined>((best, entry) => {
      const score = (candidate: typeof entry) => Math.min(...selected.map(center => distance(center, candidate.lab))) * Math.sqrt(candidate.count) * (.5 + Math.hypot(candidate.lab[1], candidate.lab[2]) / 20) ** 2;
      return !best || score(entry) > score(best) ? entry : best;
    }, undefined);
    if (!next) break;
    const color = hex(next.rgb); used.add(color); accents.push(color); selected.push(next.lab);
  }
  // Only monochrome/limited-color images need generated intermediate tones.
  const add = (color: string) => { if (!used.has(color) && accents.length < 3) { used.add(color); accents.push(color); } };
  for (const amount of [.25, .5, .75, .1, .9]) {
    add(hex(mix(dominant.rgb, rgbFromHex(light), amount)));
    add(hex(mix(dominant.rgb, rgbFromHex(dark), amount)));
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
  const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Este navegador no puede analizar la imagen.');
  // Sampling should retain source pixels, not blend narrow dark outlines away.
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return paletteFromImageColors(imagePaletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data));
}
