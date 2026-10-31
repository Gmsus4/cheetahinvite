"use client";

import type { EventData } from './EventEditor';
import { GuidedInvitationEditor } from './GuidedInvitationEditor';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandEmblem } from '@/components/BrandEmblem';
import { invitationEventTypes, getInvitationEventContent } from '@/lib/invitation-event-content';
import { CreationDraftResume } from './CreationDraftResume';

type EditorProps = { event: EventData; saved: boolean; error: string; published: boolean; creation?: boolean; account?: { name: string; email: string; image?: string | null } };
export function EventEditor(props: EditorProps) {
  const { bfcacheId } = useRouter();
  const sessionKey = props.creation ? bfcacheId : props.event.id;
  return <EditorSession key={`${props.event.ownerId}:${sessionKey}`} {...props} />;
}
function EditorSession(props: EditorProps) {
  const [type, setType] = useState<string | null>(props.creation && !props.event.id ? null : props.event.eventType);
  if (!type) return <main className="guided-editor guided-type-page">
    <header className="guided-header"><Link className="brand" href="/dashboard"><BrandEmblem size={34} /><span className="brand-name">Cheetah<span>Invite</span></span></Link><Link href="/dashboard">Mis eventos →</Link></header>
    <section className="guided-type-content"><span className="guided-eyebrow">EMPECEMOS POR TU CELEBRACIÓN</span><h1>¿Qué vas a celebrar?</h1><p>Primero elige el tipo de invitación. Después encontrarás sus diseños y todos los detalles para hacerla tuya.</p>
      <div className="guided-type-options">{invitationEventTypes.map((eventType, index) => <button type="button" key={eventType} onClick={() => setType(eventType)}><span aria-hidden="true">{['♡','✳','✦','☁','∞','✧'][index]}</span><strong>{getInvitationEventContent(eventType).label}</strong><small>{eventType === 'birthday' ? 'Confeti, Globos pastel, Neón, Disco, Espacial y Dinosaurios' : eventType === 'wedding' ? '12 diseños para su gran día' : 'Personaliza cada detalle'}</small><span aria-hidden="true">↗</span></button>)}</div>
      <CreationDraftResume ownerId={props.event.ownerId} />
    </section></main>;
  return <GuidedInvitationEditor {...props} event={{...props.event,eventType:type}} />;
}
