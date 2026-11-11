"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-access";
import { adminText, parsePriceAmount } from "@/lib/admin-validation";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { normalizeInvitationSlug, isValidInvitationSlug } from "@/lib/invitation-url";
import { invitationEventTypes } from "@/lib/invitation-event-content";
import { eventPublicationIssues } from "@/lib/guided-invitation";
import { showcaseContent } from "@/lib/showcase";
import { CourtesyError, grantCourtesy, revokeCourtesy } from "@/lib/courtesy";
import { withImageLock, queueEventImages, scheduleCloudinaryCleanup, syncCloudinaryImages } from "@/lib/cloudinary-storage";
import { landingEventExamples } from "@/lib/landing-invitation-example";

function invalidateAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/ejemplo-invitacion/[style]", "page");
  revalidatePath("/ejemplo-invitacion/[style]/hero", "page");
  revalidatePath("/event/[slug]", "page");
  revalidatePath("/invitacion/[slug]", "page");
  revalidatePath("/invitacion/[slug]/[customSlug]", "page");
  revalidatePath("/");
}
function done(path: string, error?: string): never { redirect(`${path}${path.includes("?") ? "&" : "?"}${error ? `error=${encodeURIComponent(error)}` : "saved=1"}`); }

export async function savePrice(form: FormData) {
  const actor = await requireAdmin();
  const amount = parsePriceAmount(form.get("amount"));
  const reason = adminText(form, "reason", 240);
  const scheduled = adminText(form, "effectiveAt", 30);
  const effectiveAt = scheduled ? new Date(`${scheduled}:00-06:00`) : new Date();
  if (amount === null || reason.length < 3 || !Number.isFinite(effectiveAt.getTime()) || (scheduled && effectiveAt <= new Date())) done("/admin/precio", "Revisa el precio, el motivo y la fecha futura de aplicación.");
  let failed = false;
  let stale = false;
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended('site-pricing', 0))`);
      const current = await tx.priceRevision.findFirst({ where: { cancelledAt: null, effectiveAt: { lte: new Date() } }, orderBy: { effectiveAt: "desc" } });
      if ((current?.id ?? "default") !== form.get("expectedPriceId")) { stale = true; return; }
      const price = await tx.priceRevision.create({ data: { amount, reason, actorId: actor.id, effectiveAt } });
      await tx.adminAudit.create({ data: { actorId: actor.id, action: "price.create", targetId: price.id, detail: { amount, reason, effectiveAt: effectiveAt.toISOString() } } });
    });
  } catch { failed = true; }
  if (stale) done("/admin/precio", "El precio cambió en otra pestaña. Revisa el valor actual antes de guardar.");
  if (failed) done("/admin/precio", "No pudimos guardar el precio. Revisa si ya existe un cambio para esa fecha.");
  invalidateAdmin();
  done("/admin/precio");
}

export async function cancelScheduledPrice(id: string) {
  const actor = await requireAdmin();
  await prisma.$transaction(async tx => {
    const changed = await tx.priceRevision.updateMany({ where: { id, cancelledAt: null, effectiveAt: { gt: new Date() } }, data: { cancelledAt: new Date() } });
    if (changed.count) await tx.adminAudit.create({ data: { actorId: actor.id, action: "price.cancel", targetId: id, detail: {} } });
  });
  invalidateAdmin();
  done("/admin/precio");
}

export async function createExample(form: FormData) {
  const actor = await requireAdmin();
  const label = adminText(form, "label", 100);
  const type = adminText(form, "eventType", 30);
  const slug = normalizeInvitationSlug(adminText(form, "slug", 80)) || `${normalizeInvitationSlug(label).slice(0, 65)}-${randomUUID().slice(0, 8)}`;
  if (label.length < 2 || !invitationEventTypes.some(t => t === type) || !isValidInvitationSlug(slug) || landingEventExamples.some(e => e.slug === slug)) done("/admin/disenos", "Revisa el nombre, tipo y enlace del ejemplo. Los enlaces originales están reservados.");
  let id = "";
  try {
    const example = await prisma.$transaction(async tx => {
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${actor.id} FOR UPDATE`);
      if (await tx.showcaseExample.count() >= 100) throw new Error("Example limit reached");
      const event = await tx.event.create({ data: { ownerId: actor.id, name: label, eventType: type, isExample: true, privacy: "PUBLIC", sections: [] } });
      const example = await tx.showcaseExample.create({ data: { label, slug, eventId: event.id } });
      await tx.adminAudit.create({ data: { actorId: actor.id, action: "example.create", targetId: example.id, detail: { label } } });
      return example;
    });
    id = example.id;
  } catch { done("/admin/disenos", "No pudimos crear el borrador. Usa otro enlace o revisa el límite de 100 ejemplos."); }
  invalidateAdmin();
  redirect(`/admin/disenos/${id}/editar`);
}

export async function duplicateExample(id: string) {
  const actor = await requireAdmin();
  let copyId = "";
  await withImageLock(actor.id, async tx => {
    const source = await tx.showcaseExample.findUnique({ where: { id }, include: { event: true } });
    if (!source || source.event.ownerId !== actor.id || await tx.showcaseExample.count() >= 100) return;
    const { event } = source;
    const label = `Copia de ${source.label}`.slice(0, 100);
    const copy = await tx.event.create({ data: {
      ownerId: actor.id, isExample: true, privacy: "PUBLIC", name: label, eventType: event.eventType,
      hostNames: event.hostNames, eventDate: event.eventDate, eventTime: event.eventTime, venue: event.venue, address: event.address,
      message: event.message, imageUrl: event.imageUrl, backgroundImageUrl: event.backgroundImageUrl, backgroundBlurIntensity: event.backgroundBlurIntensity, backgroundDimIntensity: event.backgroundDimIntensity,
      accent: event.accent, typography: event.typography, bodyTypography: event.bodyTypography,
      coverLayout: event.coverLayout, panelStyle: event.panelStyle, blurIntensity: event.blurIntensity, showSectionIcons: event.showSectionIcons, glassBorder: event.glassBorder,
      sectionCorners: event.sectionCorners, sections: event.sections as Prisma.InputJsonValue,
    } });
    const example = await tx.showcaseExample.create({ data: { eventId: copy.id, label, slug: `${source.slug.slice(0, 65)}-${randomUUID().slice(0, 8)}` } });
    copyId = example.id;
    await tx.adminAudit.create({ data: { actorId: actor.id, action: "example.duplicate", targetId: example.id, detail: { sourceId: id } } });
  });
  if (!copyId) done("/admin/disenos", "No pudimos duplicar el ejemplo. Revisa su propietario y el límite de la colección.");
  invalidateAdmin();
  redirect(`/admin/disenos/${copyId}`);
}

export async function saveExampleSettings(id: string, form: FormData) {
  const actor = await requireAdmin();
  const label = adminText(form, "label", 100);
  const rawPosition = form.get("position");
  const position = typeof rawPosition === "string" && /^\d{1,4}$/.test(rawPosition) ? Number(rawPosition) : NaN;
  if (label.length < 2 || !Number.isInteger(position)) done(`/admin/disenos/${id}`, "Revisa el nombre y el orden del ejemplo.");
  await prisma.$transaction(async tx => {
    await tx.showcaseExample.update({ where: { id }, data: { label, position, showInHero: form.get("showInHero") === "on" } });
    await tx.adminAudit.create({ data: { actorId: actor.id, action: "example.settings", targetId: id, detail: { label, position } } });
  });
  invalidateAdmin();
  done(`/admin/disenos/${id}`);
}

export async function publishExample(id: string, form: FormData) {
  const actor = await requireAdmin();
  let error = "";
  await withImageLock(actor.id, async tx => {
    const example = await tx.showcaseExample.findUnique({ where: { id } });
    if (!example) { error = "No encontramos este ejemplo."; return; }
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${example.eventId} FOR UPDATE`);
    const event = await tx.event.findUnique({ where: { id: example.eventId } });
    if (!event || event.ownerId !== actor.id || !event.isExample || event.contentVersion !== Number(form.get("version"))) { error = "El borrador cambió. Revisa la vista previa y vuelve a publicar."; return; }
    const issues = eventPublicationIssues(event);
    if (issues.length) { error = issues[0].message; return; }
    await tx.showcaseExample.update({ where: { id }, data: { publishedAt: new Date(), publishedVersion: event.contentVersion, publishedContent: showcaseContent(event) as unknown as Prisma.InputJsonValue } });
    await syncCloudinaryImages(tx, actor.id, event.id, event, event);
    await tx.adminAudit.create({ data: { actorId: actor.id, action: "example.publish", targetId: id, detail: { version: event.contentVersion } } });
  });
  if (error) done(`/admin/disenos/${id}`, error);
  scheduleCloudinaryCleanup(actor.id);
  invalidateAdmin();
  done(`/admin/disenos/${id}`);
}

export async function unpublishExample(id: string) {
  const actor = await requireAdmin();
  await prisma.$transaction(async tx => {
    await tx.showcaseExample.update({ where: { id }, data: { publishedAt: null } });
    await tx.adminAudit.create({ data: { actorId: actor.id, action: "example.unpublish", targetId: id, detail: {} } });
  });
  invalidateAdmin();
  done(`/admin/disenos/${id}`);
}

export async function toggleCustomExamples(form: FormData) {
  const actor = await requireAdmin();
  const useCustomExamples = form.get("useCustomExamples") === "on";
  await prisma.$transaction(async tx => {
    await tx.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", useCustomExamples }, update: { useCustomExamples } });
    await tx.adminAudit.create({ data: { actorId: actor.id, action: "examples.source", targetId: "site", detail: { useCustomExamples } } });
  });
  invalidateAdmin();
  done("/admin/disenos");
}

export async function deleteExample(id: string) {
  const actor = await requireAdmin();
  const example = await prisma.showcaseExample.findUnique({ where: { id }, include: { event: true } });
  if (!example || example.publishedAt) done(`/admin/disenos/${id}`, "Retira el ejemplo del sitio antes de eliminarlo.");
  await withImageLock(example.event.ownerId, async tx => {
    const fresh = await tx.showcaseExample.findUnique({ where: { id } });
    if (!fresh || fresh.publishedAt) throw new Error("Example changed");
    await queueEventImages(tx, example.event.ownerId, example.eventId, example.event);
    await tx.event.delete({ where: { id: example.eventId } });
    await tx.adminAudit.create({ data: { actorId: actor.id, action: "example.delete", targetId: id, detail: {} } });
  });
  scheduleCloudinaryCleanup(example.event.ownerId);
  invalidateAdmin();
  done("/admin/disenos");
}

export async function createCourtesy(form: FormData) {
  const actor = await requireAdmin();
  const eventId = adminText(form, "eventId", 80);
  const ownerId = adminText(form, "ownerId", 80);
  const reason = adminText(form, "reason", 500);
  const expires = adminText(form, "expiresAt", 10);
  const expiresAt = new Date(`${expires}T23:59:59-06:00`);
  const now = new Date();
  if (!eventId || !ownerId || reason.length < 5 || !Number.isFinite(expiresAt.getTime()) || expiresAt <= now || expiresAt.getTime() > now.getTime() + 366 * 5 * 86400000) done("/admin/cortesias", "Elige una invitación, un motivo y una vigencia de hasta cinco años.");
  let error = "";
  try { await grantCourtesy(actor.id, eventId, ownerId, reason, expiresAt); }
  catch (e) { error = e instanceof CourtesyError ? e.message : "No pudimos otorgar la cortesía. Intenta de nuevo."; }
  if (error) done(`/admin/cortesias?cliente=${encodeURIComponent(adminText(form, "email", 254))}`, error);
  invalidateAdmin();
  done("/admin/cortesias");
}

export async function removeCourtesy(id: string, form: FormData) {
  const actor = await requireAdmin();
  const reason = adminText(form, "reason", 500);
  if (reason.length < 5) done("/admin/cortesias", "Escribe el motivo para retirar la cortesía.");
  let error = "";
  try { await revokeCourtesy(actor.id, id, reason); }
  catch (e) { error = e instanceof CourtesyError ? e.message : "No pudimos retirar la cortesía."; }
  if (error) done("/admin/cortesias", error);
  invalidateAdmin();
  done("/admin/cortesias");
}

export async function refreshAdminPayment(id: string) {
  await requireAdmin();
  const { reconcilePurchase } = await import("@/lib/payment-reconciliation");
  let error = "";
  try { await reconcilePurchase(id, 30000); }
  catch { error = "No pudimos consultar Stripe. Intenta más tarde."; }
  invalidateAdmin();
  done("/admin/ventas", error || undefined);
}

