import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { prisma } from "@/prisma";

export const metadata: Metadata = {
  title: "Mis eventos | Cheetah Invite",
  description: "Administra y comparte tus invitaciones digitales.",
};

export default function DashboardEventsPage() {
  return <Suspense fallback={<div className="dashboard-loading">Cargando tus eventos…</div>}>
    <DashboardEventsData />
  </Suspense>;
}

async function DashboardEventsData() {
  await connection();
  // This clock is read on the server after opting into request-time rendering.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/login?callbackUrl=%2Fdashboard%2Feventos");

  const [events, account] = await Promise.all([
    prisma.event.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        eventType: true,
        imageUrl: true,
        status: true,
        eventDate: true,
        expiresAt: true,
        paidAt: true,
        slug: true,
        ownerId: true,
        customSlug: true,
        updatedAt: true,
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
  ]);

  return <DashboardContent
    now={now}
    userName={account?.name || user.name || "Usuario"}
    userEmail={account?.email || user.email || ""}
    events={events}
    view="events"
  />;
}
