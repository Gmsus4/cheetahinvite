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

function mpOrder(status = 'processed', status_detail = 'accredited') {
  return {
    id: 'ORDTST01FIXTURE', type: 'online', processing_mode: 'manual', external_reference: 'payment-fixture',
    status, status_detail, total_amount: '499.00', total_paid_amount: status === 'created' ? '0.00' : '499.00', currency: 'MXN',
    created_date: '2026-11-11T12:00:00Z', transactions: {
      payments: status === 'created' ? [] : [{ id: 'PAY01FIXTURE', amount: '499.00', paid_amount: '499.00', status, status_detail }], refunds: [], chargebacks: [],
    },
  };
}
function mpOrderFixture() {
  const f = external('mercadopago'); f.payments.get('payment-fixture').providerCheckoutId = 'mercadopago:ORDTST01FIXTURE'; return f;
}
function mpWebhook(f, id = 'ORDTST01FIXTURE', type = 'order') {
  Object.assign(process.env, { MERCADOPAGO_ACCESS_TOKEN: 'token', MERCADOPAGO_WEBHOOK_SECRET: 'secret' });
  const v1 = createHmac('sha256', 'secret').update(`id:${id.toLowerCase()};request-id:request;ts:12345;`).digest('hex');
  return f.load('app/api/mercadopago/webhook/route.ts').POST(new Request(`https://example.com/api/mercadopago/webhook?data.id=${id}&type=${type}`, {
    method: 'POST', headers: { 'x-request-id': 'request', 'x-signature': `ts=12345,v1=${v1}` },
    body: JSON.stringify({ type, data: { id }, action: 'order.processed' }),
  }));
}

test('Mercado Pago Orders webhook verifies settlement, deduplicates and freezes the purchase term', async () => {
  const f = mpOrderFixture(); const remote = mpOrder();
  await withFetch(async url => { assert.ok(url.endsWith('/v1/orders/ORDTST01FIXTURE')); return remote; }, async () => {
    assert.equal((await mpWebhook(f)).status, 200);
    const paid = structuredClone(f.payments.get('payment-fixture'));
    assert.equal(paid.providerPaymentId, 'mercadopago:PAY01FIXTURE');
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    remote.last_updated_date = '2026-11-13T12:00:00Z';
    assert.equal((await mpWebhook(f, remote.id, 'orders_v2')).status, 200);
    assert.equal(f.payments.get('payment-fixture').expiresAt.getTime(), paid.expiresAt.getTime());
  });
});

test('Mercado Pago Orders never publish processing, authorized, failed or unpaid orders', async () => {
  for (const status of ['created', 'processing', 'action_required', 'failed', 'canceled']) {
    const f = mpOrderFixture(); const remote = mpOrder(status, status === 'action_required' ? 'waiting_capture' : status);
    f.payments.get('payment-fixture').checkoutExpiresAt = new Date(0);
    await withFetch(async () => remote, async () => {
      await f.reconcile('payment-fixture');
      assert.equal(f.events.get('event-fixture').paidAt, null);
      assert.equal(f.payments.get('payment-fixture').status, ['failed', 'canceled'].includes(status) ? 'FAILED' : 'PENDING');
    });
  }
});

test('Mercado Pago Orders validates the stored order, reference, amount, currency and environment', async () => {
  for (const mismatch of [
    { id: 'ORDTSTOTHER' }, { external_reference: 'foreign' }, { total_amount: '1.00' }, { total_paid_amount: '1.00' },
    { currency: 'USD' }, { live_mode: true }, { type: 'point' }, { processing_mode: 'automatic' },
    { transactions: { payments: [{ id: 'PAYOTHER', status: 'processed', amount: '1.00' }] } },
    { transactions: { payments: [{ id: 'PAYOTHER', status: 'processed', amount: '499.00', paid_amount: '1.00' }] } },
  ]) {
    const f = mpOrderFixture();
    await withFetch(async () => ({ ...mpOrder(), ...mismatch }), async () => {
      await assert.rejects(f.reconcile('payment-fixture'));
      assert.equal(f.events.get('event-fixture').paidAt, null);
    });
  }
});

test('Mercado Pago Orders reconciles pending, partial and full refunds from current API state', async () => {
  const f = mpOrderFixture(); const remote = mpOrder();
  await withFetch(async () => remote, async () => {
    await f.reconcile('payment-fixture'); const expiry = f.payments.get('payment-fixture').expiresAt.getTime();
    const refund = { id: 'REF01FIXTURE', transaction_id: 'PAY01FIXTURE', amount: '100.00', status: 'processing' };
    remote.transactions.refunds.push(refund);
    await f.reconcile('payment-fixture');
    assert.equal(f.payments.get('payment-fixture').refundPendingAmount, 10000);
    refund.status = 'processed'; remote.status_detail = 'partially_refunded';
    await f.reconcile('payment-fixture');
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 10000);
    assert.equal(f.payments.get('payment-fixture').refundPendingAmount, 0);
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
    refund.amount = '499.00'; remote.status = 'refunded';
    assert.equal((await mpWebhook(f)).status, 200);
    assert.equal(f.events.get('event-fixture').status, 'REFUNDED');
    assert.equal(f.payments.get('payment-fixture').expiresAt.getTime(), expiry);
    refund.transaction_id = 'PAYFOREIGN';
    assert.equal((await mpWebhook(f)).status, 500);
    assert.equal(f.payments.get('payment-fixture').refundedAmount, 49900);
  });
});

test('Mercado Pago Orders chargeback suspends access and a fresh resolved order can restore it', async () => {
  const f = mpOrderFixture(); const remote = mpOrder();
  await withFetch(async () => remote, async () => {
    await f.reconcile('payment-fixture');
    remote.status = 'charged_back'; remote.transactions.payments[0].status = 'charged_back';
    remote.transactions.chargebacks.push({ id: 'CBK01FIXTURE', transaction_id: 'PAY01FIXTURE', status: 'settled' });
    await f.reconcile('payment-fixture');
    assert.equal(f.payments.get('payment-fixture').disputeStatus, 'lost');
    assert.equal(f.events.get('event-fixture').status, 'SUSPENDED');
    remote.status = 'processed'; remote.transactions.payments[0].status = 'processed'; remote.transactions.chargebacks = [];
    await f.reconcile('payment-fixture');
    assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
  });
});

test('Mercado Pago Orders notification cannot reconcile a foreign checkout', async () => {
  const f = mpOrderFixture(); const remote = { ...mpOrder(), id: 'ORDTSTOTHER' };
  await withFetch(async () => remote, async () => {
    assert.equal((await mpWebhook(f, remote.id)).status, 500);
    assert.equal(f.events.get('event-fixture').paidAt, null);
  });
});

test('Mercado Pago cancels and verifies an unpaid Order before replacing its return URL', async () => {
  const f = mpOrderFixture(); const old = f.payments.get('payment-fixture');
  Object.assign(old, { checkoutUrl: 'https://www.mercadopago.com.mx/checkout/old', checkoutOrigin: 'http://localhost:3000' });
  process.env.APP_URL = 'https://cheetahinvite.vercel.app';
  const remote = mpOrder('created', 'created'); const calls = [];
  await withFetch(async (url, options) => {
    calls.push(options.method);
    if (url.endsWith('/cancel')) {
      assert.match(options.headers['X-Idempotency-Key'], /^[0-9a-f-]{36}$/);
      remote.status = 'canceled'; return remote;
    }
    if (options.method === 'GET') return remote;
    assert.ok(url.endsWith('/v1/orders'));
    const body = JSON.parse(options.body);
    assert.equal(new URL(body.config.online.success_url).origin, process.env.APP_URL);
    return { ...mpOrder('created', 'created'), id: 'ORDTSTNEW', external_reference: body.external_reference, total_amount: body.total_amount, checkout_url: 'https://www.mercadopago.com.mx/checkout/new' };
  }, async () => {
    const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
    assert.equal(await prepareExternalCheckout('event-fixture', f.ownerId, 'mercadopago'), 'https://www.mercadopago.com.mx/checkout/new');
    assert.deepEqual(calls, ['GET', 'POST', 'GET', 'POST']);
    assert.equal(f.payments.get(old.id).status, 'EXPIRED');
  });
});

test('Mercado Pago cannot replace an Order while payment is processing or cancellation loses a race', async () => {
  for (const initial of ['created', 'processing', 'processed']) {
    const f = mpOrderFixture();
    Object.assign(f.payments.get('payment-fixture'), { checkoutUrl: 'https://www.mercadopago.com.mx/checkout/old', checkoutOrigin: 'http://localhost:3000' });
    process.env.APP_URL = 'https://cheetahinvite.vercel.app';
    const remote = mpOrder(initial, initial === 'processed' ? 'accredited' : initial);
    await withFetch(async (url, options) => {
      if (options.method === 'POST') { assert.ok(url.endsWith('/cancel')); Object.assign(remote, mpOrder()); }
      return remote;
    }, async () => {
      const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
      assert.equal(await prepareExternalCheckout('event-fixture', f.ownerId, 'mercadopago'), '/dashboard/eventos/event-fixture/pago?payment=received');
      assert.equal(f.payments.size, 1);
    });
  }
});

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

test('Mercado Pago APP_USR sandbox payments require the authenticated test collector when live_mode is true', async () => {
  for (const seller of [{ id: 123, tags: ['test_user'] }, { id: 123, tags: ['normal'] }, { id: 999, tags: ['test_user'] }, {}]) {
    const f = external('mercadopago');
    const remote = { id: 'charge', collector_id: 123, external_reference: 'payment-fixture', live_mode: true, currency_id: 'MXN', transaction_amount: 499, status: 'approved', date_approved: '2026-11-11T12:00:00Z' };
    await withFetch(async url => url.endsWith('/users/me') ? seller : { results: [remote] }, async () => {
      if (seller.id === 123 && seller.tags.includes('test_user')) {
        await f.reconcile('payment-fixture');
        assert.equal(f.events.get('event-fixture').status, 'PUBLISHED');
        assert.equal(f.payments.get('payment-fixture').livemode, false);
      } else {
        await assert.rejects(f.reconcile('payment-fixture'), /purchase mismatch/);
        assert.equal(f.events.get('event-fixture').paidAt, null);
      }
    });
  }
});

test('Mercado Pago environment exception fails closed when collector lookup is unavailable or absent', async () => {
  for (const collector_id of [123, undefined]) {
    const f = external('mercadopago');
    const remote = { id: 'charge', collector_id, external_reference: 'payment-fixture', live_mode: true, currency_id: 'MXN', transaction_amount: 499, status: 'approved', date_approved: '2026-11-11T12:00:00Z' };
    await withFetch(async url => { if (url.endsWith('/users/me')) throw Error('Unavailable'); return { results: [remote] }; }, async () => {
      await assert.rejects(f.reconcile('payment-fixture'));
      assert.equal(f.events.get('event-fixture').paidAt, null);
    });
  }
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
    assert.ok(url.endsWith('/v1/orders')); creates++;
    const data = JSON.parse(options.body);
    assert.equal(data.type, 'online'); assert.equal(data.processing_mode, 'manual');
    assert.equal(data.capture_mode, 'automatic'); assert.equal(data.items[0].unit_price, data.total_amount);
    assert.equal(options.headers['X-Idempotency-Key'], data.external_reference);
    assert.deepEqual(data.config.payment_method.not_allowed_types, ['ticket', 'atm']);
    assert.equal(data.config.online.retries.allowed, false); assert.equal(data.payer, undefined);
    assert.match(data.expiration_time, /^PT\d+S$/);
    return { ...mpOrder('created'), external_reference: data.external_reference, total_amount: data.total_amount, checkout_url: 'https://www.mercadopago.com.mx/checkout/fixture' };
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

test('PayPal replaces an unpaid localhost order before returning a link from the public site', async () => {
  const f = external('paypal');
  const old = f.payments.get('payment-fixture');
  old.checkoutUrl = 'https://www.sandbox.paypal.com/checkoutnow?token=order';
  old.checkoutOrigin = 'http://localhost:3000';
  process.env.APP_URL = 'https://cheetahinvite.vercel.app';
  let creates = 0;
  await withFetch(async (url, options) => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    if (url.endsWith('/orders/order')) return paypalOrder('PAYER_ACTION_REQUIRED');
    assert.ok(url.endsWith('/v2/checkout/orders')); creates++;
    const data = JSON.parse(options.body);
    const context = data.payment_source.paypal.experience_context;
    assert.equal(new URL(context.return_url).origin, process.env.APP_URL);
    assert.equal(new URL(context.cancel_url).origin, process.env.APP_URL);
    return { id: 'public-order', links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=public-order' }] };
  }, async () => {
    const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
    const url = await prepareExternalCheckout('event-fixture', f.ownerId, 'paypal');
    assert.ok(url.includes('public-order'));
    assert.equal(f.payments.get('payment-fixture').status, 'EXPIRED');
    assert.ok(f.payments.get('payment-fixture').checkoutExpiresAt <= new Date());
    const reserved = [...f.payments.values()].find(row => row.id !== old.id);
    assert.equal(reserved.checkoutOrigin, process.env.APP_URL);
    assert.equal(await prepareExternalCheckout('event-fixture', f.ownerId, 'paypal'), url);
    assert.equal(creates, 1);
  });
});

test('an approved order from another origin is reconciled before opening any new payment', async () => {
  const f = external('paypal');
  Object.assign(f.payments.get('payment-fixture'), { checkoutUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=order', checkoutOrigin: null });
  process.env.APP_URL = 'https://cheetahinvite.vercel.app';
  await withFetch(async url => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    assert.ok(url.endsWith('/orders/order'));
    return paypalOrder('APPROVED');
  }, async () => {
    const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
    assert.equal(await prepareExternalCheckout('event-fixture', f.ownerId, 'paypal'), '/dashboard/eventos/event-fixture/pago?payment=received');
    assert.equal(f.payments.size, 1);
    assert.equal(f.payments.get('payment-fixture').status, 'PENDING');
  });
});

test('retired PayPal return URLs cannot capture a later approval', async () => {
  const f = external('paypal'); let captureAttempts = 0;
  Object.assign(f.payments.get('payment-fixture'), { status: 'EXPIRED', checkoutExpiresAt: new Date(0) });
  await withFetch(async url => {
    if (url.endsWith('/token')) return { access_token: 'fixture' };
    if (url.endsWith('/orders/order')) return paypalOrder('APPROVED');
    captureAttempts++; throw Error('Must not capture retired order');
  }, async () => {
    await f.reconcile('payment-fixture');
    assert.equal(captureAttempts, 0);
    assert.equal(f.events.get('event-fixture').paidAt, null);
  });
});

test('Vercel refuses localhost payment return URLs before creating an order', async () => {
  const f = external('paypal'); f.payments.clear();
  const previous = process.env.VERCEL; process.env.VERCEL = '1';
  try {
    await withFetch(async () => { throw Error('No provider request expected'); }, async () => {
      const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
      await assert.rejects(prepareExternalCheckout('event-fixture', f.ownerId, 'paypal'), /public HTTPS origin/);
      assert.equal(f.payments.size, 0);
    });
  } finally { if (previous === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous; }
});

test('Mercado Pago expires an unpaid preference before replacing its return origin', async () => {
  const f = external('mercadopago');
  Object.assign(f.payments.get('payment-fixture'), { checkoutUrl: 'https://sandbox.mercadopago.com.mx/checkout/old', checkoutOrigin: 'http://localhost:3000' });
  process.env.APP_URL = 'https://cheetahinvite.vercel.app';
  const calls = [];
  await withFetch(async (url, options) => {
    calls.push(options.method);
    if (url.includes('/payments/search?')) return { results: [] };
    const body = JSON.parse(options.body);
    if (options.method === 'PUT') return { expires: true, expiration_date_to: body.expiration_date_to };
    assert.equal(new URL(body.config.online.success_url).origin, process.env.APP_URL);
    return { ...mpOrder('created'), external_reference: body.external_reference, total_amount: body.total_amount, checkout_url: 'https://www.mercadopago.com.mx/checkout/new' };
  }, async () => {
    const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
    assert.equal(await prepareExternalCheckout('event-fixture', f.ownerId, 'mercadopago'), 'https://www.mercadopago.com.mx/checkout/new');
    assert.deepEqual(calls, ['GET', 'PUT', 'GET', 'POST']);
    assert.equal(f.payments.get('payment-fixture').status, 'EXPIRED');
  });
});

test('a Mercado Pago payment in progress keeps the previous preference and cannot open a second charge', async () => {
  const f = external('mercadopago');
  Object.assign(f.payments.get('payment-fixture'), { checkoutUrl: 'https://sandbox.mercadopago.com.mx/checkout/old', checkoutOrigin: 'http://localhost:3000' });
  process.env.APP_URL = 'https://cheetahinvite.vercel.app';
  await withFetch(async (url, options) => {
    assert.ok(url.includes('/payments/search?')); assert.equal(options.method, 'GET');
    return { results: [{ status: 'in_process' }] };
  }, async () => {
    const { prepareExternalCheckout } = f.load('lib/external-payment-checkout.ts');
    assert.equal(await prepareExternalCheckout('event-fixture', f.ownerId, 'mercadopago'), '/dashboard/eventos/event-fixture/pago?payment=received');
    assert.equal(f.payments.size, 1);
    assert.equal(f.payments.get('payment-fixture').status, 'PENDING');
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
