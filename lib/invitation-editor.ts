import { validCompanionLimit } from "@/lib/rsvp";
import type { InvitationButtonAppearance } from "@/lib/invitation-buttons";
import { isInvitationCoverLayout, type InvitationCoverLayout } from "@/lib/invitation-cover-layout";
import { isInvitationPrivacy, type InvitationPrivacy } from "@/lib/invitation-privacy";

export type InvitationSectionCorners = "square" | "soft" | "rounded";
export function isInvitationSectionCorners(value: unknown): value is InvitationSectionCorners {
  return typeof value === "string" && ["square", "soft", "rounded"].includes(value);
}

export type InvitationPanelStyle = "auto" | "blur" | "blur-color" | "color" | "glass" | "none";
export const invitationPanelStyles = ["auto", "blur", "blur-color", "color", "glass", "none"] as const;
export function isInvitationPanelStyle(value: unknown): value is InvitationPanelStyle {
  return typeof value === "string" && invitationPanelStyles.some(style => style === value);
}
export function isInvitationBlurIntensity(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}
export type SectionType = "countdown" | "cover" | "location" | "story" | "ceremony" | "reception" | "program" | "parents" | "dress_code" | "gifts" | "rsvp" | "gallery" | "music" | "custom";
export type SectionTextAlign = "auto" | "left" | "center" | "right";
export type MobileImageFocus = "top" | "center" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
export function isMobileImageFocus(value: unknown): value is MobileImageFocus {
  return typeof value === "string" && ["top", "center", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"].includes(value);
}
export function isSectionTextAlign(value: unknown): value is SectionTextAlign {
  return typeof value === "string" && ["auto", "left", "center", "right"].includes(value);
}
export type InviteSection = { id: string; type: SectionType; title: string; titleCustomized?: boolean; showIcon?: boolean; content: string; detail: string; link: string; imageUrl: string; imageUrls?: string[]; imagePosition?: "before" | "after"; mobileImageFocus?: MobileImageFocus; desktopImageFocus?: MobileImageFocus; panelStyle?: InvitationPanelStyle; textAlign?: SectionTextAlign; layout?: "auto" | "split" | "centered" | "card"; rsvpMode?: "external" | "integrated"; maxCompanions?: number; whatsappPhone?: string; whatsappMessage?: string; enabled: boolean };
export type EditorValues = {
  privacy?: InvitationPrivacy; pin?: string; pinPending?: boolean;
  name: string; eventType: string; eventDate: string; eventTime: string; hostNames: string; venue: string; address: string;
  message: string; imageUrl: string; backgroundImageUrl?: string; panelStyle?: InvitationPanelStyle; coverLayout?: InvitationCoverLayout; glassBorder?: boolean; blurIntensity?: number; backgroundBlurIntensity?: number; backgroundDimIntensity?: number; showSectionIcons?: boolean; sectionCorners?: InvitationSectionCorners; accent: string; typography: string; bodyTypography: string; sections: InviteSection[];
  customSlug: string; templateId: string; texture: string; heroHorizontal: string; heroVertical: string; buttonAppearance: InvitationButtonAppearance;
};
export type EditorSaveResult = { ok: true; eventId: string; version: number; privacyVersion?: number } | {
  ok: false; code: "validation" | "auth" | "conflict" | "published" | "not-found" | "unavailable";
  message: string; version?: number; privacyVersion?: number;
};
export type EditorWizard = { step: number; activeExtra: string | null; flow?: "content-v2" | "content-v3" | "content-v4" | "content-v5" };
export class EditorSaveFailure extends Error {
  constructor(public result: Extract<EditorSaveResult, { ok: false }>) { super(result.message); }
}
export const EDITOR_AUTOSAVE_DELAY = 1500;
export const EDITOR_DRAFT_LIFETIME = 7 * 24 * 60 * 60 * 1000;
export const editorDraftPrefix = (ownerId: string, scope: string) => `cheetahinvite:editor:v1:${ownerId}:${scope || "new"}:`;
export const validCreationKey = (key: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key);

export function editorFormData(snapshot: string, version: number, creationKey = "") {
  const values = JSON.parse(snapshot) as EditorValues;
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (key === "buttonAppearance") continue;
    form.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  const buttons = values.buttonAppearance;
  form.set("buttonShape", buttons.shape);
  form.set("buttonFilled", String(buttons.filled));
  form.set("buttonIcons", String(buttons.icons));
  form.set("buttonBorder", String(buttons.border));
  form.set("buttonBold", String(buttons.bold));
  form.set("contentVersion", String(version));
  if (creationKey) form.set("creationKey", creationKey);
  return form;
}

export type EditorDraftRecord = {
  schema: 1; ownerId: string; eventId: string; creationKey: string; snapshot: string; version: number;
  updatedAt: number; wizard: EditorWizard; key?: string; privacyVersion?: number;
};

// Local storage is untrusted and may contain obsolete or partially written records.
// Partial form values are valid backups even when the server cannot save them yet.
export function parseEditorDraft(raw: string | null, ownerId: string, scope: string, now: number): EditorDraftRecord | null {
  if (!raw || raw.length > 256_000) return null;
  try {
    const record = JSON.parse(raw) as EditorDraftRecord;
    if (record.schema !== 1 || record.ownerId !== ownerId || (scope && record.eventId !== scope)
      || typeof record.eventId !== "string" || (record.eventId && !/^[a-zA-Z0-9_-]{1,80}$/.test(record.eventId))
      || !validCreationKey(record.creationKey) || !Number.isSafeInteger(record.version) || record.version < 0
      || (record.privacyVersion !== undefined && (!Number.isSafeInteger(record.privacyVersion) || record.privacyVersion < 0))
      || !Number.isFinite(record.updatedAt) || record.updatedAt > now + 60_000 || record.updatedAt < now - EDITOR_DRAFT_LIFETIME
      || typeof record.snapshot !== "string" || !record.wizard || !Number.isInteger(record.wizard.step)
      || record.wizard.step < 0 || record.wizard.step > 15 || !(record.wizard.activeExtra === null || typeof record.wizard.activeExtra === "string")
      || (record.wizard.flow !== undefined && record.wizard.flow !== "content-v2" && record.wizard.flow !== "content-v3" && record.wizard.flow !== "content-v4" && record.wizard.flow !== "content-v5")) return null;
    const values = JSON.parse(record.snapshot) as EditorValues;
    const strings = ["name", "eventType", "eventDate", "eventTime", "hostNames", "venue", "address", "message", "imageUrl", "accent", "typography", "bodyTypography", "customSlug", "templateId", "texture", "heroHorizontal", "heroVertical"] as const;
    if (!values || !strings.every(key => typeof values[key] === "string")
      || (values.privacy !== undefined && !isInvitationPrivacy(values.privacy))
      || (values.pin !== undefined && (typeof values.pin !== "string" || !/^\d{0,6}$/.test(values.pin)))
      || (values.pinPending !== undefined && typeof values.pinPending !== "boolean")
      || (values.showSectionIcons !== undefined && typeof values.showSectionIcons !== "boolean")
      || (values.glassBorder !== undefined && typeof values.glassBorder !== "boolean")
      || (values.sectionCorners !== undefined && !isInvitationSectionCorners(values.sectionCorners))
      || (values.coverLayout !== undefined && !isInvitationCoverLayout(values.coverLayout))
      || (values.blurIntensity !== undefined && !isInvitationBlurIntensity(values.blurIntensity))
      || (values.backgroundBlurIntensity !== undefined && !isInvitationBlurIntensity(values.backgroundBlurIntensity))
      || (values.backgroundDimIntensity !== undefined && !isInvitationBlurIntensity(values.backgroundDimIntensity))
      || (values.panelStyle !== undefined && !invitationPanelStyles.includes(values.panelStyle))
      || (values.backgroundImageUrl !== undefined && (typeof values.backgroundImageUrl !== "string" || values.backgroundImageUrl.length > 1000))
      || (values.eventDate && (!/^\d{4}-\d{2}-\d{2}$/.test(values.eventDate) || !Number.isFinite(Date.parse(`${values.eventDate}T12:00:00Z`))))
      || !Array.isArray(values.sections) || values.sections.length > 15) return null;
    const types = ["countdown", "cover", "location", "story", "ceremony", "reception", "program", "parents", "dress_code", "gifts", "rsvp", "gallery", "music", "custom"];
    if (values.sections.some(section => !section || !types.includes(section.type) || typeof section.enabled !== "boolean"
      || (section.titleCustomized !== undefined && typeof section.titleCustomized !== 'boolean')
      || (section.showIcon !== undefined && typeof section.showIcon !== 'boolean')
      || (section.maxCompanions !== undefined && (section.type !== "rsvp" || !validCompanionLimit(section.maxCompanions)))
      || (section.rsvpMode !== undefined && (section.type !== "rsvp" || !["external", "integrated"].includes(section.rsvpMode)))
      || (section.whatsappPhone !== undefined && (section.type !== "rsvp" || typeof section.whatsappPhone !== "string" || section.whatsappPhone.length > 40))
      || (section.whatsappMessage !== undefined && (section.type !== "rsvp" || typeof section.whatsappMessage !== "string" || section.whatsappMessage.length > 200))
      || (section.desktopImageFocus !== undefined && !isMobileImageFocus(section.desktopImageFocus))
      || (section.mobileImageFocus !== undefined && !isMobileImageFocus(section.mobileImageFocus))
      || (section.imagePosition !== undefined && !["before", "after"].includes(section.imagePosition))
      || (section.panelStyle !== undefined && !isInvitationPanelStyle(section.panelStyle))
      || (section.textAlign !== undefined && !isSectionTextAlign(section.textAlign))
      || !["id", "title", "content", "detail", "link", "imageUrl"].every(key => typeof section[key as keyof InviteSection] === "string")
      || (section.imageUrls !== undefined && (!Array.isArray(section.imageUrls) || section.imageUrls.length > 12 || section.imageUrls.some(url => typeof url !== "string"))))) return null;
    const buttons = values.buttonAppearance;
    if (!buttons || !["square", "rounded", "pill"].includes(buttons.shape) || ![buttons.filled, buttons.icons, buttons.border, buttons.bold].every(value => typeof value === "boolean")) return null;
    return record;
  } catch { return null; }
}

export type EventData = {
  isExample?: boolean; complimentaryAt?: Date | null;
  id: string; ownerId: string; privacy?: string; privacyVersion?: number; contentVersion: number; customSlug: string | null; templateId: string; texture: string; name: string; eventType: string; eventDate: Date | null; eventTime: string | null; hostNames: string | null; paidAt: Date | null; expiresAt: Date | null; status: "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED" | "SUSPENDED" | "REFUNDED"; slug: string | null;
  venue: string | null; address: string | null; message: string | null; imageUrl: string | null; backgroundImageUrl?: string | null; panelStyle?: string; coverLayout?: string; glassBorder?: boolean; blurIntensity?: number; backgroundBlurIntensity?: number; backgroundDimIntensity?: number; showSectionIcons?: boolean; sectionCorners?: string; imageUploads: number; accent: string; typography: string; bodyTypography: string; heroHorizontal?: string; heroVertical?: string; buttonShape?: string; buttonFilled?: boolean; buttonIcons?: boolean; buttonBorder?: boolean; buttonBold?: boolean; sections: unknown;
};

export type InvitationProps = {
  eventType: string; accent: string; name: string; hostNames: string; date: string; eventDateKey?: string; panelStyle?: InvitationPanelStyle; coverLayout?: InvitationCoverLayout; glassBorder?: boolean; blurIntensity?: number; backgroundBlurIntensity?: number; backgroundDimIntensity?: number; showSectionIcons?: boolean; sectionCorners?: InvitationSectionCorners;
  typography?: string; bodyTypography?: string; eventTime?: string; venue: string; address: string;
  message: string; imageUrl: string; backgroundImageUrl?: string; sections: InviteSection[]; publicEventId?: string;
};

export type InvitationEditTarget =
  | { kind: "cover" | "date" | "location" | "cover-photo" | "background" | "appearance" | "add-section" }
  | { kind: "section" | "section-photo" | "section-surface" | "section-alignment" | "section-visibility"; sectionId: string };
