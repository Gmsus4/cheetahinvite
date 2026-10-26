/* eslint-disable @typescript-eslint/no-require-imports -- Load the real handlers against isolated database and delivery doubles. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
let users, limits, sent, jobs, deliveryFailure, authConfig;
const matches = (user, where) => (!where.id || user.id === where.id)
  && (!where.passwordResetHash || user.passwordResetHash === where.passwordResetHash)
  && (!where.passwordResetExpiresAt || user.passwordResetExpiresAt > where.passwordResetExpiresAt.gt)
  && (!where.passwordHash || user.passwordHash !== null);
const update = (user, data) => {
  for (const [key, value] of Object.entries(data)) user[key] = value?.increment ? user[key] + value.increment : value;
};
const prisma = {
  passwordRecoveryLimit: {
    deleteMany: async ({ where }) => { for (const [key, row] of limits) if (row.expiresAt <= where.expiresAt.lte) limits.delete(key); },
    upsert: async ({ where, create }) => {
      const row = limits.get(where.key);
      if (row) row.count++;
      else limits.set(where.key, { ...create, count: 1 });
      return { ...limits.get(where.key) };
    },
  },
  user: {
    findUnique: async ({ where }) => users.find(user => where.email ? user.email === where.email : user.id === where.id) || null,
    findFirst: async ({ where }) => users.find(user => matches(user, where)) || null,
    update: async ({ where, data }) => { const user = users.find(user => user.id === where.id); update(user, data); return user; },
    updateMany: async ({ where, data }) => {
      const selected = users.filter(user => matches(user, where));
      for (const user of selected) update(user, data);
      return { count: selected.length };
    },
  },
};
const load = Module._load;
Module._load = function(name, parent, isMain) {
  if (name === 'server-only') return {};
  if (name === 'next-auth') return config => { authConfig = config; return {}; };
  if (name === '@auth/prisma-adapter') return { PrismaAdapter: () => ({}) };
  if (name === 'next-auth/providers/credentials') return config => config;
  if (name === 'next-auth/providers/google') return {};
  if (name === '@/prisma') return { prisma };
  if (name === 'next/server') return { after: job => jobs.push(job), NextResponse: { json: (body, init) => Response.json(body, init) } };
  if (name.startsWith('@/')) name = path.resolve(__dirname, '..', name.slice(2));
  return load.call(this, name, parent, isMain);
};
global.fetch = async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  const body = JSON.parse(options.body);
  assert.equal(options.headers.Authorization, 'Bearer re_test_fixture');
  sent.push(body);
  return new Response('{}', { status: deliveryFailure ? 503 : 200 });
};
const { hashPassword, verifyPassword } = require('../lib/password.ts');
const { requestPasswordRecovery, resetPassword, recoveryTokenHash } = require('../lib/password-recovery.ts');
const forgot = require('../app/api/password/forgot/route.ts').POST;
const reset = require('../app/api/password/reset/route.ts').POST;
require('../auth.ts');
const bodyRequest = body => new Request('https://app.example/api/password', { method: 'POST', body: JSON.stringify(body) });
const tokenFromEmail = (index = sent.length - 1) => {
  const url = new URL(sent[index].text.match(/https:\/\/\S+/)[0]);
  assert.equal(url.search, '');
  assert.equal(url.origin, 'https://app.example');
  return new URLSearchParams(url.hash.slice(1)).get('token');
};

beforeEach(async () => {
  process.env.RESEND_API_KEY = 're_test_fixture';
  process.env.RESEND_FROM_EMAIL = 'Cheetah Invite <access@example.com>';
  process.env.APP_URL = 'https://app.example';
  users = [{ id: 'user', email: 'user@example.com', passwordHash: await hashPassword('old-password-123'), sessionVersion: 0, passwordResetHash: null, passwordResetExpiresAt: null }, { id: 'google', email: 'google@example.com', passwordHash: null, sessionVersion: 0 }];
  limits = new Map(); sent = []; jobs = []; deliveryFailure = false;
});

test('issues a hashed, random, expiring token and changes the password only once', async () => {
  await requestPasswordRecovery('user@example.com');
  const token = tokenFromEmail();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(users[0].passwordResetHash, recoveryTokenHash(token));
  assert.notEqual(users[0].passwordResetHash, token);
  assert.ok(users[0].passwordResetExpiresAt > new Date());
  assert.ok(users[0].passwordResetExpiresAt <= new Date(Date.now() + 30 * 60 * 1000));
  assert.equal(await resetPassword(token, 'new-password-456'), true);
  assert.equal(await verifyPassword('new-password-456', users[0].passwordHash), true);
  assert.equal(await verifyPassword('old-password-123', users[0].passwordHash), false);
  assert.equal(users[0].sessionVersion, 1);
  assert.equal(users[0].passwordResetHash, null);
  assert.equal(await resetPassword(token, 'another-password'), false);
});

test('rejects expired and malformed links without changing the password', async () => {
  await requestPasswordRecovery('user@example.com');
  const token = tokenFromEmail();
  users[0].passwordResetExpiresAt = new Date(0);
  assert.equal(await resetPassword(token, 'new-password-456'), false);
  assert.equal(await resetPassword('../invalid', 'new-password-456'), false);
  assert.equal(users[0].sessionVersion, 0);
});

test('only one simultaneous reset can consume a token', async () => {
  await requestPasswordRecovery('user@example.com');
  const token = tokenFromEmail();
  const results = await Promise.all([resetPassword(token, 'first-password-123'), resetPassword(token, 'second-password-123')]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(users[0].sessionVersion, 1);
});

test('a new request invalidates the previous link and rate limits persist in storage', async () => {
  await requestPasswordRecovery('user@example.com');
  const previous = tokenFromEmail();
  await requestPasswordRecovery('user@example.com');
  assert.equal(await resetPassword(previous, 'new-password-456'), false);
  assert.notEqual(tokenFromEmail(), previous);
  await requestPasswordRecovery('user@example.com');
  await requestPasswordRecovery('user@example.com');
  assert.equal(sent.length, 3);
});

test('forgot route normalizes email and responds before delivery with identical results for unknown and Google accounts', async () => {
  const responses = [];
  for (const email of [' USER@EXAMPLE.COM ', 'missing@example.com', 'google@example.com']) {
    const response = await forgot(bodyRequest({ email }));
    assert.equal(response.status, 200);
    responses.push(await response.json());
  }
  assert.deepEqual(responses[0], responses[1]);
  assert.deepEqual(responses[1], responses[2]);
  assert.equal(sent.length, 0);
  for (const job of jobs) await job();
  assert.equal(sent.length, 1);
  assert.equal(users[1].passwordHash, null);
});

test('validates input and uniformly reports missing mail configuration', async () => {
  assert.equal((await forgot(bodyRequest({ email: 'invalid' }))).status, 400);
  assert.equal((await forgot(bodyRequest(null))).status, 400);
  delete process.env.RESEND_API_KEY;
  assert.equal((await forgot(bodyRequest({ email: 'user@example.com' }))).status, 503);
  assert.equal((await forgot(bodyRequest({ email: 'missing@example.com' }))).status, 503);
  assert.equal(jobs.length, 0);
});

test('reset route enforces password policy and confirmation without consuming the link', async () => {
  await requestPasswordRecovery('user@example.com');
  const token = tokenFromEmail();
  for (const payload of [{ token: 'invalid', password: 'new-password-456' }, { token, password: 'short', confirmPassword: 'short' }, { token, password: 'a'.repeat(129), confirmPassword: 'a'.repeat(129) }, { token, password: 'new-password-456', confirmPassword: 'different-password' }]) {
    assert.equal((await reset(bodyRequest(payload))).status, 400);
  }
  assert.equal((await reset(bodyRequest({ token, password: 'new-password-456', confirmPassword: 'new-password-456' }))).status, 200);
});

test('delivery failures clear the token and insecure configured origins are rejected', async () => {
  deliveryFailure = true;
  await assert.rejects(requestPasswordRecovery('user@example.com'));
  assert.equal(users[0].passwordResetHash, null);
  process.env.APP_URL = 'http://external.example';
  assert.equal((await forgot(bodyRequest({ email: 'user@example.com' }))).status, 503);
});

test('reset invalidates existing JWT sessions and allows newly authenticated sessions', async () => {
  const oldSession = { sub: 'user', sessionVersion: 0 };
  assert.deepEqual(await authConfig.callbacks.jwt({ token: oldSession }), oldSession);
  await requestPasswordRecovery('user@example.com');
  await resetPassword(tokenFromEmail(), 'new-password-456');
  assert.equal(await authConfig.callbacks.jwt({ token: oldSession }), null);
  assert.equal(await authConfig.callbacks.jwt({ token: { sub: 'user' } }), null);
  const authenticated = await authConfig.providers[1].authorize({ email: 'user@example.com', password: 'new-password-456' });
  assert.equal(authenticated.sessionVersion, 1);
  const current = await authConfig.callbacks.jwt({ token: { sub: 'user' }, user: authenticated });
  assert.equal(current.sessionVersion, 1);
  assert.equal(await authConfig.providers[1].authorize({ email: 'user@example.com', password: 'old-password-123' }), null);
  assert.equal(await authConfig.callbacks.jwt({ token: { sub: 'deleted-user', sessionVersion: 0 } }), null);
});

test('a login authenticated before a concurrent reset cannot acquire the newer session version', async () => {
  const authenticated = await authConfig.providers[1].authorize({ email: 'user@example.com', password: 'old-password-123' });
  users[0].sessionVersion++;
  assert.equal(await authConfig.callbacks.jwt({ token: { sub: 'user' }, user: authenticated }), null);
});
