import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { InvitationCanvas, type InviteSection } from "@/components/dashboard/EventEditor";
import { prisma } from "@/prisma";

type InvitationPageProps = PageProps<"/invitacion/[slug]">;

export const metadata: Metadata = {
  title: "Invitación digital | Cheetah Invite",
  description: "Estás invitado a celebrar un momento especial.",
};

export default function PublicInvitationPage({ params }: InvitationPageProps) {
  return <Suspense fallback={<div className="editor-loading">Preparando tu invitación…</div>}>
    <InvitationData params={params} />
  </Suspense>;
}

async function InvitationData({ params }: InvitationPageProps) {
  const { slug } = await params;
  await connection();
  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  });
  if (!event) notFound();

  const date = event.eventDate
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate)
    : "La fecha";
  const sections = Array.isArray(event.sections) ? event.sections as InviteSection[] : [];
  return <main className="public-invitation-page">
    <InvitationCanvas
      eventType={event.eventType}
      name={event.name}
      hostNames={event.hostNames ?? ""}
      date={date}
      venue={event.venue ?? ""}
      address={event.address ?? ""}
      message={event.message ?? ""}
      imageUrl={event.imageUrl ?? ""}
      accent={event.accent}
      sections={sections}
      full
    />
  </main>;
}
