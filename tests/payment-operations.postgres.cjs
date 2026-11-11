/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in PostgreSQL verification, Stripe remains simulated. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ownerId = `__payment_test_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { Prisma } = require('../generated/prisma/client.ts');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');
const f = createPaymentFixture({ prisma, Prisma, ownerId });
let paymentId, eventId;
(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, name: 'Payment integration fixture', invitationCount: 1 } });
    eventId = (await prisma.event.create({ data: { ...f.eventDetails, ownerId, privacy: 'PUBLIC', name: 'Payment fixture' } })).id;
    const urls = await Promise.all([f.checkout.prepareInvitationCheckout(eventId, ownerId), f.checkout.prepareInvitationCheckout(eventId, ownerId)]);
    assert.equal(urls[0], urls[1]);
    const payments = await prisma.invitationPayment.findMany({ where: { ownerId } });
    assert.equal(payments.length, 1); assert.equal(payments[0].amount, 26900); paymentId = payments[0].id;
    const session = f.sessions.get(payments[0].stripeCheckoutSessionId);
    Object.assign(session, { status: 'complete', payment_status: 'paid', payment_intent: `pi_${randomUUID()}` });
    const chargeId = `ch_${randomUUID()}`;
    f.intents.set(session.payment_intent, { id: session.payment_intent, status: 'succeeded', amount_received: 26900, currency: 'mxn', livemode: false,
      latest_charge: { id: chargeId, created: Math.floor(Date.now() / 1000), paid: true, captured: true, amount: 26900, currency: 'mxn', payment_intent: session.payment_intent } });
    await Promise.all([f.fulfillment.fulfillInvitationPayment(session), f.fulfillment.fulfillInvitationPayment(session)]);
    let event = await prisma.event.findUnique({ where: { id: eventId } }); assert.equal(event.status, 'PUBLISHED'); const originalExpiry = event.expiresAt.getTime();
    f.disputes = [{ id: 'du_fixture', status: 'under_review' }];
    await f.fulfillment.reconcileInvitationPayment(paymentId); assert.equal((await prisma.event.findUnique({ where: { id: eventId } })).status, 'SUSPENDED');
    f.disputes[0].status = 'won'; await f.fulfillment.reconcileInvitationPayment(paymentId);
    event = await prisma.event.findUnique({ where: { id: eventId } }); assert.equal(event.status, 'PUBLISHED'); assert.equal(event.expiresAt.getTime(), originalExpiry);
    f.refunds = [{ id: 're_fixture', amount: 26900, status: 'succeeded' }];
    // Fail the real Event write after ledger update and verify transaction rollback.
    const failPrisma = { ...prisma, $transaction: (work, opts) => prisma.$transaction(tx => work(new Proxy(tx, { get(target, key) {
      if (key === 'event') return { findFirst: target.event.findFirst.bind(target.event), updateMany: async () => { throw Error('Fixture write failure'); } };
      return Reflect.get(target, key);
    } })), opts) };
    const failure = createPaymentFixture({ prisma: failPrisma, Prisma, ownerId });
    failure.sessions.set(session.id, session); failure.intents.set(session.payment_intent, f.intents.get(session.payment_intent)); failure.refunds = f.refunds;
    await assert.rejects(failure.fulfillment.reconcileInvitationPayment(paymentId), /Fixture write failure/);
    assert.equal((await prisma.invitationPayment.findUnique({ where: { id: paymentId } })).refundedAmount, 0);
    await f.fulfillment.reconcileInvitationPayment(paymentId); assert.equal((await prisma.event.findUnique({ where: { id: eventId } })).status, 'REFUNDED');
    await prisma.event.delete({ where: { id: eventId } });
    await f.fulfillment.reconcileInvitationPayment(paymentId);
    assert.equal((await prisma.invitationPayment.findUnique({ where: { id: paymentId } })).refundedAmount, 26900);
    // Exercise the external reservation/reconciliation lock order in PostgreSQL.
    // OAuth and all PayPal operations remain simulated, including late approval.
    const externalEvent = await prisma.event.create({ data: { ...f.eventDetails, ownerId, privacy: 'PUBLIC', name: 'Return URL fixture' } });
    const originalFetch = global.fetch, originalOrigin = process.env.APP_URL, originalMode = process.env.PAYPAL_ENVIRONMENT;
    const orders = new Map(); let externalCreates = 0, captureAttempts = 0;
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
    global.fetch = async (url, options) => {
      const path = new URL(url).pathname;
      if (path === '/v1/oauth2/token') return Response.json({ access_token: 'fixture' });
      if (path === '/v2/checkout/orders' && options.method === 'POST') {
        const data = JSON.parse(options.body), id = `order_${randomUUID()}`;
        orders.set(id, { ...data, id, status: 'PAYER_ACTION_REQUIRED' }); externalCreates++;
        return Response.json({ id, links: [{ rel: 'payer-action', href: `https://www.sandbox.paypal.com/checkoutnow?token=${id}` }] });
      }
      if (path.endsWith('/capture')) { captureAttempts++; throw Error('Retired order must not be captured'); }
      const order = orders.get(path.split('/').at(-1));
      assert.ok(order, 'Unknown mocked PayPal order'); return Response.json(order);
    };
    try {
      const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
      const { reconcileExternalPayment } = f.load('lib/external-payment-fulfillment.ts');
      const localUrls = await Promise.all([prepareExternalCheckout(externalEvent.id, ownerId, 'paypal'), prepareExternalCheckout(externalEvent.id, ownerId, 'paypal')]);
      assert.equal(localUrls[0], localUrls[1]); assert.equal(externalCreates, 1);
      const localAttempt = await prisma.invitationPayment.findFirst({ where: { eventId: externalEvent.id } });
      assert.equal(localAttempt.checkoutOrigin, 'http://localhost:3000');
      process.env.APP_URL = 'https://return-url-fixture.example.com';
      const publicUrls = await Promise.all([prepareExternalCheckout(externalEvent.id, ownerId, 'paypal'), prepareExternalCheckout(externalEvent.id, ownerId, 'paypal')]);
      assert.equal(publicUrls[0], publicUrls[1]); assert.notEqual(publicUrls[0], localUrls[0]); assert.equal(externalCreates, 2);
      assert.equal((await prisma.invitationPayment.findUnique({ where: { id: localAttempt.id } })).status, 'EXPIRED');
      const publicAttempt = await prisma.invitationPayment.findFirst({ where: { eventId: externalEvent.id, status: 'PENDING' } });
      assert.equal(publicAttempt.checkoutOrigin, process.env.APP_URL);
      const publicOrder = orders.get(publicAttempt.providerCheckoutId.slice('paypal:'.length));
      assert.equal(new URL(publicOrder.payment_source.paypal.experience_context.return_url).origin, process.env.APP_URL);
      orders.get(localAttempt.providerCheckoutId.slice('paypal:'.length)).status = 'APPROVED';
      await Promise.all([reconcileExternalPayment(localAttempt.id), prepareExternalCheckout(externalEvent.id, ownerId, 'paypal')]);
      assert.equal(captureAttempts, 0); assert.equal(externalCreates, 2);
      assert.equal((await prisma.invitationPayment.findUnique({ where: { id: localAttempt.id } })).paidAt, null);
    } finally {
      global.fetch = originalFetch; process.env.APP_URL = originalOrigin;
      if (originalMode === undefined) delete process.env.PAYPAL_ENVIRONMENT; else process.env.PAYPAL_ENVIRONMENT = originalMode;
    }
    await prisma.user.delete({ where: { id: ownerId } });
    assert.ok(await prisma.invitationPayment.findUnique({ where: { id: paymentId } }));
    console.log('PostgreSQL payment integration passed: concurrent Checkout and settlement, dispute recovery, rollback, refund, cross-origin PayPal reservations, late approval and deletion retention. Providers were simulated throughout.');
  } finally {
    assert.ok(ownerId.startsWith('__payment_test_'));
    await prisma.invitationPayment.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error : `${error.name} ${error.code ?? ''}: ${error.message.trim().split('\n').at(-1)}`); process.exitCode = 1; });
