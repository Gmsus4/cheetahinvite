import { BrandLoader } from "@/components/BrandLoader";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { invitationPath } from "@/lib/invitation-url";
import { ProtectedInvitationContent } from "@/components/invitation/ProtectedInvitationContent";
import { getPublicInvitation } from "@/lib/public-invitation";
import { invitationMetadata } from "@/lib/invitation-metadata";
import { invitationOrigin } from "@/lib/invitation-origin";

type InvitationPageProps = Pick<PageProps<"/event/[slug]">, "params">;

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicInvitation(slug, undefined, true);
  if (!event) notFound();
  if (invitationPath(event) !== `/event/${slug}`) redirect(invitationPath(event)!);
  return invitationMetadata(event, await invitationOrigin());
}

export default function PublicInvitationPage({ params }: InvitationPageProps) {
  return <Suspense fallback={<BrandLoader message="Preparando tu invitación…" />}>
    <InvitationData params={params} />
  </Suspense>;
}

async function InvitationData({ params }: InvitationPageProps) {
  const { slug } = await params;
  const event = await getPublicInvitation(slug, undefined, true);
  if (!event) notFound();
  if (invitationPath(event) !== `/event/${slug}`) redirect(invitationPath(event)!);

  return <ProtectedInvitationContent event={event} />;
}
