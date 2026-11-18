/* eslint-disable @typescript-eslint/no-require-imports -- Simulate schema regeneration with the development singleton. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const compiled = ts.transpileModule(fs.readFileSync('prisma.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const fields = { EventScalarFieldEnum: { id: 'id' } };

function fixture({ worker = false } = {}) {
  const globalState = {};
  const state = { disconnected: 0, context: {}, contextReads: 0 };
  function load(Prisma = fields, databaseUrl = 'postgresql://local/test') {
    const exports = {};
    class PrismaClient {
      constructor({ adapter }) { this.identity = {}; this.poolConfig = adapter.config; }
      $disconnect() { state.disconnected++; return Promise.resolve(); }
      $transaction() { return this.identity; }
    }
    const requireMock = name => name === '@prisma/adapter-pg' ? { PrismaPg: class { constructor(config) { this.config = config; } } }
      : name === '@/generated/prisma/client' ? { Prisma, PrismaClient }
      : name === '@opennextjs/cloudflare' ? { getCloudflareContext() { state.contextReads++; return { ctx: state.context }; } }
      : { useExplicitSslMode: value => value };
    new Function('require', 'exports', 'globalThis', 'process', 'navigator', compiled)(
      requireMock, exports, globalState, { env: { NODE_ENV: 'development', DATABASE_URL: databaseUrl } },
      { userAgent: worker ? 'Cloudflare-Workers' : 'Node.js' },
    );
    return exports.prisma;
  }
  return { load, state };
}

test('schema cache refreshes when a model is added and reuses an unchanged client', () => {
  const { load, state } = fixture();
  const oldClient = load().identity;
  assert.equal(load().identity, oldClient);
  const newClient = load({ ...fields, InvitationLinkScalarFieldEnum: { path: 'path', eventId: 'eventId' } }).identity;
  assert.notEqual(newClient, oldClient);
  assert.equal(state.disconnected, 1);
  assert.equal(load({ InvitationLinkScalarFieldEnum: { eventId: 'eventId', path: 'path' }, ...fields }).identity, newClient);
});

test('Node reuses its pool even when OpenNext provides a development context', () => {
  const { load, state } = fixture();
  const prisma = load();
  const identity = prisma.identity;
  state.context = {};
  assert.equal(prisma.identity, identity);
  assert.equal(prisma.$transaction(), identity);
  assert.equal(state.contextReads, 0);
  assert.equal(prisma.poolConfig.maxUses, undefined);
  assert.equal(prisma.poolConfig.connectionTimeoutMillis, 15_000);
});

test('changing the database refreshes the cached pool without restarting Next', () => {
  const { load, state } = fixture();
  const previous = load().identity;
  const prisma = load(fields, 'postgresql://local/other_test');
  assert.notEqual(prisma.identity, previous);
  assert.equal(prisma.poolConfig.connectionString, 'postgresql://local/other_test');
  assert.equal(state.disconnected, 1);
});

test('Workers isolate clients by request and close sockets on release', () => {
  const { load, state } = fixture({ worker: true });
  const prisma = load();
  const firstContext = state.context;
  const firstClient = prisma.identity;
  assert.equal(prisma.$transaction(), firstClient);
  assert.equal(prisma.poolConfig.maxUses, 1);
  assert.equal(prisma.poolConfig.connectionTimeoutMillis, 15_000);
  state.context = {};
  assert.notEqual(prisma.identity, firstClient);
  state.context = firstContext;
  assert.equal(prisma.identity, firstClient);
});
