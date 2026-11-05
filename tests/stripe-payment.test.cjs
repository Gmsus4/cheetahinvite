/* eslint-disable @typescript-eslint/no-require-imports -- Exercise real handlers with signed Stripe events and isolated services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');

test('only paid active invitations expose a public link', () => {
  const f = createPaymentFixture();
  const { isInvitationPublished } = f.load('lib/invitation-payment.ts');
  const event = { status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000), slug: 'fixture' };
  assert.equal(isInvitationPublished(event), true);
  for (const change of [{ paidAt: null }, { status: 'REFUNDED' }, { status: 'SUSPENDED' }, { expiresAt: new Date(0) }, { slug: null }]) assert.equal(isInvitationPublished({ ...event, ...change }), false);
});

test('settlement verifies the immutable purchase amount and ownership', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  const { isPaidInvitationSession } = f.load('lib/stripe-payment.ts');
  for (const change of [{ payment_status: 'unpaid' }, { amount_total: 1 }, { currency: 'usd' }, { payment_intent: null }, { client_reference_id: 'other' }, { metadata: null }, { mode: 'subscription' }]) assert.equal(isPaidInvitationSession({ ...session, ...change }), false);
  f.sessions.get(session.id).metadata.ownerId = 'other';
  assert.equal(await f.fulfillment.fulfillInvitationPayment(session), null);
  assert.equal(f.events.get('event-fixture').paidAt, null);
});

test('forged and wrong-environment webhooks cannot publish', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase(); const { POST } = f.load('app/api/stripe/webhook/route.ts');
  assert.equal((await POST(new Request('http://localhost/api', { method: 'POST', body: '{}', headers: { 'stripe-signature': 'forged' } }))).status, 400);
  assert.equal((await POST(new Request('http://localhost/api', { method: 'POST', body: '{}' }))).status, 400);
  assert.equal((await f.webhook('checkout.session.completed', session, { livemode: true })).status, 200);
  assert.equal(f.events.get('event-fixture').paidAt, null);
});

test('previous purchases settle at their stored price after catalog changes', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase({ amount: 49900 });
  assert.equal(f.load('lib/stripe-payment.ts').isPaidInvitationSession(session), false);
  await f.fulfillment.fulfillInvitationPayment(session);
  assert.equal(f.payments.get('payment-fixture').status, 'PAID');
  assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
});

test('concurrent repeated deliveries publish once and preserve original dates', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  await Promise.all(Array.from({ length: 3 }, () => f.webhook('checkout.session.completed', session)));
  const event = structuredClone(f.events.get('event-fixture'));
  assert.equal(event.status, 'PUBLISHED'); assert.equal(f.payments.get('payment-fixture').status, 'PAID');
  f.intents.get('pi_fixture').latest_charge.created += 86400;
  await f.webhook('checkout.session.completed', session, { created: 1900000000 });
  assert.equal(f.events.get(event.id).expiresAt.getTime(), event.expiresAt.getTime());
  assert.equal(f.events.get(event.id).paidAt.getTime(), event.paidAt.getTime());
});

test('successful partial refunds maintain access; total refunds revoke both links', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  await f.fulfillment.fulfillInvitationPayment(session);
  f.refunds = [{ id: 're_partial', amount: 10000, status: 'succeeded' }];
  await f.webhook('charge.refunded', { livemode: false, payment_intent: 'pi_fixture' });
  assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
  f.refunds.push({ id: 're_rest', amount: 39900, status: 'succeeded' });
  await f.webhook('refund.updated', { payment_intent: 'pi_fixture' }); // Refund has no livemode field.
  assert.equal(f.events.get('event-fixture').status, 'REFUNDED');
  assert.equal(f.payments.get('payment-fixture').refundedAmount, 49900);
  assert.ok(f.invalidations.includes('/dashboard/compras'));
  assert.ok(f.invalidations.some(p => p.startsWith('/invitacion/')));
  // A delayed completion cannot undo the total refund.
  await f.webhook('checkout.session.completed', session);
  assert.equal(f.events.get('event-fixture').status, 'REFUNDED');
});

test('pending, failed and canceled refunds do not revoke access; later failure restores access', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  for (const status of ['pending', 'requires_action', 'failed', 'canceled']) {
    f.refunds = [{ id: 're_fixture', amount: 49900, status }]; await f.fulfillment.fulfillInvitationPayment(session);
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 0);
  }
  f.refunds[0].status = 'succeeded'; await f.fulfillment.fulfillInvitationPayment(session);
  assert.equal(f.events.get('event-fixture').status, 'REFUNDED');
  f.refunds[0].status = 'failed'; await f.webhook('refund.failed', { payment_intent: 'pi_fixture' });
  assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
});

test('disputes suspend, won/closed disputes restore original term, lost disputes stay suspended', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  await f.fulfillment.fulfillInvitationPayment(session); const expiry = f.events.get('event-fixture').expiresAt.getTime();
  for (const status of ['needs_response', 'under_review', 'lost', 'won', 'warning_closed']) {
    f.disputes = [{ id: 'du_fixture', status }];
    await f.webhook('charge.dispute.closed', { livemode: false, payment_intent: 'pi_fixture', status: 'stale-event-value' });
    assert.equal(f.events.get('event-fixture').status, ['won', 'warning_closed'].includes(status) ? 'PUBLISHED' : 'SUSPENDED');
    assert.equal(f.events.get('event-fixture').expiresAt.getTime(), expiry);
  }
});

test('winning a dispute never restores fully refunded, expired or archived invitations', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  f.disputes = [{ id: 'du_fixture', status: 'won' }]; f.refunds = [{ id: 're_full', amount: 49900, status: 'succeeded' }];
  await f.fulfillment.fulfillInvitationPayment(session); assert.equal(f.events.get('event-fixture').status, 'REFUNDED');
  f.refunds = [];
  for (const status of ['ARCHIVED', 'EXPIRED']) {
    f.events.get('event-fixture').status = status; await f.fulfillment.fulfillInvitationPayment(session);
    assert.equal(f.events.get('event-fixture').status, status);
  }
  f.events.get('event-fixture').status = 'SUSPENDED'; f.payments.get('payment-fixture').expiresAt = new Date(0);
  await f.fulfillment.fulfillInvitationPayment(session); assert.equal(f.events.get('event-fixture').status, 'EXPIRED');
});

test('refund arriving before completion and after deletion remains recorded without recreating invitation', async () => {
  const f = createPaymentFixture(); f.addPurchase(); f.events.clear();
  f.refunds = [{ id: 're_full', amount: 49900, status: 'succeeded' }];
  const response = await f.webhook('refund.created', { payment_intent: 'pi_fixture' });
  assert.equal(response.status, 200); assert.equal(f.events.size, 0);
  assert.equal(f.payments.get('payment-fixture').status, 'PAID'); assert.equal(f.payments.get('payment-fixture').refundedAmount, 49900);
});

test('API/DB failures return 500 for retries and do not leave half-settled records', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  f.apiFailure = true; assert.equal((await f.webhook('checkout.session.completed', session)).status, 500);
  assert.equal(f.payments.get('payment-fixture').status, 'PENDING');
  f.apiFailure = false; f.databaseFailure = true; assert.equal((await f.webhook('checkout.session.completed', session)).status, 500);
  f.databaseFailure = false; assert.equal((await f.webhook('checkout.session.completed', session)).status, 200);
});

test('second confirmed purchase cannot extend or revoke the primary purchase', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase(); await f.fulfillment.fulfillInvitationPayment(session);
  const original = structuredClone(f.events.get('event-fixture'));
  const second = f.addPurchase({ id: 'payment-second', stripeCheckoutSessionId: 'cs_second' });
  f.events.set(original.id, original); second.session.payment_intent = 'pi_second'; f.sessions.set('cs_second', second.session);
  f.intents.set('pi_second', { ...f.intents.get('pi_fixture'), id: 'pi_second', latest_charge: { ...f.intents.get('pi_fixture').latest_charge, id: 'ch_second', payment_intent: 'pi_second' } });
  f.refunds = [{ id: 're_duplicate', amount: 49900, status: 'succeeded' }];
  await f.fulfillment.fulfillInvitationPayment(second.session);
  assert.equal(f.payments.size, 2); assert.deepEqual(f.events.get(original.id), original);
});

test('checkout reservations reuse one payable session across tabs and lost responses', async () => {
  const f = createPaymentFixture(); f.events.set('event', { ...f.eventDetails, id: 'event', ownerId: f.ownerId, name: 'Fixture', paidAt: null });
  f.loseCreateResponse = true;
  await assert.rejects(f.checkout.prepareInvitationCheckout('event', f.ownerId), /Response lost/);
  const urls = await Promise.all([f.checkout.prepareInvitationCheckout('event', f.ownerId), f.checkout.prepareInvitationCheckout('event', f.ownerId)]);
  assert.equal(urls[0], urls[1]); assert.equal(f.sessions.size, 1); assert.equal(f.payments.size, 1);
  const create = f.calls.find(c => c[0] === 'create')[1];
  assert.equal(create.line_items[0].price_data.unit_amount, 26900);
  assert.equal(create.line_items[0].price_data.currency, 'mxn');
  assert.equal(create.metadata.paymentId, create.payment_intent_data.metadata.paymentId);
  assert.equal(await f.checkout.prepareInvitationCheckout('event', 'other-owner'), null);
  f.events.get('event').paidAt = new Date(); assert.equal(await f.checkout.prepareInvitationCheckout('event', f.ownerId), null);
});

test('expired checkout starts a fresh attempt and keeps previous history', async () => {
  const f = createPaymentFixture(); f.events.set('event', { ...f.eventDetails, id: 'event', ownerId: f.ownerId, name: 'Fixture', paidAt: null });
  await f.checkout.prepareInvitationCheckout('event', f.ownerId); [...f.sessions.values()][0].status = 'expired';
  await f.checkout.prepareInvitationCheckout('event', f.ownerId);
  assert.equal(f.payments.size, 2); assert.equal([...f.payments.values()].filter(p => p.status === 'EXPIRED').length, 1);
});

test('old unpaid checkout is retired before issuing the new 269 MXN price', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  Object.assign(f.sessions.get(session.id), { status: 'open', payment_status: 'unpaid', url: 'https://checkout.stripe.com/old' });
  const url = await f.checkout.prepareInvitationCheckout('event-fixture', f.ownerId);
  assert.notEqual(url, 'https://checkout.stripe.com/old');
  assert.equal(f.sessions.get(session.id).status, 'expired');
  assert.equal(f.payments.get('payment-fixture').amount, 49900);
  assert.equal([...f.payments.values()].find(p => p.status === 'PENDING').amount, 26900);
});

test('a payment completed while replacing the old price is recovered without creating another checkout', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  Object.assign(f.sessions.get(session.id), { status: 'open', payment_status: 'unpaid', url: 'https://checkout.stripe.com/old' });
  f.payDuringExpiry = true;
  assert.equal(await f.checkout.prepareInvitationCheckout('event-fixture', f.ownerId), '/dashboard/eventos/event-fixture/pago?payment=received');
  assert.equal(f.calls.some(c => c[0] === 'create'), false);
});

test('failed retirement does not create a second payable checkout', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  Object.assign(f.sessions.get(session.id), { status: 'open', payment_status: 'unpaid', url: 'https://checkout.stripe.com/old' });
  f.expireFailure = true;
  await assert.rejects(f.checkout.prepareInvitationCheckout('event-fixture', f.ownerId), /Expiry failed/);
  assert.equal(f.calls.some(c => c[0] === 'create'), false);
});

test('expired and failed payment notifications record the current Stripe state without publishing', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  const current = f.sessions.get(session.id); current.payment_status = 'unpaid'; current.status = 'expired'; current.payment_intent = null;
  await f.webhook('checkout.session.expired', current);
  assert.equal(f.payments.get('payment-fixture').status, 'EXPIRED'); assert.equal(f.events.get('event-fixture').paidAt, null);
  current.status = 'complete'; current.payment_intent = 'pi_fixture'; f.intents.get('pi_fixture').status = 'requires_payment_method';
  await f.webhook('checkout.session.async_payment_failed', current);
  assert.equal(f.payments.get('payment-fixture').status, 'FAILED'); assert.equal(f.events.get('event-fixture').paidAt, null);
});

test('manual refresh checks ownership and limits repeated Stripe reads', async () => {
  const f = createPaymentFixture(); const { session } = f.addPurchase();
  const { refreshPurchase } = f.load('app/dashboard/compras/actions.ts');
  f.ownerId = 'another-owner'; await assert.rejects(refreshPurchase('payment-fixture'), { url: '/dashboard/compras' });
  assert.equal(f.calls.length, 0); f.ownerId = 'owner-fixture';
  await f.fulfillment.fulfillInvitationPayment(session); const count = f.calls.length;
  await Promise.all([refreshPurchase('payment-fixture'), refreshPurchase('payment-fixture')]); assert.equal(f.calls.length, count);
});
