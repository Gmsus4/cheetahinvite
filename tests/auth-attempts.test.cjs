/* eslint-disable @typescript-eslint/no-require-imports -- Security regression tests against real admission code and handlers. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createAuthFixture } = require('./helpers/auth-attempts-fixture.cjs');
const payload = email => ({ name: 'Test user', email, password: 'registration-password' });
const limited = error => error.code === 'too_many_attempts';
beforeEach(() => { process.env.AUTH_SECRET = 'auth-attempts-fixture-secret'; });

test('registration IP budget limits distinct accounts before hashing or creating users', async () => {
  const f = createAuthFixture();
  for (let i = 0; i < 5; i++) assert.equal((await f.register(f.request(payload(`user${i}@example.invalid`)))).status, 201);
  const blocked = await f.register(f.request(payload('extra@example.invalid')));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('Cache-Control'), 'no-store');
  assert.ok(Number(blocked.headers.get('Retry-After')) > 0);
  assert.ok(Number(blocked.headers.get('Retry-After')) <= 3600);
  assert.equal(f.hashes, 5); assert.equal(f.creates, 5);
  // A newly loaded handler/limiter using the same database cannot reset the budget.
  const restarted = createAuthFixture({ prisma: f.prisma, now: f.now });
  assert.equal((await restarted.register(restarted.request(payload('restart@example.invalid')))).status, 429);
});

test('registration email budget normalizes addresses and survives IP rotation and duplicate failures', async () => {
  const f = createAuthFixture();
  for (let i = 1; i <= 3; i++) {
    assert.equal((await f.register(f.request(payload(' USER@EXAMPLE.INVALID '), `192.0.2.${i}`))).status, i === 1 ? 201 : 409);
  }
  assert.equal((await f.register(f.request(payload('user@example.invalid'), '192.0.2.4'))).status, 429);
  assert.equal(f.hashes, 3); assert.equal(f.creates, 3);
  assert.ok([...f.budgets.keys()].every(key => !key.includes('example.invalid') && !key.includes('192.0.2')));
});

test('invalid registration bodies consume the IP budget without hashing', async () => {
  const f = createAuthFixture();
  for (const body of [null, [], 'invalid', { name: 'x' }]) assert.equal((await f.register(f.request(body))).status, 400);
  assert.equal((await f.register(new Request('https://site.test', { method: 'POST', headers: { 'cf-connecting-ip': '192.0.2.1' }, body: '{' }))).status, 400);
  assert.equal((await f.register(f.request(payload('valid@example.invalid')))).status, 429);
  assert.equal(f.hashes, 0);
});

test('login email budget applies equally to existing, unknown and Google accounts across IPs', async () => {
  for (const kind of ['password', 'unknown', 'google']) {
    const f = createAuthFixture();
    if (kind !== 'unknown') f.users.set('user@example.invalid', { id: 'user', passwordHash: kind === 'password' ? 'hash' : null });
    for (let i = 1; i <= 10; i++) assert.equal(await f.login(' USER@EXAMPLE.INVALID ', 'wrong-password', `192.0.2.${i}`), null);
    const before = { lookups: f.lookups, verifications: f.verifications };
    await assert.rejects(f.login('user@example.invalid', 'correct-password', '192.0.2.11'), limited);
    assert.deepEqual({ lookups: f.lookups, verifications: f.verifications }, before);
    assert.equal(f.lookups, 10);
  }
});

test('login IP budget stops password spraying and malformed credential requests', async () => {
  const f = createAuthFixture();
  for (let i = 0; i < 30; i++) assert.equal(await f.login(`user${i}@example.invalid`), null);
  await assert.rejects(f.login('another@example.invalid'), limited);
  assert.equal(f.lookups, 30);
  const invalid = createAuthFixture();
  for (let i = 0; i < 30; i++) assert.equal(await invalid.config.providers[1].authorize({ email: 123 }, invalid.request({})), null);
  await assert.rejects(invalid.login(), limited);
  assert.equal(invalid.lookups, 0);
});

test('concurrent logins admit only the remaining email budget and success does not clear counters', async () => {
  const f = createAuthFixture();
  f.users.set('user@example.invalid', { id: 'user', name: 'User', email: 'user@example.invalid', passwordHash: 'hash', sessionVersion: 7 });
  assert.equal((await f.login('user@example.invalid', 'correct-password')).sessionVersion, 7);
  for (let i = 0; i < 8; i++) await f.login();
  const results = await Promise.allSettled([f.login(), f.login()]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 'too_many_attempts');
  assert.equal(f.verifications, 10);
});

test('IP limits ignore forwarded headers and share a fallback when the edge address is missing or invalid', async () => {
  const f = createAuthFixture();
  for (let i = 0; i < 5; i++) {
    assert.equal((await f.register(f.request(payload(`user${i}@example.invalid`), i % 2 ? 'invalid' : '', {
      'x-forwarded-for': `192.0.2.${i}`, 'x-real-ip': `192.0.2.${i}`,
    }))).status, 201);
  }
  assert.equal((await f.register(f.request(payload('extra@example.invalid'), ''))).status, 429);
});

test('budgets expire, clean up and keep login and registration isolated', async () => {
  const f = createAuthFixture();
  f.now = Math.floor(f.now / 3_600_000) * 3_600_000;
  for (let i = 0; i < 10; i++) await f.login();
  await assert.rejects(f.login(), limited);
  assert.equal((await f.register(f.request(payload('user@example.invalid')))).status, 201);
  f.now += 900_000;
  assert.equal(await f.login(), null);
  assert.equal([...f.budgets.values()].filter(row => row.expiresAt <= new Date(f.now)).length, 0);
  for (let i = 0; i < 4; i++) await f.register(f.request(payload(`new${i}@example.invalid`)));
  assert.equal((await f.register(f.request(payload('blocked@example.invalid')))).status, 429);
  f.now += 3_600_000;
  assert.equal((await f.register(f.request(payload('renewed@example.invalid')))).status, 201);
});

test('storage outages and missing secret fail closed before password work or account lookup', async () => {
  for (const failure of ['database', 'secret']) {
    const f = createAuthFixture();
    if (failure === 'database') f.storageFailure = true;
    else { delete process.env.AUTH_SECRET; delete process.env.NEXTAUTH_SECRET; }
    assert.equal((await f.register(f.request(payload('user@example.invalid')))).status, 503);
    await assert.rejects(f.login(), error => error.code === 'temporarily_unavailable');
    assert.equal(f.hashes, 0); assert.equal(f.creates, 0); assert.equal(f.lookups, 0); assert.equal(f.verifications, 0);
  }
});

test('oversized login inputs cannot reach password verification or account lookup', async () => {
  const f = createAuthFixture();
  assert.equal(await f.login('a'.repeat(255)), null);
  assert.equal(await f.login('user@example.invalid', 'a'.repeat(129)), null);
  assert.equal(f.lookups, 0); assert.equal(f.verifications, 0);
});
