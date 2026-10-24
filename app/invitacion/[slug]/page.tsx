import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { InvitationCanvas, type InviteSection } from "@/components/dashboard/EventEditor";
import { prisma } from "@/prisma";

type InvitationPageProps = PageProps<"/invitacion/[slug]">;

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { name: true, message: true },
  });
  if (!event) return { title: "Invitación no disponible | Cheetah Invite" };
  return {
    title: `${event.name} | Cheetah Invite`,
    description: event.message || `Te invitamos a celebrar: ${event.name}.`,
  };
}

export default async function PublicInvitationPage({ params }: InvitationPageProps) {
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
