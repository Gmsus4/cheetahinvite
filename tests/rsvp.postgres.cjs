/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in verification against PostgreSQL with isolated, disposable fixtures. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ownerId = `__rsvp_test_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { Prisma } = require('../generated/prisma/client.ts');
const { createRsvpFixture } = require('./helpers/rsvp-fixture.cjs');
const { updateEvent, deleteEvent } = require('../app/dashboard/eventos/[id]/actions.ts');
let eventId;
const section = { id: 'confirmation', type: 'rsvp', title: 'Confirma tu asistencia', enabled: true, rsvpMode: 'integrated', content: '', detail: '', link: '', imageUrl: '' };
function form(enabled, version) { const data = new FormData(); for (const [key, value] of Object.entries({ name: 'RSVP fixture', eventType: 'wedding', sections: JSON.stringify([{ ...section, enabled }]), contentVersion: String(version) })) data.set(key, value); return data; }
(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, name: 'RSVP integration fixture', invitationCount: 1 } });
    eventId = (await prisma.event.create({ data: { ownerId, name: 'RSVP fixture', eventType: 'wedding', status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000), slug: `rsvp-${randomUUID()}`, sections: [section] } })).id;
    const f = createRsvpFixture({ prisma, Prisma, ownerId, eventId });
    const responses = await Promise.all([f.submit(), f.submit()]); assert.equal(responses.every(r => r.status === 200), true);
    assert.equal(await prisma.rsvpResponse.count({ where: { eventId } }), 1);
    await f.submit({ ...f.values, attending: false, companions: 0 });
    assert.deepEqual((await (await f.read()).json()).response, { name: f.values.name, attending: false, companions: 0 });
    await assert.rejects(prisma.rsvpResponse.create({ data: { eventId, tokenHash: randomUUID(), name: 'Invalid fixture', attending: false, companions: 6 } }));
    assert.equal(await prisma.rsvpResponse.count({ where: { eventId } }), 1);
    const before = await prisma.rsvpSubmissionBudget.findMany({ where: { eventId }, orderBy: { key: 'asc' } });
    const failingPrisma = { ...prisma, $transaction: (work, opts) => prisma.$transaction(tx => work(new Proxy(tx, { get(target, key) {
      if (key === 'rsvpResponse') return { findUnique: target.rsvpResponse.findUnique.bind(target.rsvpResponse), count: target.rsvpResponse.count.bind(target.rsvpResponse), upsert: async () => { throw Error('Fixture write failure'); } };
      return Reflect.get(target, key);
    } })), opts) };
    const failure = createRsvpFixture({ prisma: failingPrisma, Prisma, ownerId, eventId });
    assert.equal((await failure.submit()).status, 503);
    assert.deepEqual(await prisma.rsvpSubmissionBudget.findMany({ where: { eventId }, orderBy: { key: 'asc' } }), before);
    assert.equal((await updateEvent(eventId, form(false, 0))).ok, true);
    assert.equal((await f.submit()).status, 404);
    assert.equal((await updateEvent(eventId, form(true, 1))).ok, true);
    const hour = Math.floor(Date.now() / 3600000);
    await prisma.rsvpSubmissionBudget.update({ where: { key: `${eventId}:event:${hour}` }, data: { count: 499 } });
    const last = await Promise.all([f.submit({ ...f.values, token: 'b'.repeat(64) }), f.submit({ ...f.values, token: 'c'.repeat(64) })]);
    assert.deepEqual(last.map(r => r.status).sort(), [200, 429]);
    assert.equal(await prisma.rsvpResponse.count({ where: { eventId } }), 2);
    const csv = await f.csv(); assert.equal(csv.status, 200); assert.match(await csv.text(), /Ana Pérez/);
    f.ownerId = 'not-the-owner'; assert.equal((await f.csv()).status, 404);
    assert.equal((await deleteEvent(eventId)).error, null);
    assert.equal(await prisma.rsvpResponse.count({ where: { eventId } }), 0);
    assert.equal(await prisma.rsvpSubmissionBudget.count({ where: { eventId } }), 0);
    console.log('PostgreSQL RSVP integration passed: concurrent idempotent replies, decline updates, database constraints, rollback, editor opt-out, rate limits, owner CSV and cascading deletion.');
  } finally {
    assert.ok(ownerId.startsWith('__rsvp_test_'));
    await prisma.cloudinaryAsset.deleteMany({ where: { ownerId } });
    await prisma.imageUploadBudget.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error : `${error.name} ${error.code ?? ''}: ${error.message.trim().split('\n').at(-1)}`); process.exitCode = 1; });
