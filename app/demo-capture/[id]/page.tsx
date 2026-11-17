import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/prisma";
import { validDemoCaptureToken } from "@/lib/demo-capture-token";
import { demoPreviewKey } from "@/lib/demo-preview";
import { showcaseContent, showcasePreview } from "@/lib/showcase";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import "@/app/ejemplo-invitacion/[style]/hero/hero-preview.css";

export const metadata: Metadata = { title: "Vista previa", robots: { index: false, follow: false }, referrer: "no-referrer" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function DemoCapturePage(props: Props) {
  return <Suspense fallback={null}><CaptureContent {...props} /></Suspense>;
}

async function CaptureContent({ params, searchParams }: Props) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const version = typeof query.version === "string" && /^\d+$/.test(query.version) ? Number(query.version) : NaN;
  if (typeof query.expires !== "string" || typeof query.token !== "string" || !validDemoCaptureToken(id, version, query.expires, query.token)) notFound();
  const example = await prisma.showcaseExample.findUnique({ where: { id }, include: { event: true } });
  if (!example?.event.isExample || example.event.contentVersion !== version) notFound();
  const invitation = showcaseContent(example.event);
  return <main className="public-invitation-page" data-preview-key={demoPreviewKey(invitation)}><CelebrationInvitation {...showcasePreview(invitation)} preview /></main>;
}
