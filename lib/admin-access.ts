import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

export async function requireAdmin() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin");
  // Query the database on every operation; stale JWTs cannot retain a revoked role.
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, name: true, email: true, image: true } });
  if (user?.role !== "ADMIN") notFound();
  return user;
}
