import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BrandLoader } from "@/components/BrandLoader";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import { ExampleStyleAction } from "@/components/landing/ExampleStyleAction";
import { landingEventExamples } from "@/lib/landing-invitation-example";
import { getShowcaseInvitation, getShowcaseExamples } from "@/lib/showcase";
import { getInvitationEventContent, invitationEventTypes } from "@/lib/invitation-event-content";

export const metadata: Metadata = { title: "Invitación de ejemplo | Cheetah Invite", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return landingEventExamples.map(({ slug }) => ({ style: slug }));
}

export default function InvitationExamplePage({ params }: { params: Promise<{ style: string }> }) {
  return <Suspense fallback={<BrandLoader message="Cargando invitación de ejemplo…" showMessage={false} />}><InvitationExampleData params={params} /></Suspense>;
}

async function InvitationExampleData({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const invitation = await getShowcaseInvitation(style);
  if (invitation) return <main className="public-invitation-page"><CelebrationInvitation {...invitation} /><ExampleStyleAction styleSlug={style} /></main>;
  const examples = [...await getShowcaseExamples("catalog"), ...await getShowcaseExamples("hero")];
  const occasion = invitationEventTypes.find(type => getInvitationEventContent(type).slug === style);
  const match = occasion && examples.find(item => item.invitation.eventType === occasion);
  if (match) redirect(`/ejemplo-invitacion/${match.slug}`);
  if (["flores-blancas", "bugambilias", "flores-amarillas"].includes(style)) redirect("/ejemplo-invitacion/boda");
  notFound();
}
