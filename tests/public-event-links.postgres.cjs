/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in database integration with disposable fixtures. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fixtureId = randomUUID();
const ownerId = `__public_links_test_${fixtureId}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { updateEvent, checkInvitationSlug } = require('../app/dashboard/eventos/[id]/actions.ts');
const { invitationLinkRegistryReady, reserveInvitationPath } = require('../lib/invitation-link-storage.ts');
const oldSlug = `link-test-${fixtureId}`;
const newSlug = `renamed-${fixtureId}`;
const takenSlug = `reserved-${fixtureId}`;

(async () => {
  try {
    assert.equal(await invitationLinkRegistryReady(prisma), true);
    await prisma.user.create({ data: { id: ownerId } });
    await prisma.user.create({ data: { id: `${ownerId}_other` } });
    const event = await prisma.event.create({ data: {
      ownerId, name: 'URL integration fixture', eventType: 'wedding', customSlug: oldSlug,
      slug: `fallback-${fixtureId}`, status: 'PUBLISHED', paidAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), sections: [],
    } });
    const other = await prisma.event.create({ data: { ownerId: `${ownerId}_other`, name: 'Other URL fixture', eventType: 'wedding' } });
    await prisma.invitationLink.createMany({ data: [
      { path: `/event/${oldSlug}`, eventId: event.id },
      { path: `/invitacion/${ownerId}/${oldSlug}`, eventId: event.id },
      { path: `/event/${takenSlug}`, eventId: other.id },
    ] });
    assert.equal((await checkInvitationSlug(event.id, newSlug)).available, true);
    assert.equal((await checkInvitationSlug(event.id, takenSlug)).available, false);
    const form = new FormData();
    for (const [key, value] of Object.entries({ name: event.name, eventType: event.eventType, sections: '[]', contentVersion: '0', customSlug: newSlug })) form.set(key, value);
    const saved = await updateEvent(event.id, form);
    assert.equal(saved.ok, true, JSON.stringify(saved));
    const stored = await prisma.event.findUnique({ where: { id: event.id } });
    assert.equal(stored.customSlug, newSlug);
    assert.equal(stored.contentVersion, 1);
    for (const path of [`/event/${oldSlug}`, `/event/${newSlug}`, `/invitacion/${ownerId}/${oldSlug}`]) {
      assert.equal((await prisma.invitationLink.findUnique({ where: { path } })).eventId, event.id);
    }
    form.set('contentVersion', '1'); form.set('customSlug', takenSlug);
    assert.equal((await updateEvent(event.id, form)).code, 'validation');
    assert.equal((await prisma.event.findUnique({ where: { id: event.id } })).customSlug, newSlug);
    const shared = `/event/concurrent-${fixtureId}`;
    const results = await Promise.all([event.id, other.id].map(eventId => prisma.$transaction(tx => reserveInvitationPath(tx, shared, eventId))));
    assert.equal(results.filter(Boolean).length, 1);
    console.log('PostgreSQL integration passed: manual save, global availability, alias preservation, duplicate rejection and simultaneous reservations.');
  } finally {
    assert.ok(ownerId.startsWith('__public_links_test_'));
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, `${ownerId}_other`] } } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
