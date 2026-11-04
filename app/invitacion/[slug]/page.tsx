import { eventButtonAppearance } from "@/lib/invitation-buttons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { invitationPath } from "@/lib/invitation-url";
import { InvitationCanvas, type InviteSection } from "@/components/dashboard/EventEditor";
import { getPublicInvitation } from "@/lib/public-invitation";
import { invitationMetadata } from "@/lib/invitation-metadata";
import { invitationOrigin } from "@/lib/invitation-origin";

type InvitationPageProps = Pick<PageProps<"/invitacion/[slug]">, "params">;

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicInvitation(slug);
  if (!event) notFound();
  if (event.customSlug) redirect(invitationPath(event)!);
  return invitationMetadata(event, await invitationOrigin());
}

export default function PublicInvitationPage({ params }: InvitationPageProps) {
  return <Suspense fallback={<div className="editor-loading">Preparando tu invitación…</div>}>
    <InvitationData params={params} />
  </Suspense>;
}

async function InvitationData({ params }: InvitationPageProps) {
  const { slug } = await params;
  const event = await getPublicInvitation(slug);
  if (!event) notFound();
  if (event.customSlug) redirect(invitationPath(event)!);

  const date = event.eventDate
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate)
    : "La fecha";
  const sections = Array.isArray(event.sections) ? event.sections as InviteSection[] : [];
  return <main className="public-invitation-page">
    <InvitationCanvas
      publicEventId={event.id}
      eventType={event.eventType}
      name={event.name}
      hostNames={event.hostNames ?? ""}
      date={date}
      eventDateKey={event.eventDate?.toISOString().slice(0, 10) ?? ""}
      eventTime={event.eventTime ?? ""}
      venue={event.venue ?? ""}
      address={event.address ?? ""}
      message={event.message ?? ""}
      imageUrl={event.imageUrl ?? ""} backgroundImageUrl={event.backgroundImageUrl ?? ""}
      accent={event.accent}
      texture={event.texture} templateId={event.templateId}
      typography={event.typography}
      bodyTypography={event.bodyTypography} heroHorizontal={event.heroHorizontal} heroVertical={event.heroVertical} buttonAppearance={eventButtonAppearance(event)}
      sections={sections}
      full
    />
  </main>;
}
