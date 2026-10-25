import type { Metadata } from "next";
import Link from "next/link";
import { invitationPath } from "@/lib/invitation-url";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { FiArrowLeft, FiEdit2, FiLock } from "react-icons/fi";
import { isInvitationPublished } from "@/lib/invitation-payment";
import { auth } from "@/auth";
import { InvitationCanvas, type InviteSection } from "@/components/dashboard/EventEditor";
import { prisma } from "@/prisma";

export const metadata: Metadata = { title: "Vista previa privada | Cheetah Invite" };

type ShowPageProps = Pick<PageProps<"/dashboard/eventos/[id]/show">, "params">;

export default function ShowInvitationPage({ params }: ShowPageProps) {
  return <Suspense fallback={<div className="editor-loading">Preparando la vista previa…</div>}>
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
  const isPublished = isInvitationPublished(event);

  return <main className="show-preview-page">
    <header className="show-preview-toolbar">
      <Link href={`/dashboard/eventos/${event.id}`} className="show-preview-back"><FiArrowLeft /> Volver al editor</Link>
      <div className="show-preview-private">{isPublished ? "INVITACIÓN PUBLICADA" : <><FiLock /> VISTA PRIVADA · BORRADOR</>}</div>
      <Link href={`/dashboard/eventos/${event.id}`} className="show-preview-edit"><FiEdit2 /> Editar</Link>
    </header>
    <div className="show-preview-scroll">
      <div className="show-preview-caption"><span>VISTA PREVIA COMPLETA</span><p>Así se verá tu invitación cuando esté publicada.</p></div>
      <InvitationCanvas
        eventType={event.eventType}
        name={event.name}
        hostNames={event.hostNames ?? ""}
        date={date}
        eventDateKey={event.eventDate?.toISOString().slice(0, 10) ?? ""}
        eventTime={event.eventTime ?? ""}
        venue={event.venue ?? ""}
        address={event.address ?? ""}
        message={event.message ?? ""}
        imageUrl={event.imageUrl ?? ""}
        accent={event.accent}
        templateId={event.templateId}
      typography={event.typography}
        bodyTypography={event.bodyTypography}
        sections={sections}
        full
      />
    </div>
    <footer className="show-preview-footer">{isPublished && event.slug ? <><Link href={invitationPath(event)!} target="_blank">Abrir invitación pública</Link><span>·</span><span>Comparte el enlace desde tu panel.</span></> : <><FiLock /> Esta página es privada y no tiene enlace para compartir. Publícala desde el editor cuando esté lista.</>}</footer>
  </main>;
}
