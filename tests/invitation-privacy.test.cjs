/* eslint-disable @typescript-eslint/no-require-imports -- Exercise privacy authorization, PINs and sessions with isolated server state. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');

async function setup() {
  const f = createFixture();
  Object.assign(f.state.events.get('event'), { status: 'PUBLISHED', paidAt: new Date(), slug: 'legacy', customSlug: 'fiesta', expiresAt: new Date(Date.now() + 86400000), name: 'SECRET NAME', address: 'SECRET ADDRESS', message: 'SECRET MESSAGE', imageUrl: 'https://example.com/secret-photo.jpg' });
  f.state.links.set('/event/fiesta', { path: '/event/fiesta', eventId: 'event' });
  f.state.links.set('/invitacion/owner/old', { path: '/invitacion/owner/old', eventId: 'event' });
  f.privacy = f.load('app/dashboard/eventos/[id]/ajustes/actions.ts');
  f.pin = f.load('lib/invitation-pin.ts');
  f.access = f.load('lib/invitation-access.ts');
  f.unlock = f.load('lib/invitation-privacy-storage.ts');
  assert.equal((await f.privacy.saveInvitationPrivacy('event', 'PRIVATE', '001234', 0)).ok, true);
  return f;
}

test('PIN storage is salted, preserves leading zeros and never stores the PIN itself', async () => {
  const f = createFixture(); const pin = f.load('lib/invitation-pin.ts');
  const first = await pin.hashInvitationPin('001234'); const second = await pin.hashInvitationPin('001234');
  assert.notEqual(first, second); assert.equal(first.includes('001234'), false);
  assert.equal(await pin.verifyInvitationPin('001234', first), true);
  for (const value of ['001235', '1234', '1234567', 'abcdef']) assert.equal(await pin.verifyInvitationPin(value, first), false);
  assert.equal(await pin.verifyInvitationPin('001234', 'invalid'), false);
});

test('settings require ownership, valid privacy, PIN and current revision', async () => {
  const f = await setup();
  const before = structuredClone(f.state.events.get('event'));
  f.owner = 'someone-else';
  assert.equal((await f.privacy.saveInvitationPrivacy('event', 'PUBLIC', '', 1)).ok, false);
  f.owner = null; assert.equal((await f.privacy.saveInvitationPrivacy('event', 'PUBLIC', '', 1)).ok, false);
  f.owner = 'owner';
  for (const args of [['OTHER', '', 1], ['PRIVATE', '123', 1], ['PUBLIC', '', 0]]) assert.equal((await f.privacy.saveInvitationPrivacy('event', ...args)).ok, false);
  assert.deepEqual(f.state.events.get('event'), before);
});

test('wrong PINs count persistently, trigger throttling, and do not create sessions', async () => {
  const f = await setup();
  for (let i = 0; i < 20; i++) assert.equal((await f.unlock.unlockPrivateInvitation('event', '000000', 'visitor')).status, 401);
  assert.equal(f.state.accessSessions.size, 0);
  assert.equal((await f.unlock.unlockPrivateInvitation('event', '001234', 'visitor')).status, 429);
  assert.equal((await f.unlock.unlockPrivateInvitation('event', '001234', 'other-visitor')).status, 200);
  assert.equal(f.state.pinBudgets.size, 3);
});

test('sessions are scoped, expire, and are revoked immediately when the PIN or privacy changes', async () => {
  const f = await setup(); const event = f.state.events.get('event');
  assert.equal(await f.access.canAccessInvitation(event), false);
  const unlocked = await f.unlock.unlockPrivateInvitation('event', '001234', 'visitor');
  assert.equal(unlocked.status, 200);
  f.cookies.set(f.pin.accessCookieName('event'), unlocked.token);
  assert.equal(await f.access.canAccessInvitation(event), true);
  const stored = [...f.state.accessSessions.values()][0]; assert.notEqual(stored.tokenHash, unlocked.token);
  f.cookies.set(f.pin.accessCookieName('other'), unlocked.token);
  assert.equal(await f.access.canAccessInvitation({ ...event, id: 'other' }), false);
  stored.expiresAt = new Date(0); assert.equal(await f.access.canAccessInvitation(event), false);
  stored.expiresAt = new Date(Date.now() + 10000);
  assert.equal((await f.privacy.saveInvitationPrivacy('event', 'PRIVATE', '987654', 1)).ok, true);
  assert.equal(await f.access.canAccessInvitation(event), false); assert.equal(f.state.accessSessions.size, 0);
  assert.equal((await f.unlock.unlockPrivateInvitation('event', '001234', 'visitor')).status, 401);
  assert.equal((await f.privacy.saveInvitationPrivacy('event', 'PUBLIC', '', 2)).ok, true);
  assert.equal(await f.access.canAccessInvitation(event), true); assert.equal(event.pinHash, null);
  assert.equal((await f.privacy.saveInvitationPrivacy('event', 'PRIVATE', '', 3)).ok, false);
});

test('locked invitations and share metadata contain no personal content, including old aliases', async () => {
  const f = await setup(); const { getPublicInvitation } = f.load('lib/public-invitation.ts');
  const { invitationMetadata } = f.load('lib/invitation-metadata.ts');
  for (const args of [['fiesta', undefined, true], ['owner', 'old']]) {
    const event = await getPublicInvitation(...args);
    for (const value of ['SECRET NAME', 'SECRET ADDRESS', 'SECRET MESSAGE', 'secret-photo.jpg']) assert.equal(JSON.stringify(event).includes(value), false);
    assert.equal(event.pinHash, undefined); assert.deepEqual(event.sections, []);
  }
  const metadata = invitationMetadata(f.state.events.get('event'), 'https://example.com');
  assert.equal(metadata.robots.index, false);
  assert.doesNotMatch(JSON.stringify(metadata), /SECRET|secret-photo/);
  const unlocked = await f.unlock.unlockPrivateInvitation('event', '001234', 'visitor');
  f.cookies.set(f.pin.accessCookieName('event'), unlocked.token);
  assert.equal((await getPublicInvitation('fiesta', undefined, true)).name, 'SECRET NAME');
});

test('RSVP storage requires the PIN session for reads and writes', async () => {
  const f = await setup(); const event = f.state.events.get('event');
  event.sections = [{ id: 'rsvp', type: 'rsvp', enabled: true, rsvpMode: 'integrated' }];
  const { readRsvp, saveRsvp } = f.load('lib/rsvp-storage.ts');
  await assert.rejects(readRsvp('event', 'a'.repeat(64)), error => error.status === 403);
  await assert.rejects(saveRsvp('event', { token: 'a'.repeat(64), name: 'Guest', attending: true, companions: 0 }), error => error.status === 403);
  const unlocked = await f.unlock.unlockPrivateInvitation('event', '001234', 'visitor');
  f.cookies.set(f.pin.accessCookieName('event'), unlocked.token);
  f.prisma.rsvpResponse = { findUnique: async () => null };
  assert.equal(await readRsvp('event', 'a'.repeat(64)), null);
});

test('unlock route validates origin, bounded bodies and PIN format before setting an access cookie', async () => {
  const f = await setup(); const { POST } = f.load('app/api/invitations/[id]/unlock/route.ts');
  const send = (body, origin = 'http://localhost:3000') => POST(new Request('http://localhost:3000/api/invitations/event/unlock', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body }), { params: Promise.resolve({ id: 'event' }) });
  assert.equal((await send('{"pin":"001234"}', 'https://elsewhere.example')).status, 403);
  assert.equal((await send('{"pin":"123"}')).status, 400);
  assert.equal((await send('x'.repeat(1025))).status, 413);
  assert.equal(f.state.pinBudgets.size, 0);
  assert.equal((await send('{"pin":"001234"}')).status, 200);
  assert.match(f.cookies.get(f.pin.accessCookieName('event')), /^[a-f0-9]{64}$/);
  assert.equal(await f.access.canAccessInvitation(f.state.events.get('event')), true);
});

test('new invitations need an explicit privacy choice before publication', async () => {
  const f = createFixture(); f.state.events.get('event').privacy = 'UNSET';
  const result = await f.actions.publishEvent('event', 0);
  assert.equal(result.code, 'validation'); assert.match(result.message, /pública o protegida/);
});

test('checkout cannot bypass the required privacy choice', async () => {
  const f = createPaymentFixture(); f.addPurchase();
  f.events.get('event-fixture').privacy = 'UNSET';
  await assert.rejects(f.checkout.prepareInvitationCheckout('event-fixture', f.ownerId), /Complete the invitation/);
  assert.equal(f.calls.length, 0);
});
