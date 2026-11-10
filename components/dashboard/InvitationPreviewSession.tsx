"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import type { EventData } from "@/lib/invitation-editor";
import { invitationPreviewKey, parseInvitationPreview, storeInvitationPreview } from "@/lib/invitation-preview";
import { initialGuidedValues } from "@/lib/guided-invitation";
import { InvitationShowEditor } from "./InvitationShowEditor";

type Props = { event: EventData; returnLink: { href: string; title: string; label: string }; previewToken?: string };
const subscribe = (listener: () => void) => { window.addEventListener("storage", listener); return () => window.removeEventListener("storage", listener); };
const serverSnapshot = () => undefined;

export function InvitationPreviewSession(props: Props) {
  return props.previewToken ? <IncomingPreview {...props} /> : <InvitationShowEditor event={props.event} returnLink={props.returnLink} />;
}

function IncomingPreview({ event, returnLink, previewToken }: Props) {
  const raw = useSyncExternalStore(subscribe, () => {
    try { return window.localStorage.getItem(invitationPreviewKey(event.ownerId, event.id, previewToken!)); }
    catch { return null; }
  }, serverSnapshot);
  if (raw === undefined) return <BrandLoader message="Abriendo tu vista previa…" />;
  const changes = parseInvitationPreview(raw, event.ownerId, event.id);
  if (!changes) return <section className="create-event-card" role="alert"><h1>No pudimos abrir tus cambios</h1><p>Vuelve al editor y abre la vista previa de nuevo. La invitación publicada no se ha modificado.</p><Link className="button" href={returnLink.href}>Volver al editor</Link></section>;
  const initialChanges = { ...changes, sessionId: previewToken, ...(changes.saved ? {
    snapshot: JSON.stringify(initialGuidedValues(event)), version: event.contentVersion, privacyVersion: event.privacyVersion ?? 0,
  } : {}) };
  return <InvitationShowEditor event={event} returnLink={returnLink} initialChanges={initialChanges} onSaved={(snapshot, version, privacyVersion) => {
    // Refreshing this /show URL should use the version just saved explicitly.
    try { storeInvitationPreview(window.localStorage, { ...changes, snapshot, version, privacyVersion: privacyVersion ?? changes.privacyVersion, saved: true }, previewToken!); }
    catch { /* A later reload still checks the old revision before any save. */ }
  }} />;
}
