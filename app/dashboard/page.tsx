import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { BrandLoader } from "@/components/BrandLoader";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import "./dashboard-home.css";

export const metadata: Metadata = {
  title: "Mi panel | Cheetah Invite",
  description: "Administra tus invitaciones digitales y eventos.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <DashboardData />
    </Suspense>
  );
}

async function DashboardData() {
  await connection();
  // This clock is read on the server after opting into request-time rendering.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const session = await auth();
  const user = session?.user;

  if (!user?.id) redirect("/login?callbackUrl=%2Fdashboard");

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
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, image: true },
    }),
  ]);

  return (
    <DashboardContent
      now={now}
      userName={account?.name || user.name || "Usuario"}
      userEmail={account?.email || user.email || ""}
      userImage={account?.image || user.image}
      events={events}
    />
  );
}
