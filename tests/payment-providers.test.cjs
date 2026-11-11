/* eslint-disable @typescript-eslint/no-require-imports -- Isolated provider integration tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');

function external(provider) {
  const f = createPaymentFixture();
  process.env.PAYPAL_ENVIRONMENT = 'sandbox';
  process.env.MERCADOPAGO_ENVIRONMENT = 'sandbox';
  f.addPurchase({ provider, providerCheckoutId: `${provider}:order`, stripeCheckoutSessionId: null });
  f.reconcile = f.load('lib/external-payment-fulfillment.ts').reconcileExternalPayment;
  return f;
}
async function withFetch(handler, work) {
  const original = global.fetch;
  global.fetch = async (url, options) => Response.json(await handler(String(url), options));
  try { await work(); } finally { global.fetch = original; }
}
function paypalOrder(status = 'COMPLETED') {
  return { id: 'order', status, purchase_units: [{ reference_id: 'payment-fixture', custom_id: 'payment-fixture', amount: { currency_code: 'MXN', value: '499.00' }, payments: { captures: status === 'COMPLETED' ? [{ id: 'capture' }] : [] } }] };
}
const capture = { id: 'capture', status: 'COMPLETED', amount: { currency_code: 'MXN', value: '499.00' }, supplementary_data: { related_ids: { order_id: 'order' } }, create_time: '2026-11-11T12:00:00Z' };

function paypalWebhook(f, type, resource) {
  Object.assign(process.env, { PAYPAL_CLIENT_ID: 'client', PAYPAL_CLIENT_SECRET: 'secret', PAYPAL_WEBHOOK_ID: 'webhook' });
  return f.load('app/api/paypal/webhook/route.ts').POST(new Request('https://example.com/api/paypal/webhook', {
    method: 'POST', body: JSON.stringify({ event_type: type, resource }),
    headers: Object.fromEntries(['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'].map(header => [header, 'fixture'])),
  }));
}

test('PayPal approval is captured server-side; repeated settlement preserves the term', async () => {
  const f = external('paypal'); let captured = false, calls = 0;
  await withFetch(async url => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    if (url.endsWith('/order/capture')) { captured = true; calls++; return {}; }
    if (url.endsWith('/orders/order')) return paypalOrder(captured ? 'COMPLETED' : 'APPROVED');
    if (url.endsWith('/captures/capture')) return capture;
    throw Error('Unexpected URL');
  }, async () => {
    await f.reconcile('payment-fixture');
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    assert.equal(f.events.get('event-fixture').stripePaymentIntentId, 'paypal:capture');
    const expiry = f.events.get('event-fixture').expiresAt.getTime();
    await f.reconcile('payment-fixture');
    assert.equal(f.events.get('event-fixture').expiresAt.getTime(), expiry);
    assert.equal(calls, 1);
  });
});

test('PayPal wrong amount or identity rolls back without publishing', async () => {
  for (const change of [{ custom_id: 'other' }, { amount: { currency_code: 'MXN', value: '1.00' } }]) {
    const f = external('paypal'); const order = paypalOrder(); Object.assign(order.purchase_units[0], change);
    await withFetch(async url => url.endsWith('/token') ? { access_token: 'fixture' } : order, async () => {
      await assert.rejects(f.reconcile('payment-fixture'), /purchase mismatch/);
      assert.equal(f.events.get('event-fixture').paidAt, null);
    });
  }
});

test('PayPal refund events resolve their capture and recover settlement before the completion webhook', async () => {
  const f = external('paypal');
  const remoteCapture = structuredClone(capture);
  const refund = { id: 'refund', status: 'PENDING', amount: { currency_code: 'MXN', value: '100.00' }, links: [{ rel: 'up', href: 'https://api-m.sandbox.paypal.com/v2/payments/captures/capture' }] };
  await withFetch(async url => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    if (url.endsWith('/verify-webhook-signature')) return { verification_status: 'SUCCESS' };
    if (url.endsWith('/orders/order')) return paypalOrder();
    if (url.endsWith('/captures/capture')) return remoteCapture;
    if (url.endsWith('/refunds/refund')) return refund;
    throw Error('Unexpected URL');
  }, async () => {
    // No capture ID has been saved yet. Resolve refund -> capture -> order.
    assert.equal((await paypalWebhook(f, 'PAYMENT.REFUND.PENDING', { id: 'refund' })).status, 200);
    assert.equal(f.payments.get('payment-fixture').refundPendingAmount, 10000);
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    const expiresAt = f.events.get('event-fixture').expiresAt.getTime();
    refund.status = 'FAILED';
    assert.equal((await paypalWebhook(f, 'PAYMENT.REFUND.FAILED', { id: 'refund' })).status, 200);
    assert.equal(f.payments.get('payment-fixture').refundPendingAmount, 0);
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 0);
    // A delayed pending event must use the API's current FAILED state.
    assert.equal((await paypalWebhook(f, 'PAYMENT.REFUND.PENDING', { id: 'refund' })).status, 200);
    assert.equal(f.payments.get('payment-fixture').refundPendingAmount, 0);
    assert.equal(f.payments.get('payment-fixture').refunds[0].status, 'FAILED');
    refund.status = 'COMPLETED'; remoteCapture.status = 'PARTIALLY_REFUNDED';
    assert.equal((await paypalWebhook(f, 'PAYMENT.CAPTURE.REFUNDED', { id: 'refund' })).status, 200);
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 10000);
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    // The order omits refunds, but its saved reference still reconciles.
    await f.reconcile('payment-fixture');
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 10000);
    refund.amount.value = '499.00'; remoteCapture.status = 'REFUNDED';
    assert.equal((await paypalWebhook(f, 'PAYMENT.CAPTURE.REFUNDED', { id: 'refund' })).status, 200);
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 49900);
    assert.equal(f.events.get('event-fixture').status, 'REFUNDED');
    assert.equal(f.events.get('event-fixture').expiresAt.getTime(), expiresAt);
  });
});

test('PayPal approval reversal prevents delayed approval events from capturing an unpaid order', async () => {
  const f = external('paypal'); let captureAttempts = 0, completed = false;
  await withFetch(async url => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    if (url.endsWith('/verify-webhook-signature')) return { verification_status: 'SUCCESS' };
    if (url.endsWith('/orders/order')) return paypalOrder(completed ? 'COMPLETED' : 'APPROVED');
    if (url.endsWith('/captures/capture')) return capture;
    if (url.endsWith('/order/capture')) { captureAttempts++; throw Error('Must not capture reversed approval'); }
    throw Error('Unexpected URL');
  }, async () => {
    assert.equal((await paypalWebhook(f, 'CHECKOUT.PAYMENT-APPROVAL.REVERSED', { order_id: 'order' })).status, 200);
    assert.equal(f.payments.get('payment-fixture').status, 'FAILED');
    assert.equal(f.events.get('event-fixture').paidAt, null);
    assert.equal((await paypalWebhook(f, 'CHECKOUT.ORDER.APPROVED', { id: 'order' })).status, 200);
    await f.reconcile('payment-fixture');
    assert.equal(f.payments.get('payment-fixture').status, 'FAILED');
    assert.equal(captureAttempts, 0);
    // A real capture made before reversal still wins over a delayed notice.
    completed = true;
    assert.equal((await paypalWebhook(f, 'PAYMENT.CAPTURE.COMPLETED', { id: 'capture', supplementary_data: { related_ids: { order_id: 'order' } } })).status, 200);
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    assert.equal((await paypalWebhook(f, 'CHECKOUT.PAYMENT-APPROVAL.REVERSED', { order_id: 'order' })).status, 200);
    assert.equal(f.payments.get('payment-fixture').status, 'PAID');
  });
});

test('PayPal refund lookup failures retry without losing the pending refund', async () => {
  const f = external('paypal'); let unavailable = false;
  const refund = { id: 'refund', status: 'PENDING', amount: { currency_code: 'MXN', value: '100.00' }, links: [{ rel: 'up', href: 'https://api-m.paypal.com/v2/payments/captures/capture' }] };
  await withFetch(async url => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    if (url.endsWith('/verify-webhook-signature')) return { verification_status: 'SUCCESS' };
    if (url.endsWith('/orders/order')) return paypalOrder();
    if (url.endsWith('/captures/capture')) return capture;
    if (url.endsWith('/refunds/refund')) { if (unavailable) throw Error('Provider unavailable'); return refund; }
    throw Error('Unexpected URL');
  }, async () => {
    assert.equal((await paypalWebhook(f, 'PAYMENT.REFUND.PENDING', { id: 'refund' })).status, 200);
    unavailable = true;
    assert.equal((await paypalWebhook(f, 'PAYMENT.REFUND.FAILED', { id: 'refund' })).status, 500);
    assert.equal(f.payments.get('payment-fixture').refundPendingAmount, 10000);
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
  });
});

test('PayPal cannot apply a refund belonging to another capture', async () => {
  const f = external('paypal');
  await withFetch(async url => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    if (url.endsWith('/orders/order')) return paypalOrder();
    if (url.endsWith('/captures/capture')) return capture;
    if (url.endsWith('/refunds/other')) return { id: 'other', status: 'COMPLETED', amount: { currency_code: 'MXN', value: '100.00' }, links: [{ rel: 'up', href: 'https://api-m.paypal.com/v2/payments/captures/foreign' }] };
    throw Error('Unexpected URL');
  }, async () => {
    await assert.rejects(f.reconcile('payment-fixture', 0, { paypalRefundId: 'other' }), /refund purchase mismatch/);
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 0);
    assert.equal(f.events.get('event-fixture').paidAt, null);
  });
});

test('Mercado Pago pending does not publish; verified settlement and refund change access', async () => {
  const f = external('mercadopago');
  const remote = { id: 'charge', external_reference: 'payment-fixture', live_mode: false, currency_id: 'MXN', transaction_amount: 499, status: 'pending', date_approved: '2026-11-11T12:00:00Z' };
  await withFetch(async url => url.includes('/search?') ? { results: [remote] } : remote, async () => {
    await f.reconcile('payment-fixture');
    assert.equal(f.events.get('event-fixture').paidAt, null);
    remote.status = 'approved'; await f.reconcile('payment-fixture');
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    remote.transaction_amount_refunded = 100; await f.reconcile('payment-fixture');
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    remote.transaction_amount_refunded = 499; remote.status = 'refunded'; await f.reconcile('payment-fixture');
    assert.equal(f.events.get('event-fixture').status, 'REFUNDED');
  });
});

test('Mercado Pago environment mismatch cannot settle a purchase', async () => {
  const f = external('mercadopago');
  await withFetch(async () => ({ results: [{ external_reference: 'payment-fixture', live_mode: true }] }), async () => {
    await assert.rejects(f.reconcile('payment-fixture'), /purchase mismatch/);
    assert.equal(f.payments.get('payment-fixture').status, 'PENDING');
  });
});

test('Mercado Pago signatures bind the resource and request ID', () => {
  const f = createPaymentFixture(); const { validMercadoPagoSignature } = f.load('lib/mercadopago-signature.ts');
  const v1 = createHmac('sha256', 'secret').update('id:123;request-id:request;ts:12345;').digest('hex');
  const headers = { 'x-request-id': 'request', 'x-signature': `ts=12345,v1=${v1}` };
  assert.equal(validMercadoPagoSignature(new Request('https://example.com/?data.id=123', { headers }), 'secret'), true);
  assert.equal(validMercadoPagoSignature(new Request('https://example.com/?data.id=124', { headers }), 'secret'), false);
  assert.equal(validMercadoPagoSignature(new Request('https://example.com/?data.id=123'), 'secret'), false);
});

test('forged provider notifications never read or publish a payment', async () => {
  const f = external('paypal');
  Object.assign(process.env, { PAYPAL_CLIENT_ID: 'client', PAYPAL_CLIENT_SECRET: 'secret', PAYPAL_WEBHOOK_ID: 'webhook', MERCADOPAGO_ACCESS_TOKEN: 'token', MERCADOPAGO_WEBHOOK_SECRET: 'secret' });
  await withFetch(async () => { throw Error('No remote calls expected'); }, async () => {
    const paypal = f.load('app/api/paypal/webhook/route.ts');
    const mercado = f.load('app/api/mercadopago/webhook/route.ts');
    assert.equal((await paypal.POST(new Request('https://example.com/', { method: 'POST', body: '{}' }))).status, 400);
    assert.equal((await mercado.POST(new Request('https://example.com/?data.id=123', { method: 'POST', body: '{}' }))).status, 401);
    assert.equal(f.events.get('event-fixture').paidAt, null);
  });
});

test('external checkout serializes concurrent creation and reuses the original quote', async () => {
  const f = external('mercadopago'); f.payments.clear(); let creates = 0;
  await withFetch(async (url, options) => {
    assert.ok(url.endsWith('/checkout/preferences')); creates++;
    const data = JSON.parse(options.body); assert.equal(data.items[0].currency_id, 'MXN');
    return { id: 'preference', sandbox_init_point: 'https://sandbox.mercadopago.com.mx/checkout/fixture' };
  }, async () => {
    const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
    const urls = await Promise.all([prepareExternalCheckout('event-fixture', f.ownerId, 'mercadopago'), prepareExternalCheckout('event-fixture', f.ownerId, 'mercadopago')]);
    assert.equal(urls[0], urls[1]); assert.equal(creates, 1); assert.equal(f.payments.size, 1);
  });
});

test('PayPal starts with account login and reuses one immutable order across concurrent tabs', async () => {
  const f = external('paypal'); f.payments.clear(); let creates = 0;
  await withFetch(async (url, options) => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    assert.ok(url.endsWith('/v2/checkout/orders')); creates++;
    const data = JSON.parse(options.body);
    assert.equal(data.payment_source.paypal.experience_context.landing_page, 'LOGIN');
    assert.equal(data.payment_source.paypal.experience_context.user_action, 'PAY_NOW');
    assert.equal(data.payment_source.paypal.experience_context.shipping_preference, 'NO_SHIPPING');
    assert.equal(data.purchase_units[0].custom_id, [...f.payments.values()][0].id);
    return { id: 'order-login', links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=order-login' }] };
  }, async () => {
    const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
    const urls = await Promise.all([prepareExternalCheckout('event-fixture', f.ownerId, 'paypal'), prepareExternalCheckout('event-fixture', f.ownerId, 'paypal')]);
    assert.equal(urls[0], urls[1]); assert.equal(creates, 1); assert.equal(f.payments.size, 1);
    assert.equal([...f.payments.values()][0].providerCheckoutId, 'paypal:order-login');
    assert.equal(f.events.get('event-fixture').paidAt, null);
  });
});

test('a second external charge cannot extend the first purchase', async () => {
  const f = external('mercadopago');
  Object.assign(f.events.get('event-fixture'), { paidAt: new Date('2026-10-01'), expiresAt: new Date('2027-10-01'), stripePaymentIntentId: 'pi_original', status: 'PUBLISHED' });
  await withFetch(async () => ({ results: [{ id: 'charge', external_reference: 'payment-fixture', live_mode: false, currency_id: 'MXN', transaction_amount: 499, status: 'approved', date_approved: '2026-11-11T12:00:00Z' }] }), async () => {
    await f.reconcile('payment-fixture');
    assert.equal(f.payments.get('payment-fixture').status, 'PAID');
    assert.equal(f.events.get('event-fixture').stripePaymentIntentId, 'pi_original');
    assert.equal(f.events.get('event-fixture').expiresAt.toISOString(), '2027-10-01T00:00:00.000Z');
  });
});

test('OXXO options survive a lost response and configuration changes; voucher is not settlement', async () => {
  const f = createPaymentFixture(); f.events.set('event-fixture', { ...f.eventDetails, id: 'event-fixture', ownerId: f.ownerId, name: 'Fiesta', paidAt: null, privacy: 'PUBLIC' });
  process.env.STRIPE_OXXO_ENABLED = 'true'; f.loseCreateResponse = true;
  try {
    await assert.rejects(f.checkout.prepareInvitationCheckout('event-fixture', f.ownerId));
    process.env.STRIPE_OXXO_ENABLED = 'false';
    await f.checkout.prepareInvitationCheckout('event-fixture', f.ownerId);
    const creates = f.calls.filter(row => row[0] === 'create');
    assert.deepEqual(creates[0][1], creates[1][1]);
    assert.deepEqual(creates[1][1].allowed_payment_method_types, ['card', 'oxxo']);
    const checkout = [...f.sessions.values()][0]; checkout.status = 'complete'; checkout.payment_intent = 'pi_oxxo';
    f.intents.set('pi_oxxo', { id: 'pi_oxxo', status: 'requires_action' });
    await f.fulfillment.fulfillInvitationPayment(checkout);
    assert.equal(f.events.get('event-fixture').paidAt, null);
    assert.equal([...f.payments.values()][0].status, 'PENDING');
  } finally { delete process.env.STRIPE_OXXO_ENABLED; }
});
