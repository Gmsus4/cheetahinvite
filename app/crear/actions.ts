"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

const eventTypes = new Set([
  "wedding",
  "birthday",
  "graduation",
  "baby_shower",
  "anniversary",
  "other",
]);

export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fcrear");

  const name = String(formData.get("name") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "");
  const dateValue = String(formData.get("eventDate") ?? "");

  if (name.length < 2 || name.length > 100 || !eventTypes.has(eventType)) {
    redirect("/crear?error=datos");
  }

  const eventDate = dateValue ? new Date(`${dateValue}T12:00:00.000Z`) : null;
  if (eventDate && Number.isNaN(eventDate.getTime())) redirect("/crear?error=fecha");

  await prisma.event.create({
    data: {
      ownerId: session.user.id,
      name,
      eventType,
      eventDate,
    },
  });

  redirect("/dashboard");
}
