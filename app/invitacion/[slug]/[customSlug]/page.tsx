import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/prisma";
import { InvitationCanvas, type InviteSection } from "@/components/dashboard/EventEditor";
import { isValidInvitationSlug } from "@/lib/invitation-url";

export const metadata = { title: "Invitación digital | Cheetah Invite", description: "Estás invitado a celebrar un momento especial." };
type Props = Pick<PageProps<"/invitacion/[slug]/[customSlug]">, "params">;

export default function CustomInvitationPage({ params }: Props) {
  return <Suspense fallback={<div className="editor-loading">Preparando tu invitación…</div>}><InvitationData params={params} /></Suspense>;
}

async function InvitationData({ params }: Props) {
  // The first segment reuses the existing [slug] folder for legacy URL compatibility.
  const { slug: ownerId, customSlug } = await params;
  await connection();
  if (!isValidInvitationSlug(customSlug)) notFound();
  const event = await prisma.event.findFirst({ where: { ownerId, customSlug, status: "PUBLISHED", paidAt: { not: null }, expiresAt: { gt: new Date() } } });
  if (!event) notFound();
  const date = event.eventDate ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate) : "La fecha";
  return <main className="public-invitation-page"><InvitationCanvas eventType={event.eventType} name={event.name} hostNames={event.hostNames ?? ""} date={date} eventDateKey={event.eventDate?.toISOString().slice(0, 10) ?? ""} eventTime={event.eventTime ?? ""} venue={event.venue ?? ""} address={event.address ?? ""} message={event.message ?? ""} imageUrl={event.imageUrl ?? ""} accent={event.accent} texture={event.texture} templateId={event.templateId} typography={event.typography} bodyTypography={event.bodyTypography} sections={Array.isArray(event.sections) ? event.sections as InviteSection[] : []} full /></main>;
}
