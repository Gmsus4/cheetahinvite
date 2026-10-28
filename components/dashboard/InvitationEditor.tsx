"use client";

import { EventEditor as LegacyEditor, type EventData } from "./EventEditor";
import { GuidedWeddingEditor } from "./GuidedWeddingEditor";
import { getWeddingDesign } from "@/lib/wedding-designs";
import { useState } from "react";
import { useRouter } from "next/navigation";

type EditorProps = { event: EventData; saved: boolean; error: string; published: boolean; creation?: boolean };

export function EventEditor(props: EditorProps) {
  const { bfcacheId } = useRouter();
  // Activity preserves the old wizard on a fresh visit. Reset the entire session,
  // including its persistence controller, while keeping ?resume updates in place.
  const sessionKey = props.creation ? bfcacheId : props.event.id;
  return <EditorSession key={`${props.event.ownerId}:${sessionKey}`} {...props} />;
}

function EditorSession(props: EditorProps) {
  const { event, creation } = props;
  const [legacyType, setLegacyType] = useState<string | null>(null);
  const guided = event.eventType === "wedding" && (Boolean(getWeddingDesign(event.templateId)) || (creation && !event.id));
  if (legacyType) return <LegacyEditor {...props} event={{ ...event, eventType: legacyType, templateId: "none" }} />;
  return guided ? <GuidedWeddingEditor {...props} onLegacyRecovery={setLegacyType} /> : <LegacyEditor {...props} />;
}
