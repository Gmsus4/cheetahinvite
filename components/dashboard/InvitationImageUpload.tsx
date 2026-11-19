"use client";
import Image from "next/image";
import { useState } from "react";
import { FiImage, FiTrash2 } from "react-icons/fi";
import { uploadInvitationImage, validateInvitationImage } from "@/lib/image-upload";
import { ACCOUNT_LIMITS } from "@/lib/limits";
export function InvitationImageUpload({ eventId, images, multiple, onChange, ensureEvent, onBusyChange }: {
  ensureEvent?: () => Promise<string>;
  onBusyChange?: (busy: boolean) => void;
  eventId: string;
  images: string[];
  multiple: boolean;
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const maxImages = multiple ? Math.max(0, ACCOUNT_LIMITS.imagesPerGallery - images.length) : 1;

  async function uploadFiles(files: File[]) {
    setError("");
    const remaining = maxImages;
    if (remaining <= 0) {
      setError(`La galería ya tiene las ${ACCOUNT_LIMITS.imagesPerGallery} fotos permitidas. Quita una para agregar otra.`);
      return;
    }
    const selected = files.slice(0, remaining);
    const errors = files.length > remaining ? [`Solo puedes agregar ${remaining} foto${remaining === 1 ? "" : "s"} más.`] : [];
    const validFiles = selected.filter(file => {
      try { validateInvitationImage(file); return true; }
      catch (error) { errors.push(`${file.name}: ${error instanceof Error ? error.message : "Selecciona una imagen válida."}`); return false; }
    });
    if (!validFiles.length) {
      setError(errors.join(" "));
      return;
    }
    const nextImages = multiple ? [...images] : [];
    setUploading(true);
    onBusyChange?.(true);

    try {
      const uploadEventId = ensureEvent ? await ensureEvent() : eventId;
      for (const file of validFiles) {
        try {
          const secureUrl = await uploadInvitationImage(file, uploadEventId);
          nextImages.push(secureUrl);
          onChange([...nextImages]);
        } catch (uploadError) {
          const reason = uploadError instanceof Error ? uploadError.message : "No pudimos subir la imagen.";
          errors.push(`${file.name}: ${reason}`);
        }
      }
    } catch (uploadError) {
      errors.push(uploadError instanceof Error ? uploadError.message : "No pudimos preparar la carga de imágenes.");
    } finally {
      setError(errors.join(" "));
      setUploading(false);
      onBusyChange?.(false);
    }
  }

  return <div className="image-upload-field">
    <label className={`image-upload-button${uploading ? " is-uploading" : ""}`}>
      <FiImage aria-hidden="true" /><span>{uploading ? "Subiendo imagen…" : multiple ? "Agregar fotos" : images.length ? "Reemplazar imagen" : "Subir imagen"}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} disabled={uploading} onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = "";
        if (files.length) void uploadFiles(files);
      }} />
    </label>
    <small className="image-upload-help">JPG, PNG, WebP o AVIF · máximo {ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB por imagen {multiple && <> · {Math.max(0, ACCOUNT_LIMITS.imagesPerGallery - images.length)} de {ACCOUNT_LIMITS.imagesPerGallery} espacios disponibles en esta galería</>}</small>
    {error && <p className="image-upload-error" role="alert">{error}</p>}
    {images.length > 0 && <div className="image-upload-previews">{images.map((url, index) => <div className="image-upload-preview" key={`${url}-${index}`}>
      <Image src={url} alt={`Imagen ${index + 1}`} width={160} height={160} unoptimized />
      <button type="button" disabled={uploading} aria-label={`Quitar imagen ${index + 1}`} onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}><FiTrash2 /></button>
    </div>)}</div>}
  </div>;
}
