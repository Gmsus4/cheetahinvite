import type { Event } from "@/generated/prisma/client";
import { canAccessInvitation } from "@/lib/invitation-access";
import { InvitationPinGate } from "./InvitationPinGate";
import { PublicInvitationContent } from "./PublicInvitationContent";

export async function ProtectedInvitationContent({ event }: { event: Omit<Event, "pinHash"> }) {
  if (!await canAccessInvitation(event)) return <InvitationPinGate eventId={event.id} />;
  return <PublicInvitationContent event={event} />;
}
