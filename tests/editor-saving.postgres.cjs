/* eslint-disable @typescript-eslint/no-require-imports -- Explicit real-database verification with isolated owned fixtures. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ownerId = `__editor_test_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { updateEvent, publishEvent } = require('../app/dashboard/eventos/[id]/actions.ts');
const { prepareEvent } = require('../app/crear/actions.ts');
let eventId;
function form(name, version = 0) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name, eventType: 'wedding', sections: '[]', contentVersion: String(version) })) data.set(key, value);
  return data;
}
(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, name: 'Editor integration fixture', invitationCount: 1 } });
    eventId = (await prisma.event.create({ data: { ownerId, name: 'Initial fixture', eventType: 'wedding' } })).id;
    const results = await Promise.all([updateEvent(eventId, form('First fixture')), updateEvent(eventId, form('Second fixture'))]);
    assert.equal(results.filter(result => result.ok).length, 1);
    assert.equal(results.find(result => !result.ok).code, 'conflict');
    assert.equal((await prisma.event.findUnique({ where: { id: eventId } })).contentVersion, 1);
    await prisma.event.update({ where: { id: eventId }, data: { paidAt: new Date(), status: 'PUBLISHED' } });
    assert.equal((await updateEvent(eventId, form('Auto should fail', 1), 'auto')).code, 'published');
    assert.equal((await updateEvent(eventId, form('Explicit fixture', 1))).version, 2);
    assert.equal((await publishEvent(eventId, 1)).code, 'conflict');
    const creation = form('Creation fixture'); creation.set('creationKey', randomUUID());
    const prepared = await Promise.all([prepareEvent(creation), prepareEvent(creation)]);
    assert.equal(prepared.every(result => result.ok), true);
    assert.equal(prepared[0].eventId, prepared[1].eventId);
    assert.equal((await prisma.user.findUnique({ where: { id: ownerId } })).invitationCount, 2);
    console.log('PostgreSQL editor integration passed: concurrent versions, publication safety and idempotent creation.');
  } finally {
    assert.ok(ownerId.startsWith('__editor_test_'));
    await prisma.cloudinaryAsset.deleteMany({ where: { ownerId } });
    await prisma.imageUploadBudget.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error : error.name); process.exitCode = 1; });
