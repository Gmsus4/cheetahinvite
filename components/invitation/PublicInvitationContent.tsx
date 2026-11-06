import type { Event } from "@/generated/prisma/client";
import { isInvitationPanelStyle, type InviteSection } from "@/lib/invitation-editor";
import { CelebrationInvitation } from "./CelebrationInvitation";

export function PublicInvitationContent({ event }: { event: Event }) {
  const date = event.eventDate
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate)
    : "La fecha";
  const sections = Array.isArray(event.sections) ? event.sections as InviteSection[] : [];
  return <main className="public-invitation-page">
    <CelebrationInvitation
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
      typography={event.typography}
      bodyTypography={event.bodyTypography} blurIntensity={event.blurIntensity} panelStyle={isInvitationPanelStyle(event.panelStyle) ? event.panelStyle : "auto"}
      sections={sections}
    />
  </main>;
}
