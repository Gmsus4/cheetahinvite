/* eslint-disable @typescript-eslint/no-require-imports -- Exercise URL reservations and real server actions. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');

test('pending migration allows manual and automatic content saves with the current link', async () => {
  for (const mode of ['manual', 'auto']) {
    const f = createFixture();
    f.state.events.get('event').customSlug = 'emi';
    if (mode === 'manual') Object.assign(f.state.events.get('event'), { paidAt: new Date(), expiresAt: new Date(Date.now() + 365 * 86400000), status: 'PUBLISHED' });
    let inTransaction = false;
    const transaction = f.prisma.$transaction;
    f.prisma.$transaction = work => transaction(async tx => { inTransaction = true; try { return await work(tx); } finally { inTransaction = false; } });
    f.prisma.invitationLink.findUnique = async () => {
      assert.equal(inTransaction, false, 'missing-table checks must run before the PostgreSQL transaction');
      throw Object.assign(new Error('Missing table'), { code: 'P2021' });
    };
    f.prisma.invitationLink.createMany = async () => assert.fail('must not write to the absent table');
    const form = f.saveForm(); form.set('customSlug', 'emi'); form.set('message', 'Contenido actualizado');
    assert.equal((await f.actions.updateEvent('event', form, mode)).ok, true);
    assert.equal(f.state.events.get('event').message, 'Contenido actualizado');
    assert.equal(f.state.events.get('event').customSlug, 'emi');
  }
});

test('pending migration lets an invitation without a custom link save and prevents unsupported renames', async () => {
  const f = createFixture();
  f.state.events.get('event').paidAt = new Date();
  f.state.events.get('event').expiresAt = new Date(Date.now() + 365 * 86400000);
  f.prisma.invitationLink.findUnique = async () => { throw Object.assign(new Error('Missing table'), { code: 'P2021' }); };
  const form = f.saveForm(); form.set('customSlug', '');
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  form.set('contentVersion', '1'); form.set('customSlug', 'nuevo-enlace');
  const before = structuredClone(f.state.events.get('event'));
  const result = await f.actions.updateEvent('event', form);
  assert.equal(result.code, 'validation');
  assert.match(result.message, /Conserva tu enlace actual/);
  assert.deepEqual(f.state.events.get('event'), before);
  assert.deepEqual(await f.actions.checkInvitationSlug('event', 'nuevo-enlace'), { available: false, migrationPending: true });
});

test('payment still settles with the legacy link while the link migration is pending', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  f.events.get('event-fixture').customSlug = 'emi';
  f.prisma.invitationLink.findUnique = async () => { throw Object.assign(new Error('Missing table'), { code: 'P2021' }); };
  f.prisma.invitationLink.createMany = async () => assert.fail('must not write to the absent table');
  const result = await f.fulfillment.fulfillInvitationPayment(session);
  assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
  assert.equal(result.invitation.path, `/invitacion/${f.ownerId}/emi`);
});

test('payment reserves custom and fallback URLs and avoids another event’s name', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  const event = f.events.get('event-fixture'); event.customSlug = 'cumple-de-emi';
  const { invitationSlug } = f.load('lib/stripe-payment.ts');
  const fallback = invitationSlug(event.name, event.id);
  f.links.set(`/event/${fallback}`, { path: `/event/${fallback}`, eventId: 'other' });
  const result = await f.fulfillment.fulfillInvitationPayment(session);
  assert.equal(result.invitation.path, '/event/cumple-de-emi');
  assert.equal(result.invitation.slug, `${fallback}-2`);
  assert.equal(f.links.get(`/event/${fallback}`).eventId, 'other');
  assert.equal(f.links.get(`/event/${fallback}-2`).eventId, event.id);
  assert.equal(f.links.get('/event/cumple-de-emi').eventId, event.id);
});

test('payment cannot publish under another invitation’s reserved custom name', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  f.events.get('event-fixture').customSlug = 'emi';
  f.links.set('/event/emi', { path: '/event/emi', eventId: 'other' });
  await assert.rejects(f.fulfillment.fulfillInvitationPayment(session), /already reserved/);
  assert.equal(f.events.get('event-fixture').paidAt, null);
  assert.equal(f.links.size, 1);
});

test('global names reject another account, suggest an alternative and preserve historical names', async () => {
  const f = createFixture();
  f.state.events.get('event').paidAt = new Date();
  f.state.events.get('event').expiresAt = new Date(Date.now() + 365 * 86400000);
  f.state.links.set('/event/emi', { path: '/event/emi', eventId: 'other-event' });
  const availability = await f.actions.checkInvitationSlug('event', 'Emí');
  assert.deepEqual(availability, { available: false, suggestion: 'emi-2' });
  const form = f.saveForm(); form.set('customSlug', 'Emí');
  assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
  form.set('customSlug', 'Emí 2');
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  assert.equal(f.state.events.get('event').customSlug, 'emi-2');
  form.set('contentVersion', '1'); form.set('customSlug', 'fiesta-de-emi');
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  assert.equal(f.state.links.get('/event/emi-2').eventId, 'event');
  assert.equal(f.state.links.get('/event/fiesta-de-emi').eventId, 'event');
  assert.equal((await f.actions.checkInvitationSlug('event', 'emi-2')).available, true);
});

test('custom links require confirmed payment, including forged manual and automatic saves', async () => {
  for (const status of ['DRAFT', 'PENDING_PAYMENT', 'PUBLISHED']) {
    const f = createFixture();
    f.state.events.get('event').status = status;
    assert.deepEqual(await f.actions.checkInvitationSlug('event', 'emi'), { available: false, paymentRequired: true });
    for (const mode of status === 'PUBLISHED' ? ['manual'] : ['manual', 'auto']) {
      const before = structuredClone(f.state.events.get('event'));
      const form = f.saveForm(); form.set('customSlug', 'emi');
      const result = await f.actions.updateEvent('event', form, mode);
      assert.equal(result.code, 'validation');
      assert.match(result.message, /confirme el pago/);
      assert.deepEqual(f.state.events.get('event'), before);
      assert.equal(f.state.links.size, 0);
    }
    // Ordinary content saves stay available before payment.
    assert.equal((await f.actions.updateEvent('event', f.saveForm())).ok, true);
    f.state.events.get('event').paidAt = new Date();
    f.state.events.get('event').expiresAt = new Date(Date.now() + 365 * 86400000);
    assert.equal((await f.actions.checkInvitationSlug('event', 'emi')).available, true);
    const paidForm = f.saveForm(); paidForm.set('customSlug', 'emi');
    assert.equal((await f.actions.updateEvent('event', paidForm)).ok, true);
    assert.equal(f.state.events.get('event').customSlug, 'emi');
    assert.equal(f.state.links.get('/event/emi').eventId, 'event');
  }
});

test('simultaneous claims from different owners have one winner', async () => {
  const f = createFixture();
  const { reserveInvitationPath } = f.load('lib/invitation-link-storage.ts');
  const results = await Promise.all(['first', 'second'].map(eventId => f.prisma.$transaction(tx => reserveInvitationPath(tx, '/event/emi', eventId))));
  assert.deepEqual(results, [true, false]);
  assert.equal(f.state.links.get('/event/emi').eventId, 'first');
});

test('new URLs and old aliases resolve the same published invitation and enforce access', async () => {
  const f = createFixture();
  const { getPublicInvitation } = f.load('lib/public-invitation.ts');
  Object.assign(f.state.events.get('event'), { customSlug: 'emi-2', slug: 'legacy-token', status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000) });
  for (const path of ['/event/emi', '/event/emi-2', '/invitacion/owner/emi', '/invitacion/legacy-token']) f.state.links.set(path, { path, eventId: 'event' });
  assert.equal((await getPublicInvitation('emi', undefined, true)).id, 'event');
  assert.equal((await getPublicInvitation('owner', 'emi')).customSlug, 'emi-2');
  assert.equal((await getPublicInvitation('legacy-token')).id, 'event');
  assert.equal(await getPublicInvitation('unknown', undefined, true), null);
  for (const change of [{ status: 'DRAFT' }, { status: 'SUSPENDED' }, { paidAt: null }, { expiresAt: new Date(0) }]) {
    const event = f.state.events.get('event'); const previous = { ...event }; Object.assign(event, change);
    assert.equal(await getPublicInvitation('emi', undefined, true), null);
    assert.equal(await getPublicInvitation('owner', 'emi'), null);
    Object.assign(event, previous);
  }
});

test('failed saves roll back reservations and availability requires event ownership', async () => {
  const f = createFixture();
  const form = f.saveForm(); form.set('customSlug', 'nuevo-nombre'); form.set('contentVersion', '9');
  assert.equal((await f.actions.updateEvent('event', form)).code, 'conflict');
  assert.equal(f.state.links.size, 0);
  f.owner = 'other';
  assert.equal((await f.actions.checkInvitationSlug('event', 'nuevo-nombre')).available, false);
});

test('pending migration keeps old links readable and never resolves duplicate global names arbitrarily', async () => {
  const f = createFixture();
  f.prisma.invitationLink.findUnique = async () => { throw Object.assign(new Error('Missing table'), { code: 'P2021' }); };
  const { getPublicInvitation } = f.load('lib/public-invitation.ts');
  const event = f.state.events.get('event');
  Object.assign(event, { customSlug: 'emi', slug: 'legacy', status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000) });
  assert.equal((await getPublicInvitation('owner', 'emi')).id, 'event');
  assert.equal((await getPublicInvitation('legacy')).id, 'event');
  assert.equal((await getPublicInvitation('emi', undefined, true)).id, 'event');
  f.state.events.set('other', { ...event, id: 'other', ownerId: 'another-owner', slug: 'other-legacy' });
  assert.equal(await getPublicInvitation('emi', undefined, true), null);
  assert.equal((await getPublicInvitation('owner', 'emi')).id, 'event');
  f.prisma.invitationLink.findUnique = async () => { throw Object.assign(new Error('Database unreachable'), { code: 'P1001' }); };
  await assert.rejects(getPublicInvitation('owner', 'emi'), /Database unreachable/);
});
