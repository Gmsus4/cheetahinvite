import { AdminPageBoundary } from "@/components/admin/AdminUI";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { InvitationPreviewSession } from "@/components/dashboard/InvitationPreviewSession";
import { validCreationKey } from "@/lib/invitation-editor";

export default function ExamplePreview(props: PageProps<"/admin/disenos/[id]/vista-previa">) {
  return <AdminPageBoundary><ExamplePreviewData {...props} /></AdminPageBoundary>;
}

async function ExamplePreviewData({ params, searchParams }: PageProps<"/admin/disenos/[id]/vista-previa">) {
  const actor = await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const previewToken = typeof query.preview === "string" && validCreationKey(query.preview) ? query.preview : undefined;
  const example = await prisma.showcaseExample.findUnique({ where: { id }, include: { event: { omit: { pinHash: true } } } });
  if (!example || example.event.ownerId !== actor.id) notFound();
  return <main className="public-invitation-page"><InvitationPreviewSession key={`example:${id}:${example.eventId}:${previewToken ?? "saved"}`} event={example.event} previewToken={previewToken} returnLink={previewToken ? { href: `/admin/disenos/${id}/editar?initial=1`, title: "Volver al editor del ejemplo", label: "Volver al editor" } : { href: `/admin/disenos/${id}`, title: "Volver al ejemplo", label: "Gestionar ejemplo" }} /></main>;
}
