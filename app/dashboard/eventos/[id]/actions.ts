"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { isInvitationFont } from "@/lib/invitation-fonts";
import { isValidInvitationSlug, normalizeInvitationSlug } from "@/lib/invitation-url";
import { isInvitationTemplate } from "@/lib/invitation-templates";
import { isInvitationTexture } from "@/lib/invitation-textures";

export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Tu sesión expiró. Inicia sesión para eliminar la invitación." };

  try {
    await prisma.$transaction(async (tx) => {
      const deleted = await tx.event.deleteMany({ where: { id: eventId, ownerId: session.user.id } });
      if (deleted.count) {
        await tx.user.updateMany({
          where: { id: session.user.id, invitationCount: { gt: 0 } },
          data: { invitationCount: { decrement: 1 } },
        });
      }
    });
  } catch {
    return { error: "No se pudo eliminar la invitación. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/crear");
  revalidatePath("/invitacion/[slug]", "page");
  revalidatePath("/invitacion/[slug]/[customSlug]", "page");
  return { error: null };
}

export async function updateEvent(eventId: string, formData: FormData) {
  await persistEvent(eventId, formData);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/eventos/${eventId}`);
  revalidatePath(`/dashboard/eventos/${eventId}/show`);
  revalidatePath("/invitacion/[slug]", "page");
  revalidatePath("/invitacion/[slug]/[customSlug]", "page");
  revalidatePath("/dashboard/eventos");
}

export async function checkInvitationSlug(eventId: string, value: string) {
  const session = await auth();
  if (!session?.user?.id) return { available: false };
  const customSlug = normalizeInvitationSlug(value);
  if (!isValidInvitationSlug(customSlug)) return { available: false };
  const owned = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, select: { id: true } });
  if (!owned) return { available: false };
  const existing = await prisma.event.findFirst({ where: { ownerId: session.user.id, customSlug, id: { not: eventId } }, select: { id: true } });
  return { available: !existing };
}

export async function publishEvent(eventId: string, formData: FormData) {
  await persistEvent(eventId, formData);
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");

  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId: session.user.id },
    select: { id: true, paidAt: true },
  });
  if (!event) redirect("/dashboard?error=evento");

  if (!event.paidAt) {
    await prisma.event.updateMany({ where: { id: event.id, ownerId: session.user.id, paidAt: null }, data: { status: "PENDING_PAYMENT" } });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/eventos");
    redirect(`/dashboard/eventos/${eventId}/pago`);
  }
  // Publication and its validity are granted only by the verified Stripe webhook.
  redirect(`/dashboard/eventos/${eventId}/pago`);
}

async function persistEvent(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");

  const name = String(formData.get("name") ?? "").trim();
  const hasCustomSlug = formData.has("customSlug");
  const customSlug = normalizeInvitationSlug(String(formData.get("customSlug") ?? ""));
  if (hasCustomSlug && customSlug && !isValidInvitationSlug(customSlug)) redirect(`/dashboard/eventos/${eventId}?error=enlace`);
  const eventType = String(formData.get("eventType") ?? "");
  const templateId = String(formData.get("templateId") ?? "none");
  const texture = String(formData.get("texture") ?? "none");
  const dateValue = String(formData.get("eventDate") ?? "");
  const eventTime = String(formData.get("eventTime") ?? "");
  const hostNames = String(formData.get("hostNames") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const accent = String(formData.get("accent") ?? "#E9560A");
  const typography = String(formData.get("typography") ?? "default");
  const bodyTypography = String(formData.get("bodyTypography") ?? "inter");
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
    name.length < 2 || name.length > 100 || !eventTypes.includes(eventType) || !isInvitationTemplate(eventType, templateId) || !isInvitationTexture(texture) ||
    hostNames.length > 120 || venue.length > 160 || address.length > 240 ||
    message.length > 1200 || !/^#[0-9a-fA-F]{6}$/.test(accent) || !isInvitationFont(typography) || !isInvitationFont(bodyTypography) ||
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

  if (hasCustomSlug && customSlug) {
    const duplicate = await prisma.event.findFirst({ where: { ownerId: session.user.id, customSlug, id: { not: eventId } }, select: { id: true } });
    if (duplicate) redirect(`/dashboard/eventos/${eventId}?error=enlace-ocupado`);
  }
  let result;
  try {
    result = await prisma.event.updateMany({
    where: { id: eventId, ownerId: session.user.id },
    data: { name, eventType, eventDate, eventTime: eventTime || null, hostNames, venue, address, message, imageUrl: imageUrl || null, accent, typography, bodyTypography, templateId, texture, sections, ...(hasCustomSlug ? { customSlug: customSlug || null } : {}) },
  });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") redirect(`/dashboard/eventos/${eventId}?error=enlace-ocupado`);
    throw error;
  }

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
  if (section.layout !== undefined && !["auto", "split", "centered", "card"].includes(section.layout as string)) return false;
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
