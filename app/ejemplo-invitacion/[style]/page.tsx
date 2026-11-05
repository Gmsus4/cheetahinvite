import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import { landingEventExamples } from "@/lib/landing-invitation-example";
import { exampleWithImages } from "@/lib/invitation-example-images";
import { getInvitationEventContent, invitationEventTypes } from "@/lib/invitation-event-content";

export const metadata: Metadata = { title: "Invitación de ejemplo | Cheetah Invite", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return landingEventExamples.map(({ slug }) => ({ style: slug }));
}

export default function InvitationExamplePage({ params }: { params: Promise<{ style: string }> }) {
  return <Suspense fallback={<p role="status">Preparando invitación de ejemplo…</p>}><InvitationExampleData params={params} /></Suspense>;
}

async function InvitationExampleData({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const example = landingEventExamples.find(({ slug }) => slug === style);
  if (example) return <main className="public-invitation-page"><CelebrationInvitation {...exampleWithImages(example)} /></main>;
  const occasion = invitationEventTypes.find(type => getInvitationEventContent(type).slug === style);
  if (occasion) redirect(`/ejemplo-invitacion/${landingEventExamples.find(item => item.invitation.eventType === occasion)!.slug}`);
  if (style.startsWith("cumpleanos-")) redirect("/ejemplo-invitacion/cumpleanos");
  if (style.startsWith("boda-") || ["flores-blancas", "bugambilias", "flores-amarillas"].includes(style)) redirect("/ejemplo-invitacion/boda");
  notFound();
}
