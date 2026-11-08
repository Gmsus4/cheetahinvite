import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { auth } from "@/auth";
import { InvitationShowEditor } from "@/components/dashboard/InvitationShowEditor";
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

  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id }, omit: { pinHash: true } });
  if (!event) notFound();
  if (event.isExample) {
    const example = await prisma.showcaseExample.findUnique({ where: { eventId: id } });
    if (example) redirect(`/admin/disenos/${example.id}/vista-previa`);
    notFound();
  }

  return <main className="public-invitation-page">
    <InvitationShowEditor key={`invitation:${event.id}`} event={event} returnLink={{ href: `/dashboard/eventos/${event.id}`, title: "Volver al editor completo", label: "Editor completo" }} />
  </main>;
}
