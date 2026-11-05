export type InvitationPalette = { label: string; accent: string; paper: string; panel: string; ink: string; muted: string; dark: string };

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
  const scale = Math.min(1, 64 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Este navegador no puede analizar la imagen.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return paletteFromAccent(dominantImageColor(context.getImageData(0, 0, canvas.width, canvas.height).data));
}
