/* eslint-disable @typescript-eslint/no-require-imports -- Exercise destructive retention rules with isolated services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const saved = new Date('2026-08-31T12:00:00Z');
const due = new Date('2027-02-28T12:00:00Z');
function draft(f, overrides = {}) {
  return Object.assign(f.state.events.get('event'), { draftLastSavedAt: saved, expiresAt: null, ...overrides });
}
const cleanup = (f, now = due) => f.load('lib/invitation-lifecycle-storage.ts').runInvitationLifecycle(now);

test('six calendar months clamp month ends and exclude paid invitations, courtesies and examples', () => {
  const f = createFixture(), event = draft(f);
  const { draftDeletionDate } = f.load('lib/invitation-lifecycle.ts');
  assert.equal(draftDeletionDate(event).toISOString(), due.toISOString());
  for (const changes of [{ paidAt: saved }, { complimentaryAt: saved }, { isExample: true }, { status: 'REFUNDED' }]) {
    assert.equal(draftDeletionDate({ ...event, ...changes }), null);
  }
  assert.equal(draftDeletionDate({ ...event, draftLastSavedAt: new Date('2023-08-31T12:00:00Z') }).toISOString(), '2024-02-29T12:00:00.000Z');
});

test('due drafts are deleted exactly at the deadline, queue images and release one slot once', async () => {
  const f = createFixture(), event = draft(f);
  const asset = f.addAsset(); event.imageUrl = asset.url;
  assert.equal((await cleanup(f, new Date(due.getTime() - 1))).deleted, 0);
  assert.equal((await cleanup(f)).deleted, 1);
  assert.equal(f.state.events.has('event'), false);
  assert.equal(f.state.users.get('owner').invitationCount, 0);
  assert.equal(f.state.assets.get(asset.publicId).state, 'DELETE_PENDING');
  assert.equal((await cleanup(f)).deleted, 0);
  assert.equal(f.state.users.get('owner').invitationCount, 0);
});

test('recent drafts, courtesies, examples and paid invitations survive draft cleanup', async () => {
  for (const overrides of [{ draftLastSavedAt: new Date('2027-01-01') }, { complimentaryAt: saved }, { isExample: true }, { paidAt: saved, expiresAt: new Date('2027-08-31'), status: 'PUBLISHED' }]) {
    const f = createFixture(); draft(f, overrides);
    assert.equal((await cleanup(f)).deleted, 0);
    assert.equal(f.state.events.size, 1);
  }
});

test('payment verification failures retain drafts for Stripe, PayPal and Mercado Pago', async () => {
  for (const provider of ['stripe', 'paypal', 'mercadopago']) {
    const f = createFixture(); draft(f, { status: 'PENDING_PAYMENT' });
    f.state.payments.set('payment', { id: 'payment', eventId: 'event', ownerId: 'owner', provider, status: 'PENDING', providerCheckoutId: 'remote' });
    f.load('lib/payment-reconciliation.ts').reconcilePurchase = async () => { throw Error('Provider unavailable'); };
    assert.equal((await cleanup(f)).failed, 1);
    assert.equal(f.state.events.size, 1);
  }
});

test('cleanup rechecks concurrent saves and recovered successful payments under the event lock', async () => {
  for (const changes of [{ draftLastSavedAt: due }, { paidAt: due, expiresAt: new Date('2028-02-28'), status: 'PUBLISHED' }]) {
    const f = createFixture(), event = draft(f);
    f.state.payments.set('payment', { id: 'payment', eventId: 'event', ownerId: 'owner', status: 'PENDING', providerCheckoutId: 'remote' });
    f.load('lib/payment-reconciliation.ts').reconcilePurchase = async () => {
      Object.assign(event, changes); f.state.payments.get('payment').status = 'PAID';
    };
    assert.equal((await cleanup(f)).retained, 1);
    assert.equal(f.state.events.size, 1);
  }
});

test('unresolved payment reservations retain drafts; expired reservations allow deletion and keep purchase history', async () => {
  const f = createFixture(); draft(f);
  f.state.payments.set('payment', { id: 'payment', eventId: 'event', ownerId: 'owner', status: 'PENDING', stripeCheckoutSessionId: null, providerCheckoutId: null, checkoutExpiresAt: new Date(due.getTime() + 1000) });
  assert.equal((await cleanup(f)).retained, 1);
  assert.equal((await cleanup(f, new Date(due.getTime() + 1000))).deleted, 1);
  assert.equal(f.state.payments.get('payment').status, 'EXPIRED');
});

test('real saves restart inactivity; identical repeated saves and unrelated updates do not', async () => {
  const f = createFixture(); draft(f);
  assert.equal((await f.actions.updateEvent('event', f.saveForm())).ok, true);
  const first = f.state.events.get('event').draftLastSavedAt;
  assert.ok(first > saved);
  const sentinel = new Date('2026-10-01');
  f.state.events.get('event').draftLastSavedAt = sentinel;
  assert.equal((await f.actions.updateEvent('event', f.saveForm())).ok, true);
  assert.equal(f.state.events.get('event').draftLastSavedAt.getTime(), sentinel.getTime());
  await f.prisma.event.update({ where: { id: 'event' }, data: { status: 'PENDING_PAYMENT' } });
  assert.equal(f.state.events.get('event').draftLastSavedAt.getTime(), sentinel.getTime());
  const changed = f.saveForm(); changed.set('name', 'Nuevo nombre');
  assert.equal((await f.actions.updateEvent('event', changed)).ok, true);
  assert.ok(f.state.events.get('event').draftLastSavedAt > sentinel);
});

test('privacy changes restart inactivity while unchanged privacy and failed saves preserve it', async () => {
  const f = createFixture(); draft(f);
  const actions = f.load('app/dashboard/eventos/[id]/ajustes/actions.ts');
  assert.equal((await actions.saveInvitationPrivacy('event', 'PUBLIC', '', 0)).ok, true);
  assert.equal(f.state.events.get('event').draftLastSavedAt.getTime(), saved.getTime());
  const invalid = f.saveForm(); invalid.set('name', '');
  assert.equal((await f.actions.updateEvent('event', invalid)).ok, false);
  assert.equal(f.state.events.get('event').draftLastSavedAt.getTime(), saved.getTime());
  assert.equal((await actions.saveInvitationPrivacy('event', 'PRIVATE', '123456', 0)).ok, true);
  assert.ok(f.state.events.get('event').draftLastSavedAt > saved);
});

test('shared images survive removal of an abandoned draft', async () => {
  const f = createFixture(), event = draft(f), asset = f.addAsset(); event.imageUrl = asset.url;
  f.state.events.set('other', { ...event, id: 'other', draftLastSavedAt: due });
  assert.equal((await cleanup(f)).deleted, 1);
  assert.equal((await f.storage.runImageCleanup()).retained, 1);
  assert.equal(f.requests.some(request => request.method === 'DELETE'), false);
  assert.equal(f.state.assets.has(asset.publicId), true);
});
