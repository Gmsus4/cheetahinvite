/* eslint-disable @typescript-eslint/no-require-imports -- Verify atomic admission against disposable PostgreSQL. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createAuthFixture } = require('./helpers/auth-attempts-fixture.cjs');
const { prisma } = require('./helpers/postgres-loader.cjs')('__auth_attempts_test__');
const fixtureId = randomUUID();
const keys = new Set();
const emails = [];
const trackedPrisma = {
  user: prisma.user,
  authAttemptBudget: {
    deleteMany: args => prisma.authAttemptBudget.deleteMany(args),
    upsert: args => { keys.add(args.where.key); return prisma.authAttemptBudget.upsert(args); },
  },
};

(async () => {
  try {
    const now = Math.floor(Date.now() / 3_600_000) * 3_600_000;
    const first = createAuthFixture({ prisma: trackedPrisma, now });
    const second = createAuthFixture({ prisma: trackedPrisma, now });
    const email = `__auth_attempts_${fixtureId}@example.invalid`;
    const attempts = await Promise.all(Array.from({ length: 50 }, (_, index) =>
      (index % 2 ? first : second).limits.consumeAuthAttempt('login-email', email)));
    assert.equal(attempts.filter(result => result.allowed).length, 10);
    assert.equal((await second.limits.consumeAuthAttempt('login-email', email)).allowed, false);
    const stored = await prisma.authAttemptBudget.findMany({ where: { key: { in: [...keys] } } });
    assert.equal(stored.length, 1); assert.equal(stored[0].count, 51);
    assert.ok(!stored[0].key.includes(email));

    // Concurrent registration requests compete for the same IP admission slots.
    const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => {
      const email = `__auth_attempts_${fixtureId}_${index}@example.invalid`;
      emails.push(email);
      const f = index % 2 ? first : second;
      return f.register(f.request({ name: 'Auth integration', email, password: 'registration-password' }));
    }));
    assert.equal(responses.filter(response => response.status === 201).length, 5);
    assert.equal(responses.filter(response => response.status === 429).length, 7);
    assert.equal(await prisma.user.count({ where: { email: { in: emails } } }), 5);
    assert.equal(first.hashes + second.hashes, 5);

    second.now += 900_000;
    assert.equal((await second.limits.consumeAuthAttempt('login-email', email)).allowed, true);
    assert.equal(await prisma.authAttemptBudget.count({ where: { key: stored[0].key } }), 0);
    console.log('PostgreSQL auth admission passed: atomic concurrent limits, shared instances, registration caps and expiry.');
  } finally {
    await prisma.authAttemptBudget.deleteMany({ where: { key: { in: [...keys] } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
