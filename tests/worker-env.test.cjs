/* eslint-disable @typescript-eslint/no-require-imports -- Verify secrets cannot be embedded in generated deployment modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sanitizeWorkerEnv, assertWorkerEnvIsPublic } = require('../scripts/worker-env.cjs');

test('all modes exclude private runtime values and copied env files while retaining public values', () => {
  fs.mkdirSync('.cloudflare-test', { recursive: true });
  const root = fs.mkdtempSync(path.resolve('.cloudflare-test/env-test-'));
  const output = path.join(root, '.open-next');
  fs.mkdirSync(path.join(output, 'cloudflare'), { recursive: true });
  fs.mkdirSync(path.join(output, 'server-functions', 'default'), { recursive: true });
  fs.writeFileSync(path.join(root, '.env'), 'SOURCE_SECRET=untouched');
  fs.writeFileSync(path.join(output, 'server-functions', 'default', '.env'), 'RUNTIME_SECRET=fixture');
  const values = { DATABASE_URL: 'postgresql://fixture', AUTH_SECRET: 'private-fixture', NEXT_PUBLIC_LABEL: 'Quotes " and\nnewlines' };
  const file = path.join(output, 'cloudflare', 'next-env.mjs');
  fs.writeFileSync(file, ['production', 'development', 'test'].map(mode => `export const ${mode} = ${JSON.stringify(values)};\n`).join(''));
  assert.throws(() => assertWorkerEnvIsPublic(output), /Local runtime variables/);
  assert.equal(sanitizeWorkerEnv(output), 6);
  assert.doesNotThrow(() => assertWorkerEnvIsPublic(output));
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /private-fixture|postgresql/);
  assert.match(fs.readFileSync(file, 'utf8'), /NEXT_PUBLIC_LABEL/);
  assert.equal(fs.existsSync(path.join(output, 'server-functions', 'default', '.env')), false);
  assert.equal(fs.readFileSync(path.join(root, '.env'), 'utf8'), 'SOURCE_SECRET=untouched');
  fs.writeFileSync(file, 'export const production = {};\n');
  assert.throws(() => sanitizeWorkerEnv(output), /Missing OpenNext/);
  fs.writeFileSync(file, 'process.exit(0);\n');
  assert.throws(() => sanitizeWorkerEnv(output), /Unexpected OpenNext/);
});
