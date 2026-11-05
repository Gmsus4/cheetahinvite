"use client";

import type { EventData } from './EventEditor';
import { GuidedInvitationEditor } from './GuidedInvitationEditor';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventTypePicker } from './EventTypePicker';

type EditorProps = { event: EventData; saved: boolean; error: string; published: boolean; creation?: boolean; account?: { name: string; email: string; image?: string | null } };
export function EventEditor(props: EditorProps) {
  const { bfcacheId } = useRouter();
  const sessionKey = props.creation ? bfcacheId : props.event.id;
  return <EditorSession key={`${props.event.ownerId}:${sessionKey}`} {...props} />;
}
function EditorSession(props: EditorProps) {
  const [type, setType] = useState<string | null>(props.creation && !props.event.id ? null : props.event.eventType);
  if (!type) return <EventTypePicker ownerId={props.event.ownerId} account={props.account} onSelect={setType} />;
  return <GuidedInvitationEditor {...props} event={{...props.event,eventType:type}} />;
}
