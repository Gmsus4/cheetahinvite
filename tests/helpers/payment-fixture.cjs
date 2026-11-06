/* eslint-disable @typescript-eslint/no-require-imports -- Isolated payment integration loader. */
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const { randomUUID } = require('node:crypto');
const Stripe = require('stripe');
const assert = require('node:assert/strict');

function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => key === 'OR' ? value.some(w => matches(row, w))
    : value && typeof value === 'object' && !(value instanceof Date) ? !value.notIn?.includes(row[key])
    : row[key] === value);
}
function createPaymentFixture(options = {}) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fixture'; process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fixture'; process.env.APP_URL = 'http://localhost:3000';
  const f = { ownerId: options.ownerId ?? 'owner-fixture', payments: new Map(), events: new Map(), links: new Map(), calls: [], invalidations: [], refunds: [], disputes: [], sessions: new Map(), intents: new Map() };
  f.eventDetails = { eventType: 'wedding', templateId: 'celebration-v1', hostNames: 'Alex y Sam', eventDate: new Date('2027-01-15T12:00:00Z'), eventTime: '18:00', venue: 'Salón', address: 'Calle', sections: [] };
  function table(rows, defaults = {}) {
    return {
      async findUnique({ where }) { return this.findFirst({ where }); },
      async findFirst({ where }) { if (f.databaseFailure) throw Error('Temporary database failure'); return structuredClone([...rows.values()].find(row => matches(row, where)) ?? null); },
      async create({ data }) { const row = { id: randomUUID(), paidAt: null, expiresAt: null, status: 'PENDING', stripeCheckoutSessionId: null, stripePaymentIntentId: null, refundedAmount: 0, refundPendingAmount: 0, disputeStatus: null, lastSyncedAt: null, ...defaults, ...data }; rows.set(row.id, row); return structuredClone(row); },
      async update({ where, data }) { const row = [...rows.values()].find(row => matches(row, where)); assert.ok(row); Object.assign(row, data); return structuredClone(row); },
      async updateMany({ where, data }) { const rowsToChange = [...rows.values()].filter(row => matches(row, where)); rowsToChange.forEach(row => Object.assign(row, data)); return { count: rowsToChange.length }; },
    };
  }
  let tail = Promise.resolve();
  f.prisma = options.prisma ?? {
    invitationPayment: table(f.payments), event: table(f.events),
    invitationLink: {
      async createMany({ data }) { for (const row of data) if (!f.links.has(row.path)) f.links.set(row.path, structuredClone(row)); },
      async findUnique({ where }) { return structuredClone(f.links.get(where.path) ?? null); },
    },
    async $queryRaw() {},
    async $transaction(work) {
      const previous = tail; let unlock; tail = new Promise(resolve => { unlock = resolve; }); await previous;
      const snapshot = structuredClone({ payments: f.payments, events: f.events, links: f.links });
      try { return await work(f.prisma); }
      catch (error) { f.payments.clear(); f.events.clear(); f.links.clear(); snapshot.links.forEach((v, k) => f.links.set(k, v)); snapshot.payments.forEach((v, k) => f.payments.set(k, v)); snapshot.events.forEach((v, k) => f.events.set(k, v)); throw error; }
      finally { unlock(); }
    },
  };
  f.stripe = new Stripe('sk_test_fixture');
  const idempotent = new Map();
  f.stripe.checkout.sessions.retrieve = async id => { f.calls.push(['session', id]); if (f.apiFailure) throw Error('Stripe unavailable'); assert.ok(f.sessions.has(id), 'Unknown session'); return structuredClone(f.sessions.get(id)); };
  f.stripe.checkout.sessions.list = async ({ payment_intent }) => ({ data: structuredClone([...f.sessions.values()].filter(s => s.payment_intent === payment_intent)) });
  f.stripe.checkout.sessions.expire = async id => {
    f.calls.push(['expire', id]);
    const session = f.sessions.get(id); assert.ok(session);
    if (f.payDuringExpiry) { session.status = 'complete'; session.payment_status = 'paid'; throw Error('Checkout already complete'); }
    if (f.expireFailure) throw Error('Expiry failed');
    session.status = 'expired'; return structuredClone(session);
  };
  f.stripe.checkout.sessions.create = async (data, opts) => {
    f.calls.push(['create', data, opts]);
    if (!idempotent.has(opts.idempotencyKey)) {
      const id = `cs_${randomUUID()}`;
      const session = { ...data, id, status: 'open', livemode: false, payment_status: 'unpaid', amount_total: data.line_items[0].price_data.unit_amount, currency: data.line_items[0].price_data.currency, url: `https://checkout.stripe.com/${id}` };
      f.sessions.set(id, session); idempotent.set(opts.idempotencyKey, session);
    }
    if (f.loseCreateResponse) { f.loseCreateResponse = false; throw Error('Response lost'); }
    return structuredClone(idempotent.get(opts.idempotencyKey));
  };
  f.stripe.paymentIntents.retrieve = async id => { f.calls.push(['intent', id]); assert.ok(f.intents.has(id), 'Unknown intent'); return structuredClone(f.intents.get(id)); };
  f.stripe.refunds.list = async function* () { for (const row of f.refunds) yield structuredClone(row); };
  f.stripe.disputes.list = async function* () { for (const row of f.disputes) yield structuredClone(row); };
  const cache = new Map();
  f.load = function load(file) {
    const absolute = path.resolve(file); if (cache.has(absolute)) return cache.get(absolute).exports;
    const mod = { exports: {} }; cache.set(absolute, mod);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    function requireMock(name) {
      if (name === 'server-only') return {};
      if (name === 'next/cache') return { revalidatePath: value => f.invalidations.push(value) };
      if (name === 'next/navigation') return { redirect: url => { throw Object.assign(Error('redirect'), { url }); } };
      if (name === '@/auth') return { auth: async () => f.ownerId ? { user: { id: f.ownerId } } : null };
      if (name === '@/prisma') return { prisma: f.prisma };
      if (name === '@/generated/prisma/client') return { Prisma: options.Prisma ?? { sql: (strings, ...values) => ({ strings, values }) } };
      if (name === '@/lib/stripe') return { getStripe: () => f.stripe, stripeIsConfigured: () => true };
      if (name.startsWith('@/')) return load(path.resolve(name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), name) + '.ts');
      return require(name);
    }
    new Function('require', 'module', 'exports', code)(requireMock, mod, mod.exports); return mod.exports;
  };
  f.addPurchase = (overrides = {}) => {
    const payment = { id: 'payment-fixture', eventId: 'event-fixture', ownerId: f.ownerId, eventName: 'Celebración', amount: 49900, currency: 'mxn', status: 'PENDING', livemode: false, stripeCheckoutSessionId: 'cs_fixture', stripePaymentIntentId: null, paidAt: null, expiresAt: null, refundedAmount: 0, refundPendingAmount: 0, disputeStatus: null, checkoutExpiresAt: new Date(Date.now() + 3600000), ...overrides };
    f.payments.set(payment.id, payment);
    f.events.set(payment.eventId, { ...f.eventDetails, id: payment.eventId, ownerId: payment.ownerId, name: payment.eventName, paidAt: null, slug: null, status: 'PENDING_PAYMENT', stripePaymentIntentId: null });
    const session = { id: payment.stripeCheckoutSessionId, mode: 'payment', status: 'complete', payment_status: 'paid', amount_total: payment.amount, currency: payment.currency, livemode: false, client_reference_id: payment.eventId, payment_intent: 'pi_fixture', metadata: { eventId: payment.eventId, ownerId: payment.ownerId, paymentId: payment.id, product: 'invitation-12-months' } };
    f.sessions.set(session.id, session);
    f.intents.set('pi_fixture', { id: 'pi_fixture', livemode: false, status: 'succeeded', amount_received: payment.amount, currency: payment.currency, latest_charge: { id: 'ch_fixture', paid: true, captured: true, created: Math.floor(Date.now() / 1000), amount: payment.amount, currency: payment.currency, payment_intent: 'pi_fixture' } });
    return { payment, session };
  };
  f.webhook = async (type, object, overrides = {}) => {
    const payload = JSON.stringify({ id: 'evt_fixture', type, created: Math.floor(Date.now() / 1000), livemode: false, data: { object }, ...overrides });
    const signature = f.stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_fixture' });
    return f.load('app/api/stripe/webhook/route.ts').POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': signature } }));
  };
  f.fulfillment = f.load('lib/payment-fulfillment.ts');
  f.checkout = f.load('lib/payment-checkout.ts');
  return f;
}
module.exports = { createPaymentFixture };
