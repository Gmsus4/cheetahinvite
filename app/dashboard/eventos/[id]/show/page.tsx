import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { auth } from "@/auth";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import type { InviteSection } from "@/lib/invitation-editor";
import { prisma } from "@/prisma";

export const metadata: Metadata = { title: "Vista previa privada | Cheetah Invite" };

type ShowPageProps = Pick<PageProps<"/dashboard/eventos/[id]/show">, "params">;

export default function ShowInvitationPage({ params }: ShowPageProps) {
  return <Suspense fallback={<BrandLoader message="Preparando la vista previa…" />}>
    <ShowInvitationData params={params} />
  </Suspense>;
}

async function ShowInvitationData({ params }: ShowPageProps) {
  const { id } = await params;
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${id}/show`)}`);

  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id } });
  if (!event) notFound();

  const date = event.eventDate
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(event.eventDate)
    : "La fecha";
  const sections = Array.isArray(event.sections) ? event.sections as InviteSection[] : [];

  return <main className="public-invitation-page">
    <CelebrationInvitation
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
      bodyTypography={event.bodyTypography}
      sections={sections}
    />
  </main>;
}
