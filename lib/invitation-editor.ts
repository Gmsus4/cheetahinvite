import type { InvitationButtonAppearance } from "@/lib/invitation-buttons";

export type SectionType = "story" | "ceremony" | "reception" | "program" | "parents" | "dress_code" | "gifts" | "rsvp" | "gallery" | "music" | "custom";
export type InviteSection = { id: string; type: SectionType; title: string; content: string; detail: string; link: string; imageUrl: string; imageUrls?: string[]; imagePosition?: "before" | "after"; panelStyle?: "auto" | "blur" | "blur-color" | "color"; layout?: "auto" | "split" | "centered" | "card"; rsvpMode?: "external" | "integrated"; enabled: boolean };
export type EditorValues = {
  name: string; eventType: string; eventDate: string; eventTime: string; hostNames: string; venue: string; address: string;
  message: string; imageUrl: string; backgroundImageUrl?: string; accent: string; typography: string; bodyTypography: string; sections: InviteSection[];
  customSlug: string; templateId: string; texture: string; heroHorizontal: string; heroVertical: string; buttonAppearance: InvitationButtonAppearance;
};
export type EditorSaveResult = { ok: true; eventId: string; version: number } | {
  ok: false; code: "validation" | "auth" | "conflict" | "published" | "not-found" | "unavailable";
  message: string; version?: number;
};
export type EditorWizard = { step: number; activeExtra: string | null; flow?: "content-v2" | "content-v3" | "content-v4" };
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
  updatedAt: number; wizard: EditorWizard; key?: string;
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
      || !Number.isFinite(record.updatedAt) || record.updatedAt > now + 60_000 || record.updatedAt < now - EDITOR_DRAFT_LIFETIME
      || typeof record.snapshot !== "string" || !record.wizard || !Number.isInteger(record.wizard.step)
      || record.wizard.step < 0 || record.wizard.step > 15 || !(record.wizard.activeExtra === null || typeof record.wizard.activeExtra === "string")
      || (record.wizard.flow !== undefined && record.wizard.flow !== "content-v2" && record.wizard.flow !== "content-v3" && record.wizard.flow !== "content-v4")) return null;
    const values = JSON.parse(record.snapshot) as EditorValues;
    const strings = ["name", "eventType", "eventDate", "eventTime", "hostNames", "venue", "address", "message", "imageUrl", "accent", "typography", "bodyTypography", "customSlug", "templateId", "texture", "heroHorizontal", "heroVertical"] as const;
    if (!values || !strings.every(key => typeof values[key] === "string")
      || (values.backgroundImageUrl !== undefined && (typeof values.backgroundImageUrl !== "string" || values.backgroundImageUrl.length > 1000))
      || (values.eventDate && (!/^\d{4}-\d{2}-\d{2}$/.test(values.eventDate) || !Number.isFinite(Date.parse(`${values.eventDate}T12:00:00Z`))))
      || !Array.isArray(values.sections) || values.sections.length > 12) return null;
    const types = ["story", "ceremony", "reception", "program", "parents", "dress_code", "gifts", "rsvp", "gallery", "music", "custom"];
    if (values.sections.some(section => !section || !types.includes(section.type) || typeof section.enabled !== "boolean"
      || (section.rsvpMode !== undefined && (section.type !== "rsvp" || !["external", "integrated"].includes(section.rsvpMode)))
      || (section.imagePosition !== undefined && !["before", "after"].includes(section.imagePosition))
      || (section.panelStyle !== undefined && !["auto", "blur", "blur-color", "color"].includes(section.panelStyle))
      || !["id", "title", "content", "detail", "link", "imageUrl"].every(key => typeof section[key as keyof InviteSection] === "string")
      || (section.imageUrls !== undefined && (!Array.isArray(section.imageUrls) || section.imageUrls.length > 12 || section.imageUrls.some(url => typeof url !== "string"))))) return null;
    const buttons = values.buttonAppearance;
    if (!buttons || !["square", "rounded", "pill"].includes(buttons.shape) || ![buttons.filled, buttons.icons, buttons.border, buttons.bold].every(value => typeof value === "boolean")) return null;
    return record;
  } catch { return null; }
}

export type EventData = {
  id: string; ownerId: string; contentVersion: number; customSlug: string | null; templateId: string; texture: string; name: string; eventType: string; eventDate: Date | null; eventTime: string | null; hostNames: string | null; paidAt: Date | null; expiresAt: Date | null; status: "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED" | "SUSPENDED" | "REFUNDED"; slug: string | null;
  venue: string | null; address: string | null; message: string | null; imageUrl: string | null; backgroundImageUrl?: string | null; imageUploads: number; accent: string; typography: string; bodyTypography: string; heroHorizontal?: string; heroVertical?: string; buttonShape?: string; buttonFilled?: boolean; buttonIcons?: boolean; buttonBorder?: boolean; buttonBold?: boolean; sections: unknown;
};

export type InvitationProps = {
  eventType: string; accent: string; name: string; hostNames: string; date: string; eventDateKey?: string;
  typography?: string; bodyTypography?: string; eventTime?: string; venue: string; address: string;
  message: string; imageUrl: string; backgroundImageUrl?: string; sections: InviteSection[]; publicEventId?: string;
};
