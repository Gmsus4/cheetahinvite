import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { auth } from "@/auth";
import { InvitationPreviewSession } from "@/components/dashboard/InvitationPreviewSession";
import { validCreationKey } from "@/lib/invitation-editor";
import { prisma } from "@/prisma";
import { canEditInvitation } from "@/lib/invitation-lifecycle";

export const metadata: Metadata = { title: "Vista previa privada | Cheetah Invite" };

type ShowPageProps = PageProps<"/dashboard/eventos/[id]/show">;

export default function ShowInvitationPage(props: ShowPageProps) {
  return <Suspense fallback={<BrandLoader message="Preparando la vista previa…" />}>
    <ShowInvitationData {...props} />
  </Suspense>;
}

async function ShowInvitationData({ params, searchParams }: ShowPageProps) {
  const { id } = await params;
  await connection();
  const query = await searchParams;
  const previewToken = typeof query.preview === "string" && validCreationKey(query.preview) ? query.preview : undefined;
  const returnToDashboard = !previewToken && query.from === "dashboard";
  const callbackQuery = new URLSearchParams();
  if (previewToken) callbackQuery.set("preview", previewToken);
  else if (returnToDashboard) callbackQuery.set("from", "dashboard");
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${id}/show${callbackQuery.size ? `?${callbackQuery}` : ""}`)}`);

  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id }, omit: { pinHash: true } });
  if (!event) notFound();
  if (!canEditInvitation(event)) redirect(`/dashboard/eventos/${id}/pago`);
  if (event.isExample) {
    const example = await prisma.showcaseExample.findUnique({ where: { eventId: id } });
    if (example) redirect(`/admin/disenos/${example.id}/vista-previa${previewToken ? `?preview=${previewToken}` : ""}`);
    notFound();
  }

  return <main className="public-invitation-page">
    <InvitationPreviewSession key={`invitation:${event.id}:${previewToken ?? (returnToDashboard ? "dashboard" : "saved")}`} event={event} previewToken={previewToken} returnToDashboard={returnToDashboard} returnLink={{ href: `/dashboard/eventos/${event.id}`, title: "Volver al editor completo", label: "Editor completo" }} />
  </main>;
}
