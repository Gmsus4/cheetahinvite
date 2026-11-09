/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in real PostgreSQL checks, scoped strictly to a disposable test account. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ownerId = `__lifecycle_test_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { Prisma } = require('../generated/prisma/client.ts');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');
const f = createPaymentFixture({ prisma, Prisma, ownerId });
const { runInvitationLifecycle } = f.load('lib/invitation-lifecycle-storage.ts');
const { addCalendarMonths } = f.load('lib/invitation-lifecycle.ts');
const now = new Date(), DAY = 86400000;
process.env.CLOUDINARY_CLOUD_NAME = 'lifecycle-fixture';

(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, name: 'Lifecycle fixture', invitationCount: 3 } });
    const expiresAt = new Date(now.getTime() - 40 * DAY);
    const due = await prisma.event.create({ data: { ownerId, name: 'Due fixture', eventType: 'other', status: 'PUBLISHED', paidAt: addCalendarMonths(expiresAt, -12), expiresAt } });
    const publicId = `cheetahinvite/${ownerId}/${due.id}/${randomUUID()}`;
    await prisma.event.update({ where: { id: due.id }, data: { imageUrl: `https://res.cloudinary.com/lifecycle-fixture/image/upload/v123/${publicId}.png` } });
    const token = randomUUID();
    await prisma.rsvpResponse.create({ data: { eventId: due.id, tokenHash: token, name: 'Fixture', attending: true } });
    await prisma.invitationLink.create({ data: { path: `/event/${ownerId}`, eventId: due.id } });
    await prisma.invitationAccessSession.create({ data: { eventId: due.id, tokenHash: token, version: 0, expiresAt: now } });
    await prisma.invitationPayment.create({ data: { eventId: due.id, ownerId, eventName: due.name, amount: 26900, currency: 'mxn', status: 'PAID', livemode: false, checkoutExpiresAt: expiresAt, paidAt: due.paidAt, expiresAt } });
    const draft = await prisma.event.create({ data: { ownerId, name: 'Draft fixture', eventType: 'other', expiresAt } });
    const example = await prisma.event.create({ data: { ownerId, name: 'Example fixture', eventType: 'other', isExample: true, status: 'PUBLISHED', paidAt: due.paidAt, expiresAt } });
    const oldExpiry = new Date(now.getTime() - DAY);
    const renewing = await prisma.event.create({ data: { ...f.eventDetails, privacy: 'PUBLIC', ownerId, name: 'Renewal fixture', status: 'ARCHIVED', paidAt: addCalendarMonths(oldExpiry, -12), expiresAt: oldExpiry, stripePaymentIntentId: `pi_previous_${randomUUID()}` } });
    const urls = await Promise.all([f.checkout.prepareInvitationCheckout(renewing.id, ownerId), f.checkout.prepareInvitationCheckout(renewing.id, ownerId)]);
    assert.equal(urls[0], urls[1]);
    const payment = await prisma.invitationPayment.findFirst({ where: { eventId: renewing.id } });
    assert.equal(payment.renewalOfPaymentIntentId, renewing.stripePaymentIntentId);
    const session = f.sessions.get(payment.stripeCheckoutSessionId);
    const intentId = `pi_${randomUUID()}`;
    Object.assign(session, { status: 'complete', payment_status: 'paid', payment_intent: intentId });
    f.intents.set(intentId, { id: intentId, livemode: false, status: 'succeeded', amount_received: payment.amount, currency: payment.currency,
      latest_charge: { id: `ch_${randomUUID()}`, created: Math.floor(now.getTime() / 1000), paid: true, captured: true, amount: payment.amount, currency: payment.currency, payment_intent: intentId } });
    await Promise.all([f.fulfillment.fulfillInvitationPayment(session), f.fulfillment.fulfillInvitationPayment(session)]);
    const renewed = await prisma.event.findUnique({ where: { id: renewing.id } });
    assert.equal(renewed.status, 'PUBLISHED'); assert.equal(renewed.stripePaymentIntentId, intentId);
    assert.equal(renewed.expiresAt.getTime(), addCalendarMonths(renewed.paidAt, 12).getTime());

    // Both passes are account-scoped. Never run global cleanup against real data.
    const results = await Promise.all([runInvitationLifecycle(now, 10, ownerId), runInvitationLifecycle(now, 10, ownerId)]);
    assert.equal(results.reduce((sum, result) => sum + result.deleted, 0), 1);
    assert.equal(results.reduce((sum, result) => sum + result.failed, 0), 0);
    assert.equal(await prisma.event.findUnique({ where: { id: due.id } }), null);
    assert.equal(await prisma.rsvpResponse.count({ where: { eventId: due.id } }), 0);
    assert.equal(await prisma.invitationLink.count({ where: { eventId: due.id } }), 0);
    assert.equal(await prisma.invitationAccessSession.count({ where: { eventId: due.id } }), 0);
    assert.equal((await prisma.cloudinaryAsset.findUnique({ where: { publicId } })).state, 'DELETE_PENDING');
    assert.equal((await prisma.user.findUnique({ where: { id: ownerId } })).invitationCount, 2);
    assert.equal(await prisma.invitationPayment.count({ where: { eventId: due.id } }), 1);
    for (const id of [draft.id, example.id, renewing.id]) assert.ok(await prisma.event.findUnique({ where: { id } }));
    console.log('PostgreSQL lifecycle checks passed: concurrent renewal and cleanup, cascade deletion, durable image queue and retained payment history. Stripe and Cloudinary were not contacted.');
  } finally {
    assert.ok(ownerId.startsWith('__lifecycle_test_'));
    await prisma.cloudinaryAsset.deleteMany({ where: { ownerId } });
    await prisma.invitationPayment.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error : `${error.name} ${error.code ?? ''}: ${error.message.trim().split('\n').at(-1)}`); process.exitCode = 1; });
