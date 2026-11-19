/* eslint-disable @typescript-eslint/no-require-imports -- Real SQL checks scoped to a disposable account. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ownerId = `__draft_retention_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { Prisma } = require('../generated/prisma/client.ts');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');
const f = createPaymentFixture({ prisma, Prisma, ownerId });
const { runInvitationLifecycle } = f.load('lib/invitation-lifecycle-storage.ts');
const now = new Date('2027-02-28T12:00:00Z');
(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, invitationCount: 2 } });
    const draft = await prisma.event.create({ data: { ownerId, name: 'Abandoned draft', eventType: 'other', draftLastSavedAt: new Date('2026-08-31T12:00:00Z') } });
    const recent = await prisma.event.create({ data: { ownerId, name: 'Active draft', eventType: 'other', draftLastSavedAt: now } });
    const key = `cheetahinvite/${ownerId}/${draft.id}/${randomUUID()}`;
    const imageUrl = new URL(`/api/media/${key}`, process.env.APP_URL).href;
    await prisma.event.update({ where: { id: draft.id }, data: { imageUrl, status: 'PENDING_PAYMENT' } });
    // A status/image bookkeeping update must not move the inactivity clock.
    assert.equal((await prisma.event.findUnique({ where: { id: draft.id } })).draftLastSavedAt.toISOString(), '2026-08-31T12:00:00.000Z');
    await prisma.cloudinaryAsset.create({ data: { publicId: key, provider: 'R2', ownerId, eventId: draft.id, url: imageUrl, bytes: 100, state: 'READY' } });
    await prisma.invitationLink.create({ data: { path: `/event/${ownerId}`, eventId: draft.id } });
    await prisma.invitationAccessSession.create({ data: { tokenHash: randomUUID(), eventId: draft.id, version: 0, expiresAt: now } });
    await prisma.rsvpResponse.create({ data: { tokenHash: randomUUID(), eventId: draft.id, name: 'Fixture', attending: true } });
    const payment = await prisma.invitationPayment.create({ data: { ownerId, eventId: draft.id, eventName: draft.name, amount: 26900, currency: 'mxn', livemode: false, status: 'PENDING', checkoutExpiresAt: new Date(now.getTime() + 1000) } });
    assert.equal((await runInvitationLifecycle(now, 10, ownerId)).retained, 1);
    await prisma.invitationPayment.update({ where: { id: payment.id }, data: { checkoutExpiresAt: now } });
    const results = await Promise.all([runInvitationLifecycle(now, 10, ownerId), runInvitationLifecycle(now, 10, ownerId)]);
    assert.equal(results.reduce((n, result) => n + result.deleted, 0), 1);
    assert.equal(results.reduce((n, result) => n + result.failed, 0), 0);
    assert.equal(await prisma.event.findUnique({ where: { id: draft.id } }), null);
    assert.ok(await prisma.event.findUnique({ where: { id: recent.id } }));
    assert.equal(await prisma.rsvpResponse.count({ where: { eventId: draft.id } }), 0);
    assert.equal(await prisma.invitationAccessSession.count({ where: { eventId: draft.id } }), 0);
    assert.equal(await prisma.invitationLink.count({ where: { eventId: draft.id } }), 0);
    assert.equal((await prisma.cloudinaryAsset.findUnique({ where: { publicId: key } })).state, 'DELETE_PENDING');
    assert.equal((await prisma.invitationPayment.findUnique({ where: { id: payment.id } })).status, 'EXPIRED');
    assert.equal((await prisma.user.findUnique({ where: { id: ownerId } })).invitationCount, 1);
    console.log('Draft retention SQL checks passed: calendar deadline, pending payment retention, concurrent deletion, cascades, image queue and one released slot.');
  } finally {
    await prisma.cloudinaryAsset.deleteMany({ where: { ownerId } });
    await prisma.invitationPayment.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
