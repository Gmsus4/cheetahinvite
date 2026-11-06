import { PublicInvitationContent } from "@/components/invitation/PublicInvitationContent";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getPublicInvitation } from "@/lib/public-invitation";
import { invitationPath } from "@/lib/invitation-url";

type Props = Pick<PageProps<"/invitacion/[slug]/[customSlug]">, "params">;

export default function LegacyInvitationPage({ params }: Props) {
  return <Suspense fallback={<div className="editor-loading">Preparando tu invitación…</div>}><LegacyInvitationData params={params} /></Suspense>;
}

async function LegacyInvitationData({ params }: Props) {
  const { slug, customSlug } = await params;
  const event = await getPublicInvitation(slug, customSlug);
  if (!event) notFound();
  const canonical = await getPublicInvitation(event.customSlug || event.slug!, undefined, true);
  if (canonical?.id === event.id) return redirect(invitationPath(event)!);
  return <PublicInvitationContent event={event} />;
}
