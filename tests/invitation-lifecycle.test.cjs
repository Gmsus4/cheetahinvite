/* eslint-disable @typescript-eslint/no-require-imports -- Exercise lifecycle boundaries, real actions and cleanup with isolated services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');
const DAY = 86400000;

function purchased(f, overrides = {}) {
  const event = f.state.events.get('event');
  Object.assign(event, { paidAt: new Date('2025-11-09T12:00:00Z'), expiresAt: new Date('2026-11-09T12:00:00Z'), status: 'PUBLISHED', stripePaymentIntentId: 'pi_original', ...overrides });
  return event;
}

test('calendar terms handle leap years and short months without overflow', () => {
  const { addCalendarMonths } = createFixture().load('lib/invitation-lifecycle.ts');
  for (const [from, months, to] of [
    ['2024-02-29T18:45:17.123Z', 12, '2025-02-28T18:45:17.123Z'],
    ['2026-01-31T18:45:00Z', 1, '2026-02-28T18:45:00.000Z'],
    ['2027-01-31T18:45:00Z', 1, '2027-02-28T18:45:00.000Z'],
    ['2026-12-31T18:45:00Z', 1, '2027-01-31T18:45:00.000Z'],
  ]) assert.equal(addCalendarMonths(new Date(from), months).toISOString(), to);
});

test('counter and access change at the exact expiry and calendar archive deadline', () => {
  const f = createFixture(), event = purchased(f);
  const { invitationLifecycle, canRenewInvitation, canEditInvitation } = f.load('lib/invitation-lifecycle.ts');
  const start = invitationLifecycle(event, event.paidAt);
  assert.equal(start.elapsedDays, 0); assert.equal(start.remainingDays, 365);
  const active = invitationLifecycle(event, new Date(event.paidAt.getTime() + 42 * DAY));
  assert.equal(active.elapsedDays, 42); assert.equal(active.remainingDays, 323);
  assert.equal(canEditInvitation(event, new Date(event.expiresAt.getTime() - 1)), true);
  const archive = invitationLifecycle(event, event.expiresAt);
  assert.equal(archive.phase, 'archived'); assert.equal(archive.elapsedDays, 365); assert.equal(archive.remainingDays, 0);
  assert.equal(archive.deletesAt.toISOString(), '2026-12-09T12:00:00.000Z');
  assert.equal(canEditInvitation(event, event.expiresAt), false);
  assert.equal(canRenewInvitation(event, event.expiresAt), true);
  assert.equal(canRenewInvitation(event, archive.deletesAt), false);
  assert.equal(invitationLifecycle(event, archive.deletesAt).phase, 'deletion_due');
  for (const status of ['SUSPENDED', 'REFUNDED']) assert.equal(canRenewInvitation({ ...event, status }, event.expiresAt), false);
  assert.equal(invitationLifecycle({ ...event, paidAt: null }, event.expiresAt), null);
  assert.equal(invitationLifecycle({ ...event, isExample: true }, event.expiresAt), null);
});

test('archived content rejects forged saves, privacy changes and image uploads', async () => {
  const f = createFixture(); purchased(f, { expiresAt: new Date(Date.now() - DAY) });
  const before = structuredClone(f.state.events.get('event'));
  assert.equal((await f.actions.updateEvent('event', f.saveForm())).ok, false);
  const privacy = f.load('app/dashboard/eventos/[id]/ajustes/actions.ts');
  assert.equal((await privacy.saveInvitationPrivacy('event', 'PUBLIC', '', 0)).ok, false);
  await assert.rejects(f.storage.reserveCloudinaryImage('owner', 'event'), /edición está desactivada/);
  assert.deepEqual(f.state.events.get('event'), before);
});

test('scheduler archives without deleting, then deletes content, queues photos and frees a slot once', async () => {
  process.env.CLOUDINARY_CLOUD_NAME = 'test';
  const f = createFixture(); const event = purchased(f);
  const publicId = 'cheetahinvite/owner/event/00000000-0000-4000-8000-000000000000';
  event.imageUrl = f.url(publicId);
  f.state.payments.set('purchase', { id: 'purchase', eventId: 'event', ownerId: 'owner', status: 'PAID' });
  const { runInvitationLifecycle } = f.load('lib/invitation-lifecycle-storage.ts');
  const atExpiry = await runInvitationLifecycle(new Date('2026-11-09T12:00:00Z'));
  assert.equal(atExpiry.archived, 1); assert.equal(atExpiry.deleted, 0);
  assert.equal(f.state.events.get('event').status, 'ARCHIVED');
  assert.equal((await runInvitationLifecycle(new Date('2026-12-09T11:59:59Z'))).deleted, 0);
  const due = await runInvitationLifecycle(new Date('2026-12-09T12:00:00Z'));
  assert.equal(due.deleted, 1); assert.equal(f.state.events.size, 0);
  assert.equal(f.state.assets.get(publicId).state, 'DELETE_PENDING');
  assert.equal(f.state.users.get('owner').invitationCount, 0);
  assert.equal(f.state.payments.has('purchase'), true);
  assert.equal((await runInvitationLifecycle(new Date('2026-12-10T12:00:00Z'))).deleted, 0);
  assert.equal(f.state.users.get('owner').invitationCount, 0);
});

test('cleanup excludes unpaid drafts and examples and retains ambiguous payments on failures', async () => {
  for (const overrides of [{ paidAt: null }, { isExample: true }]) {
    const f = createFixture(); purchased(f, overrides);
    const result = await f.load('lib/invitation-lifecycle-storage.ts').runInvitationLifecycle(new Date('2027-01-01'));
    assert.equal(result.deleted, 0); assert.equal(f.state.events.size, 1);
  }
  const f = createFixture(); purchased(f);
  f.state.payments.set('renewal', { id: 'renewal', eventId: 'event', ownerId: 'owner', status: 'PENDING', stripeCheckoutSessionId: 'cs_pending' });
  f.load('lib/payment-fulfillment.ts').reconcileInvitationPayment = async () => { throw Error('Provider unavailable'); };
  const result = await f.load('lib/invitation-lifecycle-storage.ts').runInvitationLifecycle(new Date('2027-01-01'));
  assert.equal(result.failed, 1); assert.equal(f.state.events.size, 1); assert.equal(f.state.users.get('owner').invitationCount, 1);
});

test('cleanup rechecks the locked event after recovering a delayed successful renewal', async () => {
  const f = createFixture(); purchased(f);
  f.state.payments.set('renewal', { id: 'renewal', eventId: 'event', ownerId: 'owner', status: 'PENDING', stripeCheckoutSessionId: 'cs_pending' });
  f.load('lib/payment-fulfillment.ts').reconcileInvitationPayment = async () => {
    f.state.payments.get('renewal').status = 'PAID';
    Object.assign(f.state.events.get('event'), { status: 'PUBLISHED', paidAt: new Date('2026-12-01'), expiresAt: new Date('2027-12-01') });
  };
  const result = await f.load('lib/invitation-lifecycle-storage.ts').runInvitationLifecycle(new Date('2026-12-10'));
  assert.equal(result.deleted, 0); assert.equal(result.retained, 1);
  assert.equal(f.state.events.get('event').status, 'PUBLISHED');
});

test('renewal checkout is reserved once, keeps archive state and ends before the deletion deadline', async () => {
  const f = createPaymentFixture();
  const expiresAt = new Date(Date.now() - DAY);
  f.events.set('event', { ...f.eventDetails, id: 'event', ownerId: f.ownerId, name: 'Celebración', paidAt: new Date(expiresAt.getTime() - 365 * DAY), expiresAt, status: 'ARCHIVED', stripePaymentIntentId: 'pi_original' });
  const urls = await Promise.all([f.checkout.prepareInvitationCheckout('event', f.ownerId), f.checkout.prepareInvitationCheckout('event', f.ownerId)]);
  assert.equal(urls[0], urls[1]); assert.equal(f.payments.size, 1);
  const payment = [...f.payments.values()][0];
  assert.equal(payment.renewalOfPaymentIntentId, 'pi_original');
  assert.equal(f.events.get('event').status, 'ARCHIVED');
  assert.ok(payment.checkoutExpiresAt <= f.load('lib/invitation-lifecycle.ts').addCalendarMonths(expiresAt, 1));
  f.events.get('event').expiresAt = new Date(Date.now() - 70 * DAY);
  assert.equal(await f.checkout.prepareInvitationCheckout('event', f.ownerId), null);
});

test('confirmed renewal restores the same invitation for one year; repeated and old webhooks cannot overwrite it', async () => {
  const f = createPaymentFixture(); const original = f.addPurchase();
  await f.fulfillment.fulfillInvitationPayment(original.session);
  const event = f.events.get('event-fixture'); const oldIntent = event.stripePaymentIntentId;
  Object.assign(event, { paidAt: new Date(Date.now() - 366 * DAY), expiresAt: new Date(Date.now() - DAY), status: 'ARCHIVED' });
  const snapshot = structuredClone(event);
  const renewal = f.addPurchase({ id: 'renewal', stripeCheckoutSessionId: 'cs_renewal', renewalOfPaymentIntentId: oldIntent });
  f.events.set(event.id, snapshot);
  renewal.session.payment_intent = 'pi_renewal'; f.sessions.set('cs_renewal', renewal.session);
  f.intents.set('pi_renewal', { ...f.intents.get('pi_fixture'), id: 'pi_renewal', latest_charge: { ...f.intents.get('pi_fixture').latest_charge, id: 'ch_renewal', payment_intent: 'pi_renewal' } });
  await f.fulfillment.fulfillInvitationPayment(renewal.session);
  const renewed = structuredClone(f.events.get(event.id));
  assert.equal(renewed.status, 'PUBLISHED'); assert.equal(renewed.stripePaymentIntentId, 'pi_renewal');
  assert.equal(renewed.slug, snapshot.slug);
  assert.equal(renewed.expiresAt.toISOString(), f.load('lib/invitation-lifecycle.ts').addCalendarMonths(renewed.paidAt, 12).toISOString());
  await f.fulfillment.fulfillInvitationPayment(renewal.session);
  assert.deepEqual(f.events.get(event.id), renewed);
  f.refunds = [{ id: 're_old', amount: 49900, status: 'succeeded' }];
  await f.fulfillment.fulfillInvitationPayment(original.session);
  assert.deepEqual(f.events.get(event.id), renewed);
  await f.fulfillment.fulfillInvitationPayment(renewal.session);
  assert.equal(f.events.get(event.id).status, 'REFUNDED');
});
