/* eslint-disable @typescript-eslint/no-require-imports -- Disposable account, real transactions and cascades. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ownerId = `__reuse_test_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { Prisma } = require('../generated/prisma/client.ts');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');
const f = createPaymentFixture({ prisma, Prisma, ownerId });
const { reuseRefundedInvitation } = f.load('lib/refunded-invitation.ts');
(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, invitationCount: 3 } });
    const event = await prisma.event.create({ data: { ownerId, name: 'Refunded fixture', eventType: 'wedding', status: 'REFUNDED', paidAt: new Date(), expiresAt: new Date('2099-01-01'), privacy: 'PRIVATE', pinHash: 'fixture-pin', slug: randomUUID(), customSlug: randomUUID(), stripePaymentIntentId: `pi_${randomUUID()}`, accent: '#123456' } });
    const other = await Promise.all([1, 2].map(n => prisma.event.create({ data: { ownerId, name: `Paid ${n}`, eventType: 'other', status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date('2099-01-01') } })));
    const publicId = `cheetahinvite/${ownerId}/${event.id}/${randomUUID()}`;
    const url = new URL(`/api/media/${publicId}`, process.env.APP_URL).href;
    await prisma.event.update({ where: { id: event.id }, data: { imageUrl: url } });
    await prisma.cloudinaryAsset.create({ data: { publicId, provider: 'R2', ownerId, eventId: event.id, url, state: 'READY', bytes: 100 } });
    const token = randomUUID();
    await prisma.rsvpResponse.create({ data: { eventId: event.id, tokenHash: token, name: 'Guest', attending: true } });
    await prisma.invitationLink.create({ data: { eventId: event.id, path: `/event/${event.slug}` } });
    await prisma.invitationAccessSession.create({ data: { eventId: event.id, tokenHash: token, version: 0, expiresAt: event.expiresAt } });
    const purchase = await prisma.invitationPayment.create({ data: { ownerId, eventId: event.id, eventName: event.name, amount: 26900, refundedAmount: 26900, currency: 'mxn', livemode: false, checkoutExpiresAt: new Date(), status: 'PAID' } });
    const ids = await Promise.all([reuseRefundedInvitation(ownerId, event.id), reuseRefundedInvitation(ownerId, event.id)]);
    assert.equal(ids[0], ids[1]);
    assert.equal(await reuseRefundedInvitation(ownerId, event.id), ids[0]);
    const replacement = await prisma.event.findUnique({ where: { id: ids[0] } });
    assert.equal(replacement.status, 'DRAFT'); assert.equal(replacement.privacy, 'UNSET');
    assert.equal(replacement.accent, '#123456'); assert.equal(replacement.imageUrl, url);
    for (const key of ['paidAt', 'expiresAt', 'stripePaymentIntentId', 'stripeCheckoutSessionId', 'slug', 'customSlug', 'pinHash', 'complimentaryAt']) assert.equal(replacement[key], null);
    assert.equal(await prisma.event.count({ where: { ownerId } }), 3);
    assert.equal((await prisma.user.findUnique({ where: { id: ownerId } })).invitationCount, 3);
    assert.equal(await prisma.event.findUnique({ where: { id: event.id } }), null);
    for (const row of other) assert.equal((await prisma.event.findUnique({ where: { id: row.id } })).status, 'PUBLISHED');
    for (const table of ['rsvpResponse', 'invitationLink', 'invitationAccessSession']) assert.equal(await prisma[table].count({ where: { eventId: event.id } }), 0);
    assert.equal((await prisma.invitationPayment.findUnique({ where: { id: purchase.id } })).eventId, event.id);
    const asset = await prisma.cloudinaryAsset.findUnique({ where: { publicId } });
    assert.equal(asset.eventId, replacement.id); assert.equal(asset.state, 'READY');
    // A normal save recognizes transferred images whose key contains the original ID.
    await f.load('lib/image-storage.ts').syncImages(prisma, ownerId, replacement.id, replacement, replacement);
    assert.equal((await prisma.cloudinaryAsset.findUnique({ where: { publicId } })).state, 'READY');
    console.log('Refunded reuse SQL passed: full account, concurrent retries, cascades, new identity, retained purchase and transferred images.');
  } finally {
    await prisma.cloudinaryAsset.deleteMany({ where: { ownerId } });
    await prisma.invitationPayment.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
