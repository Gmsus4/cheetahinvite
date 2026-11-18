import { ImageStorageError } from "@/lib/image-storage";

export function assertImageOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_URL || request.url).origin;
  if (!origin || origin !== expected) throw new ImageStorageError("Solicitud no permitida.", 403);
}

export async function readImageBody(request: Request, maximum: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new ImageStorageError("Selecciona una imagen válida.", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); throw new ImageStorageError("Solicitud demasiado grande.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!length) throw new ImageStorageError("Selecciona una imagen válida.", 400);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
