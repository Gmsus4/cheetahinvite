"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { LuArrowRight } from "react-icons/lu";
import { editorDraftPrefix, parseEditorDraft } from "@/lib/invitation-editor";

function latestCreation(ownerId: string, existingEventIds: readonly string[]) {
  try {
    const prefix = editorDraftPrefix(ownerId, "");
    let latest: { id: string; time: number } | null = null;
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const record = parseEditorDraft(localStorage.getItem(key), ownerId, "", Date.now());
      if (record && existingEventIds.includes(record.eventId || record.creationKey)) continue;
      if (record && (!latest || record.updatedAt > latest.time)) latest = { id: record.eventId || record.creationKey, time: record.updatedAt };
    }
    return latest?.id ?? null;
  } catch { return null; }
}
const subscribe = (listener: () => void) => { window.addEventListener("storage", listener); return () => window.removeEventListener("storage", listener); };
const serverSnapshot = () => null;

const noExistingEvents: readonly string[] = [];

export function CreationDraftResume({ ownerId, existingEventIds = noExistingEvents }: { ownerId: string; existingEventIds?: readonly string[] }) {
  const snapshot = useCallback(() => latestCreation(ownerId, existingEventIds), [ownerId, existingEventIds]);
  const id = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return id ? <p className="editor-recovery"><Link className="editor-resume-link" href={`/crear?resume=${id}`}><span>Recuperar la invitación que estabas creando</span><LuArrowRight size={18} aria-hidden="true" /></Link></p> : null;
}
