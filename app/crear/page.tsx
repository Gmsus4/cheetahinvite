import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { FiGift } from "react-icons/fi";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EventEditor } from "@/components/dashboard/InvitationEditor";
import { prisma } from "@/prisma";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { CreationDraftResume } from "@/components/dashboard/CreationDraftResume";

export const metadata: Metadata = {
  title: "Nueva invitación | Cheetah Invite",
  description: "Empieza un borrador para tu próxima celebración.",
};

export default function CreateEventPage(props: PageProps<"/crear">) {
  return (
    <Suspense fallback={<BrandLoader message="Preparando tu nueva invitación…" />}>
      <CreateEventData {...props} />
    </Suspense>
  );
}

async function CreateEventData({
  searchParams,
}: PageProps<"/crear">) {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fcrear");

  const account = { name: session.user.name || "Usuario", email: session.user.email || "", image: session.user.image };
  const params = await searchParams;
  const initialType = typeof params.tipo === "string" ? params.tipo : "";
  const hasError = typeof params.error === "string";
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { invitationCount: true } });
  const invitationLimitReached = (user?.invitationCount ?? 0) >= ACCOUNT_LIMITS.invitations;
  const resumeId = typeof params.resume === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(params.resume) ? params.resume : "";
  const resumed = resumeId ? await prisma.event.findFirst({ where: { id: resumeId, ownerId: session.user.id, paidAt: null, status: { in: ["DRAFT", "PENDING_PAYMENT"] } }, omit: { pinHash: true } }) : null;
  if (resumed) return <EventEditor key={`${session.user.id}:new`} creation account={account} event={resumed} saved={false} published={false} error="" />;

  if (!invitationLimitReached) return <EventEditor key={`${session.user.id}:new`} creation account={account} event={{
    id: "", ownerId: session.user.id, name: "", eventType: ["wedding", "birthday", "graduation", "baby_shower", "anniversary", "other"].includes(initialType) ? initialType : "wedding",
    contentVersion: 0, customSlug: null, templateId: "none", texture: "none", eventDate: null, eventTime: null, hostNames: null,
    paidAt: null, expiresAt: null, status: "DRAFT", slug: null, venue: null, address: null, message: null,
    imageUrl: null, imageUploads: 0, accent: "#E9560A", typography: "default", bodyTypography: "inter", sections: [],
  }} saved={false} published={false} error={hasError ? "datos" : ""} />;
  return <main className="create-event-page"><DashboardHeader name={account.name} email={account.email} image={account.image} /><section className="create-event-card create-event-limit-card"><span className="create-event-icon"><FiGift /></span><h1>Ya usaste tus {ACCOUNT_LIMITS.invitations} invitaciones disponibles</h1><p>Puedes editar tus invitaciones desde el panel.</p><CreationDraftResume ownerId={session.user.id} /><Link className="button" href="/dashboard">Volver a mi panel</Link></section></main>;
}
