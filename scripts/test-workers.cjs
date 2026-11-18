/* eslint-disable @typescript-eslint/no-require-imports -- Run the built Worker against disposable PostgreSQL/local R2. */
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { Client } = require('pg');

async function main() {
  const database = new URL(process.env.TEST_DATABASE_URL || 'http://missing');
  if (!['127.0.0.1', 'localhost'].includes(database.hostname) || database.pathname !== '/cheetahinvite_test') {
    throw Error('Use node scripts/test-postgres.cjs --workers: a disposable local database is required');
  }
  const { unstable_dev } = await import('wrangler');
  const secret = randomBytes(32).toString('hex');
  const port = await new Promise(resolve => { const server = require('node:net').createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
  const origin = 'http://localhost:' + port;
  const worker = await unstable_dev('worker.ts', { config: 'wrangler.jsonc', local: true, ip: '127.0.0.1', port,
    persist: false, vars: { APP_URL: origin, AUTH_URL: origin, APP_ENV: 'local', AUTH_TRUST_HOST: 'true',
      AUTH_SECRET: secret, DATABASE_URL: database.href, CRON_SECRET: secret, STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture' },
    experimental: { disableExperimentalWarning: true } });
  const sql = new Client({ connectionString: database.href }); await sql.connect();
  const cookies = new Map();
  async function request(path, init = {}) {
    const response = await worker.fetch(origin + path, { ...init, redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: {
      origin: origin, cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), ...init.headers,
    } });
    for (const header of response.headers.getSetCookie()) { const [pair] = header.split(';'); const index = pair.indexOf('='); cookies.set(pair.slice(0, index), pair.slice(index + 1)); }
    return response;
  }
  try {
    for (const path of ['/login', '/api/auth/providers', '/api/auth/session']) assert.equal((await request(path)).status, 200, path);
    const email = `worker-${randomUUID()}@example.invalid`, password = 'Local-only-passphrase-123';
    const registration = await request('/api/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Worker fixture', email, password }) });
    assert.equal(registration.status, 201, await registration.text());
    const { csrfToken } = await (await request('/api/auth/csrf')).json();
    await request('/api/auth/callback/credentials', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ csrfToken, email, password, callbackUrl: origin + '/dashboard' }).toString() });
    const session = await (await request('/api/auth/session')).json(); assert.equal(session.user.email, email);
    // Two separate requests prove Prisma does not reuse sockets from a prior request.
    assert.equal((await (await request('/api/auth/session')).json()).user.id, session.user.id);
    const concurrentSessions = await Promise.all(Array.from({ length: 4 }, async () => (await (await request('/api/auth/session')).json()).user.id));
    assert.ok(concurrentSessions.every(id => id === session.user.id));
    const eventId = 'worker-' + randomUUID();
    await sql.query('INSERT INTO "Event" ("id", "ownerId", "name", "eventType", "updatedAt") VALUES ($1,$2,$3,$4,NOW())', [eventId, session.user.id, 'Worker image fixture', 'other']);
    const grantResponse = await request('/api/images/upload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId, contentType: 'image/png', size: 100 }) });
    assert.equal(grantResponse.status, 200, await grantResponse.clone().text());
    const { publicId } = await grantResponse.json();
    // Local Images emulation may be unavailable. Malformed bytes must fail closed
    // and leave no delivered object, even when all client metadata appears valid.
    const invalid = await request('/api/images/upload?' + new URLSearchParams({ eventId, publicId }), { method: 'PUT', headers: { 'content-type': 'image/png' }, body: 'not an image' });
    assert.ok([400, 503].includes(invalid.status));
    assert.equal((await request('/api/media/' + publicId)).status, 404);
    const png = await require('sharp')({ create: { width: 16, height: 16, channels: 3, background: '#ef7500' } }).png().toBuffer();
    const uploaded = await request('/api/images/upload?' + new URLSearchParams({ eventId, publicId }), { method: 'PUT', headers: { 'content-type': 'image/png' }, body: png });
    assert.equal(uploaded.status, 200, await uploaded.clone().text());
    const { secureUrl } = await uploaded.json();
    const delivered = await request(new URL(secureUrl).pathname); assert.equal(delivered.status, 200);
    assert.equal(delivered.headers.get('content-type'), 'image/webp'); assert.ok((await delivered.arrayBuffer()).byteLength > 0);
    // Verify PIN hashing, secure access cookies and public HTML on workerd too.
    const salt = randomBytes(16).toString('hex');
    const pinHash = salt + ':' + require('node:crypto').scryptSync('001234', salt, 32).toString('hex');
    await sql.query('UPDATE "Event" SET "privacy"=\'PRIVATE\', "pinHash"=$2, "status"=\'PUBLISHED\', "paidAt"=NOW(), "expiresAt"=NOW()+INTERVAL \'1 day\', "slug"=$1 WHERE "id"=$1', [eventId, pinHash]);
    await sql.query('INSERT INTO "InvitationLink" ("path", "eventId") VALUES ($1,$2)', ['/event/' + eventId, eventId]);
    const locked = await (await request('/event/' + eventId)).text(); assert.match(locked, /celebración privada/i); assert.doesNotMatch(locked, /Worker image fixture/);
    const unlock = pin => request('/api/invitations/' + eventId + '/unlock', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1' }, body: JSON.stringify({ pin }) });
    assert.equal((await unlock('999999')).status, 401); assert.equal((await unlock('001234')).status, 200);
    assert.match(await (await request('/event/' + eventId)).text(), /Worker image fixture/);
    const stripe = new (require('stripe'))('sk_test_fixture');
    const payload = JSON.stringify({ id: 'evt_fixture', type: 'fixture.ignored', livemode: false, data: { object: {} } });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_fixture' });
    assert.equal((await request('/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body: payload })).status, 200);
    assert.equal((await request('/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 'forged' }, body: payload })).status, 400);
    assert.equal((await request('/api/internal/images/cleanup')).status, 401);
    assert.equal((await request('/api/internal/images/cleanup', { headers: { authorization: `Bearer ${secret}` } })).status, 200);
    await sql.query('UPDATE "User" SET "sessionVersion"="sessionVersion"+1 WHERE "id"=$1', [session.user.id]);
    assert.equal((await (await request('/api/auth/session')).json())?.user, undefined);
    console.log('Workers integration passed: registration/scrypt, Auth.js sessions across requests, Prisma/PostgreSQL, R2 upload/delivery, image validation, private invitations/PIN cookies, signed Stripe webhook and cleanup.');
  } finally { await sql.end(); await worker.stop(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
