import { BrandLoader } from "@/components/BrandLoader";
import { ProtectedInvitationContent } from "@/components/invitation/ProtectedInvitationContent";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getPublicInvitation } from "@/lib/public-invitation";
import { invitationPath } from "@/lib/invitation-url";

type Props = Pick<PageProps<"/invitacion/[slug]">, "params">;

export default function LegacyInvitationPage({ params }: Props) {
  return <Suspense fallback={<BrandLoader message="Preparando tu invitación…" />}><LegacyInvitationData params={params} /></Suspense>;
}

async function LegacyInvitationData({ params }: Props) {
  const { slug } = await params;
  const event = await getPublicInvitation(slug);
  if (!event) notFound();
  const canonical = await getPublicInvitation(event.customSlug || event.slug!, undefined, true);
  if (canonical?.id === event.id) return redirect(invitationPath(event)!);
  return <ProtectedInvitationContent event={event} />;
}
