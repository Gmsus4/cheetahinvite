/* eslint-disable @typescript-eslint/no-require-imports -- Simulate schema regeneration with the development singleton. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('schema cache refreshes when a model is added and reuses an unchanged client', () => {
  const compiled = ts.transpileModule(fs.readFileSync('prisma.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const globalState = {};
  let disconnected = 0;
  function load(Prisma) {
    const exports = {};
    class PrismaClient { $disconnect() { disconnected++; return Promise.resolve(); } }
    const requireMock = name => name === '@prisma/adapter-pg' ? { PrismaPg: class {} }
      : name === '@/generated/prisma/client' ? { Prisma, PrismaClient }
      : { useExplicitSslMode: value => value };
    new Function('require', 'exports', 'globalThis', 'process', compiled)(requireMock, exports, globalState, { env: { NODE_ENV: 'development' } });
    return exports.prisma;
  }
  const fields = { EventScalarFieldEnum: { id: 'id' } };
  const oldClient = load(fields);
  assert.equal(load(fields), oldClient);
  const newClient = load({ ...fields, InvitationLinkScalarFieldEnum: { path: 'path', eventId: 'eventId' } });
  assert.notEqual(newClient, oldClient);
  assert.equal(disconnected, 1);
  assert.equal(load({ InvitationLinkScalarFieldEnum: { eventId: 'eventId', path: 'path' }, ...fields }), newClient);
});
