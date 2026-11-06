"use server";
import { eventPublicationIssues } from "@/lib/guided-invitation";

import { isInvitationPanelStyle, isInvitationBlurIntensity } from "@/lib/invitation-editor";
import type { EditorSaveResult } from "@/lib/invitation-editor";
import { invitationSectionUrl } from "@/lib/invitation-links";
import { parseButtonAppearance } from "@/lib/invitation-buttons";
import { orderedInvitationSections } from "@/lib/invitation-sections";
import type { InviteSection } from "@/lib/invitation-editor";

import { invitationLinkRegistryReady, reserveInvitationPath } from "@/lib/invitation-link-storage";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { isInvitationFont } from "@/lib/invitation-fonts";
import { isValidInvitationSlug, normalizeInvitationSlug } from "@/lib/invitation-url";
import { isInvitationTemplate } from "@/lib/invitation-templates";
import { isInvitationTexture } from "@/lib/invitation-textures";
import { sharedInvitationId, sharedInvitationDesign, invitationPalette } from "@/lib/shared-invitation";
import { ImageStorageError, queueEventImages, scheduleCloudinaryCleanup, syncCloudinaryImages, withImageLock } from "@/lib/cloudinary-storage";

export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Tu sesión expiró. Inicia sesión para eliminar la invitación." };

  try {
    await withImageLock(session.user.id, async (tx) => {
      const event = await tx.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, select: { imageUrl: true, backgroundImageUrl: true, sections: true } });
      if (event) await queueEventImages(tx, session.user.id, eventId, event);
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

  scheduleCloudinaryCleanup(session.user.id);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/crear");
  revalidatePath("/dashboard/compras");
  revalidatePath("/event/[slug]", "page");
  revalidatePath("/invitacion/[slug]", "page");
  revalidatePath("/invitacion/[slug]/[customSlug]", "page");
  return { error: null };
}

export async function updateEvent(eventId: string, formData: FormData, mode: "manual" | "auto" = "manual"): Promise<EditorSaveResult> {
  if (mode !== "manual" && mode !== "auto") return failure("validation", "Revisa los datos e intenta de nuevo.");
  const result = await persistEvent(eventId, formData, mode === "auto");
  if (!result.ok) return result;
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/eventos/${eventId}`);
  revalidatePath(`/dashboard/eventos/${eventId}/show`);
  revalidatePath("/dashboard/eventos");
  if (mode === "manual") {
    revalidatePath("/event/[slug]", "page");
    revalidatePath("/invitacion/[slug]", "page");
    revalidatePath("/invitacion/[slug]/[customSlug]", "page");
  }
  return result;
}

export async function checkInvitationSlug(eventId: string, value: string) {
  const session = await auth();
  if (!session?.user?.id) return { available: false };
  const customSlug = normalizeInvitationSlug(value);
  if (!isValidInvitationSlug(customSlug)) return { available: false };
  const owned = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, select: { id: true, customSlug: true, paidAt: true } });
  if (!owned) return { available: false };
  if (!owned.paidAt) return { available: false, paymentRequired: true };
  if (!await invitationLinkRegistryReady(prisma)) return { available: customSlug === owned.customSlug, migrationPending: true };
  const existing = await prisma.invitationLink.findUnique({ where: { path: `/event/${customSlug}` } });
  const available = !existing || existing.eventId === eventId;
  let suggestion: string | undefined;
  if (!available) {
    for (let suffix = 2; suffix <= 20; suffix++) {
      const candidate = `${customSlug.slice(0, 76).replace(/-$/, "")}-${suffix}`;
      const taken = await prisma.invitationLink.findUnique({ where: { path: `/event/${candidate}` } });
      if (!taken || taken.eventId === eventId) { suggestion = candidate; break; }
    }
  }
  return { available, suggestion };
}

export async function publishEvent(eventId: string, version: number): Promise<EditorSaveResult> {
  const session = await auth();
  if (!session?.user?.id) return failure("auth", "Tu sesión expiró. Tus cambios se conservan en este dispositivo; inicia sesión de nuevo.");
  if (!Number.isInteger(version) || version < 0) return failure("validation", "Guarda tus cambios antes de continuar.");
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: session.user.id } });
  if (!event) return failure("not-found", "No encontramos esta invitación. Tu copia local sigue disponible.");
  if (event.contentVersion !== version) return { ...failure("conflict", "La invitación cambió en otra pestaña. Revisa tus cambios antes de continuar."), version: event.contentVersion };
  const issues = eventPublicationIssues(event);
  if (issues.length) return failure("validation", issues[0].message);
  if (!event.paidAt) {
    const changed = await prisma.event.updateMany({ where: { id: event.id, ownerId: session.user.id, paidAt: null, contentVersion: version }, data: { status: "PENDING_PAYMENT" } });
    if (!changed.count) {
      const latest = await prisma.event.findFirst({ where: { id: event.id, ownerId: session.user.id }, select: { contentVersion: true } });
      if (!latest) return failure("not-found", "No encontramos esta invitación. Tu copia local sigue disponible.");
      return { ...failure("conflict", "La invitación cambió. Revisa tus cambios antes de continuar."), version: latest.contentVersion };
    }
    revalidatePath("/dashboard");
  }
  return { ok: true, eventId, version };
}

function failure(code: Extract<EditorSaveResult, { ok: false }>["code"], message: string): Extract<EditorSaveResult, { ok: false }> {
  return { ok: false, code, message };
}

class EditorWriteError extends Error {
  constructor(public result: Extract<EditorSaveResult, { ok: false }>) { super(result.message); }
}

async function persistEvent(eventId: string, formData: FormData, automatic: boolean): Promise<EditorSaveResult> {
  const session = await auth();
  if (!session?.user?.id) return failure("auth", "Tu sesión expiró. Tus cambios se conservan en este dispositivo; inicia sesión de nuevo.");
  const rawVersion = formData.get("contentVersion");
  if (typeof rawVersion !== "string" || !/^\d+$/.test(rawVersion) || Number(rawVersion) > 2147483646) return failure("validation", "Recarga el editor para guardar de forma segura.");
  const version = Number(rawVersion);

  const name = String(formData.get("name") ?? "").trim();
  const hasCustomSlug = formData.has("customSlug");
  const customSlug = normalizeInvitationSlug(String(formData.get("customSlug") ?? ""));
  if (hasCustomSlug && customSlug && !isValidInvitationSlug(customSlug)) return failure("validation", "El enlace debe tener entre 2 y 80 caracteres, con letras, números y guiones.");
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
  const hasBackgroundImage = formData.has("backgroundImageUrl");
  const backgroundImageUrl = String(formData.get("backgroundImageUrl") ?? "").trim();
  const accent = String(formData.get("accent") ?? "#E9560A");
  const typography = String(formData.get("typography") ?? "default");
  const bodyTypography = String(formData.get("bodyTypography") ?? "inter");
  const rawBlurIntensity = formData.get("blurIntensity");
  const blurIntensity = rawBlurIntensity === null ? 50 : typeof rawBlurIntensity === "string" && /^\d{1,3}$/.test(rawBlurIntensity) ? Number(rawBlurIntensity) : NaN;
  if (!isInvitationBlurIntensity(blurIntensity)) return failure("validation", "Elige una intensidad de blur entre 0 y 100.");
  const panelStyle = formData.get("panelStyle") ?? "auto";
  if (!isInvitationPanelStyle(panelStyle)) return failure("validation", "Elige un fondo válido para las secciones.");
  const buttonAppearance = parseButtonAppearance(formData);
  const heroHorizontal = String(formData.get("heroHorizontal") ?? "left");
  const heroVertical = String(formData.get("heroVertical") ?? "center");
  let sections: unknown;
  try {
    sections = JSON.parse(String(formData.get("sections") ?? "[]"));
  } catch {
    return failure("validation", "Revisa las secciones de la invitación.");
  }
  const eventTypes = ["wedding", "birthday", "graduation", "baby_shower", "anniversary", "other"];
  const eventDate = dateValue ? new Date(`${dateValue}T12:00:00.000Z`) : null;
  if (
    !buttonAppearance || !["left", "center", "right"].includes(heroHorizontal) || !["top", "center", "bottom"].includes(heroVertical) ||
    name.length < 2 || name.length > 100 || !eventTypes.includes(eventType) || !isInvitationTemplate(eventType, templateId) || !isInvitationTexture(texture) ||
    hostNames.length > 120 || venue.length > 160 || address.length > 240 ||
    message.length > 1200 || !/^#[0-9a-fA-F]{6}$/.test(accent) || !isInvitationFont(typography) || !isInvitationFont(bodyTypography) ||
    (eventDate && Number.isNaN(eventDate.getTime())) ||
    (eventTime && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) || !eventDate)) ||
    !Array.isArray(sections) || sections.length > 12 ||
    sections.some((section) => !isValidSection(section))
  ) return failure("validation", "Revisa los campos marcados antes de guardar. Tus cambios siguen en este dispositivo.");

  for (const photoUrl of [imageUrl, backgroundImageUrl]) {
    if (!photoUrl) continue;
    try {
      const url = new URL(photoUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    } catch {
      return failure("validation", "Usa una imagen válida que comience con http:// o https://.");
    }
  }

  const design = sharedInvitationDesign;
  const orderedSections = orderedInvitationSections(sections as InviteSection[]);
  const curated = {
    templateId: sharedInvitationId,
    accent: invitationPalette(accent).accent, typography, bodyTypography,
    ...(formData.has("panelStyle") ? { panelStyle } : {}),
    ...(formData.has("blurIntensity") ? { blurIntensity } : {}),
    texture: "none", heroHorizontal: "center", heroVertical: "center",
    buttonShape: design.buttons.shape, buttonFilled: design.buttons.filled, buttonIcons: design.buttons.icons,
    buttonBorder: design.buttons.border, buttonBold: design.buttons.bold,
    sections: orderedSections.map(section => ({ ...section, layout: "auto" as const })),
  };
  try {
    // Probe outside the transaction: a missing table aborts a PostgreSQL transaction.
    const registryReady = !hasCustomSlug || await invitationLinkRegistryReady(prisma);
    const result = await withImageLock(session.user.id, async tx => {
      const previous = await tx.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, select: { imageUrl: true, backgroundImageUrl: true, sections: true, contentVersion: true, status: true, paidAt: true, customSlug: true } });
      if (!previous) throw new EditorWriteError(failure("not-found", "No encontramos esta invitación. Tu copia local sigue disponible."));
      if (previous.contentVersion !== version) throw new EditorWriteError({ ...failure("conflict", "Hay cambios guardados desde otra pestaña o dispositivo. Tu versión se conserva; revísala antes de reemplazarlos."), version: previous.contentVersion });
      if (automatic && (previous.paidAt || !["DRAFT", "PENDING_PAYMENT"].includes(previous.status))) {
        throw new EditorWriteError(failure("published", "Los cambios de esta invitación se guardan en este dispositivo. Usa Guardar cambios para aplicarlos."));
      }
      if (!previous.paidAt && hasCustomSlug && customSlug !== (previous.customSlug || "")) {
        throw new EditorWriteError(failure("validation", "Podrás personalizar tu enlace cuando se confirme el pago."));
      }
      if (!registryReady && hasCustomSlug && customSlug !== (previous.customSlug || "")) {
        throw new EditorWriteError(failure("validation", "Conserva tu enlace actual para guardar. La personalización de enlaces estará disponible en breve."));
      }
      if (registryReady && hasCustomSlug && customSlug && !await reserveInvitationPath(tx, `/event/${customSlug}`, eventId)) {
        throw new EditorWriteError(failure("validation", "Este enlace ya está ocupado. Elige otro nombre."));
      }
      const changed = await tx.event.updateMany({
        where: { id: eventId, ownerId: session.user.id, contentVersion: version, ...(automatic ? { paidAt: null, status: { in: ["DRAFT", "PENDING_PAYMENT"] } } : {}) },
        data: { name, eventType, eventDate, eventTime: eventTime || null, hostNames, venue, address, message, imageUrl: imageUrl || null, ...(hasBackgroundImage ? { backgroundImageUrl: backgroundImageUrl || null } : {}), ...curated, contentVersion: { increment: 1 }, ...(hasCustomSlug ? { customSlug: customSlug || null } : {}) },
      });
      if (!changed.count) {
        const latest = await tx.event.findFirst({ where: { id: eventId, ownerId: session.user.id }, select: { contentVersion: true, paidAt: true, status: true } });
        if (automatic && latest && (latest.paidAt || !["DRAFT", "PENDING_PAYMENT"].includes(latest.status))) throw new EditorWriteError(failure("published", "Tu invitación se publicó. Usa Guardar cambios para aplicar las modificaciones pendientes."));
        throw new EditorWriteError({ ...failure("conflict", "La invitación cambió mientras guardabas. Tu copia local sigue disponible."), version: latest?.contentVersion });
      }
      await syncCloudinaryImages(tx, session.user.id, eventId, previous, { imageUrl, backgroundImageUrl: hasBackgroundImage ? backgroundImageUrl : previous.backgroundImageUrl, sections: curated.sections ?? sections });
      return { ok: true as const, eventId, version: version + 1 };
    });
    scheduleCloudinaryCleanup(session.user.id);
    return result;
  } catch (error) {
    if (error instanceof EditorWriteError) return error.result;
    if (error instanceof ImageStorageError) return failure("validation", "Una de las fotos ya no está disponible. Vuelve a subirla; tus textos y cambios siguen en el editor.");
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return failure("validation", "Este enlace ya está ocupado. Elige otro nombre.");
    console.error("Invitation save could not complete");
    return failure("unavailable", "No pudimos guardar en el servidor. Tus cambios se conservan en este dispositivo; intenta de nuevo.");
  }
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
  if (section.rsvpMode !== undefined && (section.type !== "rsvp" || !["external", "integrated"].includes(section.rsvpMode as string))) return false;
  if ((section.id as string).length > 80 || (section.title as string).length > 100 || (section.content as string).length > 2000 || (section.detail as string).length > 240 || (section.link as string).length > 500 || (section.imageUrl as string).length > 1000) return false;
  if (section.layout !== undefined && !["auto", "split", "centered", "card"].includes(section.layout as string)) return false;
  if (section.imagePosition !== undefined && !["before", "after"].includes(section.imagePosition as string)) return false;
  if (section.panelStyle !== undefined && !["auto", "blur", "blur-color", "color"].includes(section.panelStyle as string)) return false;
  if (section.imageUrls !== undefined && (!Array.isArray(section.imageUrls) || section.imageUrls.length > ACCOUNT_LIMITS.imagesPerGallery || section.imageUrls.some((url) => typeof url !== "string" || url.length > 1000 || !isHttpUrl(url)))) return false;
  if (section.link && !invitationSectionUrl(section.type as string, section.link as string)) return false;
  for (const value of [section.imageUrl] as string[]) {
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
