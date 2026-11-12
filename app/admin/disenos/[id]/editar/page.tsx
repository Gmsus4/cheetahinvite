import { AdminPageBoundary } from "@/components/admin/AdminUI";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { EventEditor } from "@/components/dashboard/InvitationEditor";

export default function EditExample(props: PageProps<"/admin/disenos/[id]/editar">) {
  return <AdminPageBoundary><EditExampleData {...props} /></AdminPageBoundary>;
}

async function EditExampleData({ params, searchParams }: PageProps<"/admin/disenos/[id]/editar">) {
  const actor = await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const example = await prisma.showcaseExample.findUnique({ where: { id }, include: { event: { omit: { pinHash: true } } } });
  if (!example || example.event.ownerId !== actor.id) notFound();
  return <EventEditor event={example.event} exampleId={id} exampleCreation={query.initial === "1"} saved={false} published={false} error="" account={{ name: actor.name || "Administrador", email: actor.email || "", image: actor.image }} />;
}
