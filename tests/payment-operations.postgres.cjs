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
    eventId = (await prisma.event.create({ data: { ...f.eventDetails, ownerId, name: 'Payment fixture' } })).id;
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
    await prisma.user.delete({ where: { id: ownerId } });
    assert.ok(await prisma.invitationPayment.findUnique({ where: { id: paymentId } }));
    console.log('PostgreSQL payment integration passed: concurrent Checkout and settlement, dispute recovery, rollback, refund and deletion retention. Stripe was simulated throughout.');
  } finally {
    assert.ok(ownerId.startsWith('__payment_test_'));
    await prisma.invitationPayment.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error : `${error.name} ${error.code ?? ''}: ${error.message.trim().split('\n').at(-1)}`); process.exitCode = 1; });
