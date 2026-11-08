import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import { landingEventExamples } from "@/lib/landing-invitation-example";
import { getShowcaseInvitation, getShowcaseExamples } from "@/lib/showcase";
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
  const invitation = await getShowcaseInvitation(style);
  if (invitation) return <main className="public-invitation-page"><CelebrationInvitation {...invitation} /></main>;
  const examples = [...await getShowcaseExamples("catalog"), ...await getShowcaseExamples("hero")];
  const occasion = invitationEventTypes.find(type => getInvitationEventContent(type).slug === style);
  const match = occasion && examples.find(item => item.invitation.eventType === occasion);
  if (match) redirect(`/ejemplo-invitacion/${match.slug}`);
  if (["flores-blancas", "bugambilias", "flores-amarillas"].includes(style)) redirect("/ejemplo-invitacion/boda");
  notFound();
}
