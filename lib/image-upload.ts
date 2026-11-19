import { ACCOUNT_LIMITS } from "@/lib/limits";

async function uploadResponse(response: Response): Promise<{ publicId?: string; secureUrl?: string; error?: string }> {
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { /* Cloudflare may return plain text or HTML. */ }
  if (body && typeof body === "object" && !Array.isArray(body)) return body;
  if (!response.ok && /(?:error\s+(?:code:\s*)?1102|worker exceeded resource limits)/i.test(text)) {
    return { error: "El servidor alcanzó su límite de recursos. Intenta de nuevo en unos momentos." };
  }
  return {};
}

export function validateInvitationImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("Usa imágenes JPG, PNG, WebP o AVIF.");
  if (!file.size) throw new Error("Selecciona una imagen válida.");
  if (file.size > ACCOUNT_LIMITS.imageSizeBytes) throw new Error("Cada imagen debe pesar 5 MB o menos.");
}

export async function uploadInvitationImage(file: File, eventId: string): Promise<string> {
  validateInvitationImage(file);
  const authorization = await fetch("/api/images/upload", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, contentType: file.type, size: file.size }), signal: AbortSignal.timeout(30_000),
  });
  const grant = await uploadResponse(authorization);
  if (!authorization.ok || typeof grant.publicId !== "string") throw new Error(typeof grant.error === "string" ? grant.error : "No pudimos autorizar la carga. Intenta de nuevo en unos momentos.");
  const url = `/api/images/upload?${new URLSearchParams({ eventId, publicId: grant.publicId })}`;
  // Retries reuse one reservation. An existing object is never overwritten.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file, signal: AbortSignal.timeout(90_000) });
      const body = await uploadResponse(response);
      if (response.ok && typeof body.secureUrl === "string") return body.secureUrl;
      if (response.status >= 500 && attempt === 0) continue;
      throw new Error(typeof body.error === "string" ? body.error : "No pudimos subir la imagen. Intenta de nuevo en unos momentos.");
    } catch (error) {
      if (attempt === 0 && (error instanceof TypeError || (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name)))) continue;
      throw error;
    }
  }
  throw new Error("No pudimos confirmar la imagen. Intenta de nuevo.");
}
