import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Inicia sesión para subir imágenes." }, { status: 401 });
  }

  let eventId = "";
  try {
    const payload = (await request.json()) as { eventId?: unknown };
    eventId = typeof payload.eventId === "string" ? payload.eventId : "";
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  if (!eventId || eventId.length > 80) {
    return NextResponse.json({ error: "Evento no válido." }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "No encontramos este evento." }, { status: 404 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return NextResponse.json({ error: "La carga de imágenes todavía no está configurada." }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `cheetahinvite/${session.user.id}/${event.id}`;
  const publicId = randomUUID();
  const parameters = { folder, public_id: publicId, timestamp: String(timestamp), upload_preset: uploadPreset };
  const toSign = Object.entries(parameters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, publicId, uploadPreset, signature });
}
