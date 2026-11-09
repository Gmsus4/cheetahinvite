import "server-only";
import { prisma } from "@/prisma";
import { Prisma } from "@/generated/prisma/client";
import { invitationLifecycle } from "@/lib/invitation-lifecycle";
import { reconcileInvitationPayment } from "@/lib/payment-fulfillment";
import { queueEventImages, withImageLock } from "@/lib/cloudinary-storage";

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
  const result = { archived: archived.count, deleted: 0, retained: 0, failed: 0 };
  const started = Date.now();
  for (const candidate of candidates) {
    // Leave time for image cleanup in the scheduler's bounded request.
    if (Date.now() - started >= 30_000) break;
    if (invitationLifecycle(candidate, now)?.phase !== "deletion_due") continue;
    try {
      // Verify ambiguous payments before deleting. Provider errors keep all data
      // for a retry; a delayed successful webhook must not lose a valid renewal.
      const attempts = await prisma.invitationPayment.findMany({ where: {
        eventId: candidate.id, ownerId: candidate.ownerId, status: { in: ["PENDING", "FAILED"] },
      } });
      for (const payment of attempts) {
        if (payment.stripeCheckoutSessionId) await reconcileInvitationPayment(payment.id);
        else if (payment.checkoutExpiresAt <= now) await prisma.invitationPayment.updateMany({
          where: { id: payment.id, status: { in: ["PENDING", "FAILED"] }, stripeCheckoutSessionId: null },
          data: { status: "EXPIRED" },
        });
      }
      const deleted = await withImageLock(candidate.ownerId, async tx => {
        await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Event" WHERE "id" = ${candidate.id} FOR UPDATE`);
        const event = await tx.event.findFirst({ where: { id: candidate.id, ownerId: candidate.ownerId, isExample: false } });
        if (!event || invitationLifecycle(event, now)?.phase !== "deletion_due") return false;
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
