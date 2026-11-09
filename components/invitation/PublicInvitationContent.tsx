import { isInvitationCoverLayout } from "@/lib/invitation-cover-layout";
import type { Event } from "@/generated/prisma/client";
import { isInvitationPanelStyle, isInvitationSectionCorners, type InviteSection } from "@/lib/invitation-editor";
import { CelebrationInvitation } from "./CelebrationInvitation";

export function PublicInvitationContent({ event }: { event: Omit<Event, "pinHash"> }) {
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
      showSectionIcons={event.showSectionIcons}
      glassBorder={event.glassBorder}
      backgroundBlurIntensity={event.backgroundBlurIntensity}
      backgroundDimIntensity={event.backgroundDimIntensity}
      coverLayout={isInvitationCoverLayout(event.coverLayout) ? event.coverLayout : "split"}
      sectionCorners={isInvitationSectionCorners(event.sectionCorners) ? event.sectionCorners : "rounded"}
      sections={sections}
    />
  </main>;
}
