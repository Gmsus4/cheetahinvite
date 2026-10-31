import { ACCOUNT_LIMITS } from "@/lib/limits";

export async function uploadInvitationImage(file: File, eventId: string): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("Usa imágenes JPG, PNG, WebP o AVIF.");
  if (!file.size) throw new Error("Selecciona una imagen válida.");
  if (file.size > ACCOUNT_LIMITS.imageSizeBytes) throw new Error("Cada imagen debe pesar 5 MB o menos.");
  const authorization = await fetch("/api/cloudinary/upload", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, contentType: file.type, size: file.size }), signal: AbortSignal.timeout(30_000),
  });
  const grant = await authorization.json().catch(() => null);
  if (!authorization.ok || !grant?.fields || !grant.uploadUrl || !grant.publicId) throw new Error(grant?.error || "No pudimos autorizar la carga.");
  const form = new FormData();
  for (const [key, value] of Object.entries(grant.fields as Record<string, string>)) form.set(key, value);
  form.set("file", file);
  const response = await fetch(grant.uploadUrl, { method: "POST", body: form, credentials: "omit", signal: AbortSignal.timeout(90_000) });
  const uploaded = await response.json().catch(() => null);
  if (!response.ok || !uploaded?.version || !uploaded.signature) throw new Error("Cloudinary no pudo subir esta imagen. Intenta de nuevo.");
  const body = JSON.stringify({ eventId, publicId: grant.publicId, version: uploaded.version, signature: uploaded.signature });
  // Confirmation retries reuse the reservation, without uploading a second file.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const confirmation = await fetch("/api/cloudinary/upload", { method: "PUT", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(30_000) });
      const confirmed = await confirmation.json().catch(() => null);
      if (confirmation.ok && typeof confirmed?.secureUrl === "string") return confirmed.secureUrl;
      if (confirmation.status >= 500 && attempt === 0) continue;
      throw new Error(confirmed?.error || "No pudimos confirmar la imagen.");
    } catch (error) {
      if (attempt === 0 && (error instanceof TypeError || (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name)))) continue;
      throw error;
    }
  }
  throw new Error("No pudimos confirmar la imagen. Intenta de nuevo.");
}
