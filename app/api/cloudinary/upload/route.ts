import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { prisma } from "@/prisma";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Inicia sesión para subir imágenes." }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > ACCOUNT_LIMITS.imageSizeBytes + 128 * 1024) {
    return NextResponse.json({ error: "Cada imagen debe pesar 5 MB o menos." }, { status: 413 });
  }

  const body = await request.formData().catch(() => null);
  const eventId = body?.get("eventId");
  const file = body?.get("file");
  if (typeof eventId !== "string" || !eventId || eventId.length > 80 || !(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona una imagen válida." }, { status: 400 });
  }
  if (!acceptedTypes.has(file.type)) {
    return NextResponse.json({ error: "Usa una imagen JPG, PNG, WebP o AVIF." }, { status: 400 });
  }
  if (file.size > ACCOUNT_LIMITS.imageSizeBytes) {
    return NextResponse.json({ error: `Cada imagen debe pesar ${ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MB o menos.` }, { status: 413 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return NextResponse.json({ error: "La carga de imágenes todavía no está configurada." }, { status: 503 });
  }

  const reservation = await prisma.event.updateMany({
    where: { id: eventId, ownerId: session.user.id, imageUploads: { lt: ACCOUNT_LIMITS.imagesPerInvitation } },
    data: { imageUploads: { increment: 1 } },
  });
  if (!reservation.count) {
    const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, select: { id: true } });
    if (!event) return NextResponse.json({ error: "No encontramos este evento." }, { status: 404 });
    return NextResponse.json({ error: `Ya usaste las ${ACCOUNT_LIMITS.imagesPerInvitation} imágenes disponibles para esta invitación.` }, { status: 409 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `cheetahinvite/${session.user.id}/${eventId}`;
  const publicId = randomUUID();
  const parameters = { folder, public_id: publicId, timestamp: String(timestamp), upload_preset: uploadPreset };
  const toSign = Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  const signature = createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
  const cloudinaryForm = new FormData();
  cloudinaryForm.set("file", file, file.name);
  cloudinaryForm.set("api_key", apiKey);
  cloudinaryForm.set("timestamp", String(timestamp));
  cloudinaryForm.set("folder", folder);
  cloudinaryForm.set("public_id", publicId);
  cloudinaryForm.set("upload_preset", uploadPreset);
  cloudinaryForm.set("signature", signature);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: "POST", body: cloudinaryForm, signal: AbortSignal.timeout(60_000),
    });
  } catch {
    // An interrupted connection may still have stored the file; keep the reserved slot.
    return NextResponse.json({ error: "La conexión se interrumpió. Revisa la invitación antes de volver a intentarlo." }, { status: 502 });
  }
  const uploaded = await response.json().catch(() => null) as { secure_url?: string; error?: { message?: string } } | null;
  if (!response.ok || !uploaded?.secure_url) {
    await prisma.event.updateMany({ where: { id: eventId, ownerId: session.user.id }, data: { imageUploads: { decrement: 1 } } });
    return NextResponse.json({ error: uploaded?.error?.message || "Cloudinary no pudo subir esta imagen." }, { status: 502 });
  }
  return NextResponse.json({ secureUrl: uploaded.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/") });
}
