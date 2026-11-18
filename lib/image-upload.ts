import { ACCOUNT_LIMITS } from "@/lib/limits";

export async function uploadInvitationImage(file: File, eventId: string): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("Usa imágenes JPG, PNG, WebP o AVIF.");
  if (!file.size) throw new Error("Selecciona una imagen válida.");
  if (file.size > ACCOUNT_LIMITS.imageSizeBytes) throw new Error("Cada imagen debe pesar 5 MB o menos.");
  const authorization = await fetch("/api/images/upload", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, contentType: file.type, size: file.size }), signal: AbortSignal.timeout(30_000),
  });
  const grant = await authorization.json().catch(() => null);
  if (!authorization.ok || typeof grant?.publicId !== "string") throw new Error(grant?.error || "No pudimos autorizar la carga.");
  const url = `/api/images/upload?${new URLSearchParams({ eventId, publicId: grant.publicId })}`;
  // Retries reuse one reservation. An existing object is never overwritten.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file, signal: AbortSignal.timeout(90_000) });
      const body = await response.json().catch(() => null);
      if (response.ok && typeof body?.secureUrl === "string") return body.secureUrl;
      if (response.status >= 500 && attempt === 0) continue;
      throw new Error(body?.error || "No pudimos subir la imagen.");
    } catch (error) {
      if (attempt === 0 && (error instanceof TypeError || (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name)))) continue;
      throw error;
    }
  }
  throw new Error("No pudimos confirmar la imagen. Intenta de nuevo.");
}
