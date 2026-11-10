import { parseEditorDraft, validCreationKey, type EditorDraftRecord, type EditorValues } from "@/lib/invitation-editor";

const lifetime = 30 * 60 * 1000;
export type InvitationPreviewRecord = EditorDraftRecord & { saved?: boolean };
export const invitationPreviewKey = (ownerId: string, eventId: string, token: string) => `cheetahinvite:preview:v1:${ownerId}:${eventId}:${token}`;

// This handoff belongs only to the private /show editor. It never writes an event.
export function storeInvitationPreview(storage: Storage, record: Omit<InvitationPreviewRecord, "schema" | "updatedAt" | "wizard">, token: string, now = Date.now()) {
  if (!validCreationKey(token)) throw new Error("Invalid preview token");
  const values = JSON.parse(record.snapshot) as EditorValues;
  delete values.privacy; delete values.pin; delete values.pinPending;
  const transfer: InvitationPreviewRecord = { ...record, snapshot: JSON.stringify(values), schema: 1, updatedAt: now, wizard: { step: 0, activeExtra: null } };
  const raw = JSON.stringify(transfer);
  if (!parseInvitationPreview(raw, record.ownerId, record.eventId, now)) throw new Error("Invalid preview content");
  const prefix = invitationPreviewKey(record.ownerId, record.eventId, "");
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (key?.startsWith(prefix) && !parseInvitationPreview(storage.getItem(key), record.ownerId, record.eventId, now)) storage.removeItem(key);
  }
  storage.setItem(invitationPreviewKey(record.ownerId, record.eventId, token), raw);
}

export function parseInvitationPreview(raw: string | null, ownerId: string, eventId: string, now = Date.now()) {
  const record = parseEditorDraft(raw, ownerId, eventId, now) as InvitationPreviewRecord | null;
  if (!record || record.eventId !== eventId || record.updatedAt < now - lifetime || (record.saved !== undefined && typeof record.saved !== "boolean")) return null;
  const values = JSON.parse(record.snapshot) as EditorValues;
  if (values.privacy !== undefined || values.pin !== undefined || values.pinPending !== undefined) return null;
  return record;
}
