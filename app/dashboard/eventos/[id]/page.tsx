import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { EventEditor } from "@/components/dashboard/EventEditor";

export const metadata: Metadata = { title: "Editar invitación | Cheetah Invite" };

export default function EditEventPage({ params, searchParams }: PageProps<"/dashboard/eventos/[id]">) {
  return <Suspense fallback={<div className="editor-loading">Abriendo tu invitación…</div>}>
    <EditorData params={params} searchParams={searchParams} />
  </Suspense>;
}

async function EditorData({ params, searchParams }: PageProps<"/dashboard/eventos/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/eventos/${id}`)}`);

  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id } });
  if (!event) notFound();

  return <EventEditor event={event} saved={query.saved === "1"} published={query.published === "1"} error={typeof query.error === "string" ? query.error : ""} />;
}
