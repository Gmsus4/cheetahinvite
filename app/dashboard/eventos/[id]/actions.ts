"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ACCOUNT_LIMITS } from "@/lib/limits";

export async function updateEvent(eventId: string, formData: FormData) {
  await persistEvent(eventId, formData);
  redirect(`/dashboard/eventos/${eventId}?saved=1`);
}

export async function saveEventForPreview(eventId: string, formData: FormData) {
  await persistEvent(eventId, formData);
  redirect(`/dashboard/eventos/${eventId}/show`);
}

export async function publishEvent(eventId: string, formData: FormData) {
  await persistEvent(eventId, formData);
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");

  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: session.user.id },
    select: { id: true, name: true, slug: true },
  });
  if (!event) redirect("/dashboard?error=evento");

  const baseSlug = `${slugify(event.name).slice(0, 48) || "evento"}-${event.id}`;
  const slug = event.slug || baseSlug;
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  await prisma.event.update({
    where: { id: event.id },
    data: { slug, status: "PUBLISHED", expiresAt },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/invitacion/${slug}`);
  redirect(`/dashboard/eventos/${eventId}?published=1`);
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

async function persistEvent(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");

  const name = String(formData.get("name") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "");
  const dateValue = String(formData.get("eventDate") ?? "");
  const eventTime = String(formData.get("eventTime") ?? "");
  const hostNames = String(formData.get("hostNames") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const accent = String(formData.get("accent") ?? "#E9560A");
  let sections: unknown;
  try {
    sections = JSON.parse(String(formData.get("sections") ?? "[]"));
  } catch {
    redirect(`/dashboard/eventos/${eventId}?error=secciones`);
  }
  const eventTypes = ["wedding", "birthday", "graduation", "baby_shower", "anniversary", "other"];
  const eventDate = dateValue ? new Date(`${dateValue}T12:00:00.000Z`) : null;
  const imageReferences = new Set<string>([imageUrl]);
  if (Array.isArray(sections)) {
    for (const section of sections) {
      if (!isValidSection(section)) continue;
      if (section.imageUrl) imageReferences.add(section.imageUrl);
      for (const url of section.imageUrls ?? []) if (url) imageReferences.add(url);
    }
  }

  if (
    name.length < 2 || name.length > 100 || !eventTypes.includes(eventType) ||
    hostNames.length > 120 || venue.length > 160 || address.length > 240 ||
    message.length > 1200 || !/^#[0-9a-fA-F]{6}$/.test(accent) ||
    (eventDate && Number.isNaN(eventDate.getTime())) ||
    (eventTime && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) || !eventDate)) ||
    !Array.isArray(sections) || sections.length > 12 || imageReferences.size > ACCOUNT_LIMITS.imagesPerInvitation ||
    sections.some((section) => !isValidSection(section))
  ) redirect(`/dashboard/eventos/${eventId}?error=datos`);

  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    } catch {
      redirect(`/dashboard/eventos/${eventId}?error=imagen`);
    }
  }

  const result = await prisma.event.updateMany({
    where: { id: eventId, ownerId: session.user.id },
    data: { name, eventType, eventDate, eventTime: eventTime || null, hostNames, venue, address, message, imageUrl: imageUrl || null, accent, sections },
  });

  if (!result.count) redirect("/dashboard?error=evento");
}

function isValidSection(value: unknown): value is {
  id: string; type: string; title: string; content: string; detail: string; link: string; imageUrl: string; enabled: boolean;
  imageUrls?: string[];
} {
  if (!value || typeof value !== "object") return false;
  const section = value as Record<string, unknown>;
  const types = ["story", "ceremony", "reception", "program", "parents", "dress_code", "gifts", "rsvp", "gallery", "music", "custom"];
  const strings = ["id", "type", "title", "content", "detail", "link", "imageUrl"] as const;
  if (!strings.every((key) => typeof section[key] === "string")) return false;
  if (typeof section.enabled !== "boolean" || !types.includes(section.type as string)) return false;
  if ((section.id as string).length > 80 || (section.title as string).length > 100 || (section.content as string).length > 2000 || (section.detail as string).length > 240 || (section.link as string).length > 500 || (section.imageUrl as string).length > 1000) return false;
  if (section.imageUrls !== undefined && (!Array.isArray(section.imageUrls) || section.imageUrls.length > 12 || section.imageUrls.some((url) => typeof url !== "string" || url.length > 1000 || !isHttpUrl(url)))) return false;
  for (const value of [section.link, section.imageUrl] as string[]) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    } catch {
      return false;
    }
  }
  return true;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
