/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS runner intercepts server-only dependencies for isolated webhook tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const Stripe = require('stripe');

// Exercise the actual TypeScript handler with an isolated database and no API calls.
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const stripe = new Stripe('sk_test_fixture');
process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fixture';
let stored;
let failDatabase = false;
const load = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'next/cache') return { revalidatePath() {} };
  if (request === 'server-only') return {};
  if (request === '@/lib/stripe') return { getStripe: () => stripe };
  if (request === '@/prisma') return { prisma: { event: {
    findFirst: async ({ where }) => {
      if (failDatabase) throw new Error('temporary database failure');
      return stored?.id === where.id && stored?.ownerId === where.ownerId ? stored : null;
    },
    updateMany: async ({ where, data }) => {
      if (stored?.id !== where.id || stored?.ownerId !== where.ownerId || stored.paidAt !== null) return { count: 0 };
      Object.assign(stored, data); return { count: 1 };
    },
  } } };
  if (request.startsWith('@/')) request = path.resolve(__dirname, '..', request.slice(2));
  return load.call(this, request, parent, isMain);
};
const { POST } = require('../app/api/stripe/webhook/route.ts');
const { isInvitationPublished } = require('../lib/invitation-payment.ts');
const { isPaidInvitationSession } = require('../lib/stripe-payment.ts');
const { fulfillInvitationPayment } = require('../lib/payment-fulfillment.ts');
const paidSession = {
  id: 'cs_test_fixture', mode: 'payment', payment_status: 'paid', amount_total: 49900, currency: 'mxn', livemode: false,
  client_reference_id: 'event-fixture', payment_intent: 'pi_test_fixture',
  metadata: { eventId: 'event-fixture', ownerId: 'owner-fixture', product: 'invitation-12-months' },
};
const paymentEvent = (session = paidSession, extra = {}) => ({ id: 'evt_fixture', type: 'checkout.session.completed', created: 1800000000, livemode: false, data: { object: session }, ...extra });
function request(event, valid = true) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: valid ? 'whsec_fixture' : 'whsec_wrong' });
  return new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': signature } });
}

test('only paid, active invitations have a public link', () => {
  const invitation = { status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000), slug: 'fixture' };
  assert.equal(isInvitationPublished(invitation), true);
  for (const change of [{ paidAt: null }, { status: 'PENDING_PAYMENT' }, { expiresAt: null }, { expiresAt: new Date(0) }, { slug: null }]) {
    assert.equal(isInvitationPublished({ ...invitation, ...change }), false);
  }
});

test('payment must match the expected amount, currency, product and event', () => {
  assert.equal(isPaidInvitationSession(paidSession), true);
  for (const change of [{ payment_status: 'unpaid' }, { amount_total: 1 }, { currency: 'usd' }, { client_reference_id: 'another-event' }, { metadata: null }, { mode: 'subscription' }]) {
    assert.equal(isPaidInvitationSession({ ...paidSession, ...change }), false);
  }
});

test('signed webhook unlocks once; forged, unpaid, wrong-mode and duplicate deliveries do not', async () => {
  stored = { id: 'event-fixture', ownerId: 'owner-fixture', name: 'Prueba', slug: null, paidAt: null, status: 'PENDING_PAYMENT' };
  assert.equal((await POST(request(paymentEvent(), false))).status, 400);
  assert.equal(stored.paidAt, null);
  assert.equal((await POST(request(paymentEvent({ ...paidSession, payment_status: 'unpaid' })))).status, 200);
  assert.equal(stored.paidAt, null);
  await POST(request(paymentEvent(paidSession, { livemode: true })));
  assert.equal(stored.paidAt, null);
  await POST(request(paymentEvent({ ...paidSession, metadata: { ...paidSession.metadata, ownerId: 'wrong-owner' } })));
  assert.equal(stored.paidAt, null);
  assert.equal((await POST(request(paymentEvent()))).status, 200);
  assert.equal(stored.status, 'PUBLISHED');
  assert.equal(stored.stripePaymentIntentId, 'pi_test_fixture');
  const expiresAt = stored.expiresAt.getTime();
  await POST(request(paymentEvent(paidSession, { created: 1800003600 })));
  assert.equal(stored.expiresAt.getTime(), expiresAt);
  assert.equal((await POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: '{}' }))).status, 400);
});

test('temporary fulfillment failures return 500 so Stripe can retry', async () => {
  failDatabase = true;
  assert.equal((await POST(request(paymentEvent()))).status, 500);
  failDatabase = false;
});

test('recovering a verified session without a webhook unlocks once and preserves its payment date', async () => {
  stored = { id: 'event-fixture', ownerId: 'owner-fixture', name: 'Prueba', slug: null, paidAt: null, status: 'PENDING_PAYMENT' };
  const paidAt = new Date(1800000000000);
  assert.equal(await fulfillInvitationPayment({ ...paidSession, payment_status: 'unpaid' }, paidAt), null);
  assert.equal(stored.paidAt, null);
  const result = await fulfillInvitationPayment(paidSession, paidAt);
  assert.equal(result.id, stored.id);
  assert.equal(stored.status, 'PUBLISHED');
  const expiresAt = stored.expiresAt.getTime();
  await POST(request(paymentEvent(paidSession, { created: 1800003600 })));
  assert.equal(stored.paidAt.getTime(), paidAt.getTime());
  assert.equal(stored.expiresAt.getTime(), expiresAt);
});
