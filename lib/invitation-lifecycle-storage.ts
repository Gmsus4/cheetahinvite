import "server-only";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { draftDeletionDate, invitationLifecycle } from "@/lib/invitation-lifecycle";
import { reconcilePurchase } from "@/lib/payment-reconciliation";
import { queueEventImages, withImageLock } from "@/lib/image-storage";

// Run from the existing authenticated, scheduled cleanup, even without visits.
export async function runInvitationLifecycle(now = new Date(), limit = 10, ownerId?: string) {
  const scope = ownerId ? { ownerId } : {};
  const grant = { OR: [{ paidAt: { not: null } }, { complimentaryAt: { not: null } }] };
  const archived = await prisma.event.updateMany({ where: {
    ...scope, isExample: false, status: { in: ["PUBLISHED", "EXPIRED"] }, expiresAt: { lte: now }, ...grant,
  }, data: { status: "ARCHIVED" } });
  // Scan at most one extra month; calculate the exact calendar deadline below.
  const candidates = await prisma.event.findMany({ where: {
    ...scope, isExample: false, expiresAt: { lte: new Date(now.getTime() - 28 * 86_400_000) }, ...grant,
  }, orderBy: [{ expiresAt: "asc" }, { id: "asc" }], take: limit });
  const drafts = await prisma.event.findMany({ where: {
    ...scope, isExample: false, paidAt: null, complimentaryAt: null, status: { in: ["DRAFT", "PENDING_PAYMENT"] },
    // Broad indexed scan; exact calendar deadline is checked below, including month ends.
    draftLastSavedAt: { lte: new Date(now.getTime() - 180 * 86_400_000) },
  }, orderBy: [{ draftLastSavedAt: "asc" }, { id: "asc" }], take: limit });
  const isDue = (event: Parameters<typeof draftDeletionDate>[0] & Parameters<typeof invitationLifecycle>[0]) => {
    const deadline = draftDeletionDate(event);
    return deadline ? deadline <= now : invitationLifecycle(event, now)?.phase === "deletion_due";
  };
  const result = { archived: archived.count, deleted: 0, retained: 0, failed: 0 };
  const started = Date.now();
  for (const candidate of [...candidates, ...drafts]) {
    // Leave time for image cleanup in the scheduler's bounded request.
    if (Date.now() - started >= 30_000) break;
    if (!isDue(candidate)) continue;
    try {
      // Verify ambiguous payments before deleting. Provider errors keep all data
      // for a retry; a delayed successful webhook must not lose a valid renewal.
      const attempts = await prisma.invitationPayment.findMany({ where: {
        eventId: candidate.id, ownerId: candidate.ownerId, status: { in: ["PENDING", "FAILED"] },
      } });
      for (const payment of attempts) {
        if (payment.stripeCheckoutSessionId || payment.providerCheckoutId) await reconcilePurchase(payment.id);
        else if (payment.checkoutExpiresAt <= now) await prisma.invitationPayment.updateMany({
          where: { id: payment.id, status: { in: ["PENDING", "FAILED"] }, stripeCheckoutSessionId: null, providerCheckoutId: null },
          data: { status: "EXPIRED" },
        });
      }
      const deleted = await withImageLock(candidate.ownerId, async tx => {
        await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${candidate.id} FOR UPDATE`);
        const event = await tx.event.findFirst({ where: { id: candidate.id, ownerId: candidate.ownerId, isExample: false } });
        if (!event || !isDue(event)) return false;
        const unresolved = await tx.invitationPayment.findFirst({ where: {
          eventId: event.id, ownerId: event.ownerId, status: { in: ["PENDING", "FAILED"] },
        } });
        if (unresolved) return false;
        await queueEventImages(tx, event.ownerId, event.id, event);
        const removed = await tx.event.deleteMany({ where: { id: event.id, ownerId: event.ownerId, expiresAt: event.expiresAt } });
        if (!removed.count) return false;
        await tx.user.updateMany({ where: { id: event.ownerId, invitationCount: { gt: 0 } }, data: { invitationCount: { decrement: 1 } } });
        return true;
      });
      if (deleted) result.deleted++;
      else result.retained++;
    } catch {
      result.failed++;
    }
  }
  return result;
}
