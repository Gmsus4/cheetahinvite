/* eslint-disable @typescript-eslint/no-require-imports -- Exercise the scheduled handler without services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const compiled = ts.transpileModule(fs.readFileSync('lib/scheduled-cleanup.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {}; new Function('exports', compiled)(exported);

test('cron uses the same Worker service binding and its own bearer secret', async () => {
  let calls = 0;
  await exported.scheduledCleanup({ APP_URL: 'https://staging.example', CRON_SECRET: 'fixture', WORKER_SELF_REFERENCE: {
    async fetch(request) {
      calls++; assert.equal(request.url, 'https://staging.example/api/internal/images/cleanup');
      assert.equal(request.headers.get('authorization'), 'Bearer fixture'); assert.equal(request.redirect, 'error');
      return Response.json({ failed: 0, invitations: { failed: 0 } });
    },
  } });
  assert.equal(calls, 1);
});

test('cron rejects missing secrets, non-OK responses and queued failures', async () => {
  await assert.rejects(exported.scheduledCleanup({}), /secret/);
  for (const response of [new Response(null, { status: 503 }), Response.json({ failed: 1, invitations: { failed: 0 } }), Response.json({ failed: 0, invitations: { failed: 1 } }), Response.json({})]) {
    await assert.rejects(exported.scheduledCleanup({ APP_URL: 'https://staging.example', CRON_SECRET: 'fixture', WORKER_SELF_REFERENCE: { fetch: async () => response } }));
  }
});
