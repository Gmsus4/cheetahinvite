import { AdminPageBoundary } from "@/components/admin/AdminUI";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { InvitationShowEditor } from "@/components/dashboard/InvitationShowEditor";

export default function ExamplePreview(props: PageProps<"/admin/disenos/[id]/vista-previa">) {
  return <AdminPageBoundary><ExamplePreviewData {...props} /></AdminPageBoundary>;
}

async function ExamplePreviewData({ params }: PageProps<"/admin/disenos/[id]/vista-previa">) {
  const actor = await requireAdmin();
  const { id } = await params;
  const example = await prisma.showcaseExample.findUnique({ where: { id }, include: { event: { omit: { pinHash: true } } } });
  if (!example || example.event.ownerId !== actor.id) notFound();
  return <main className="public-invitation-page"><InvitationShowEditor key={`example:${id}:${example.eventId}`} event={example.event} returnLink={{ href: `/admin/disenos/${id}`, title: "Volver al ejemplo", label: "Gestionar ejemplo" }} /></main>;
}
