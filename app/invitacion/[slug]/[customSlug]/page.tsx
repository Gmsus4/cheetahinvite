import { eventButtonAppearance } from "@/lib/invitation-buttons";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicInvitation } from "@/lib/public-invitation";
import { invitationMetadata } from "@/lib/invitation-metadata";
import { invitationOrigin } from "@/lib/invitation-origin";
import { InvitationCanvas, type InviteSection } from "@/components/dashboard/EventEditor";

type Props = Pick<PageProps<"/invitacion/[slug]/[customSlug]">, "params">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: ownerId, customSlug } = await params;
  const event = await getPublicInvitation(ownerId, customSlug);
  if (!event) notFound();
  return invitationMetadata(event, await invitationOrigin());
}

export default function CustomInvitationPage({ params }: Props) {
  return <Suspense fallback={<div className="editor-loading">Preparando tu invitación…</div>}><InvitationData params={params} /></Suspense>;
}

async function InvitationData({ params }: Props) {
  // The first segment reuses the existing [slug] folder for legacy URL compatibility.
  const { slug: ownerId, customSlug } = await params;
  const event = await getPublicInvitation(ownerId, customSlug);
  if (!event) notFound();
  const date = event.eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate) : "La fecha";
  return <main className="public-invitation-page"><InvitationCanvas publicEventId={event.id} eventType={event.eventType} name={event.name} hostNames={event.hostNames ?? ""} date={date} eventDateKey={event.eventDate?.toISOString().slice(0, 10) ?? ""} eventTime={event.eventTime ?? ""} venue={event.venue ?? ""} address={event.address ?? ""} message={event.message ?? ""} imageUrl={event.imageUrl ?? ""} backgroundImageUrl={event.backgroundImageUrl ?? ""} accent={event.accent} texture={event.texture} templateId={event.templateId} typography={event.typography} bodyTypography={event.bodyTypography} heroHorizontal={event.heroHorizontal} heroVertical={event.heroVertical} buttonAppearance={eventButtonAppearance(event)} sections={Array.isArray(event.sections) ? event.sections as InviteSection[] : []} full /></main>;
}
