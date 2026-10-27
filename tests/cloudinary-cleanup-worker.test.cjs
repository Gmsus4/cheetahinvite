/* eslint-disable @typescript-eslint/no-require-imports -- Validate worker requests without reaching Cloudflare. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('workers/cloudinary-cleanup/index.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function worker(fetch) {
  const mod = { exports: {} };
  new Function('module', 'exports', 'fetch', source)(mod, mod.exports, fetch);
  return mod.exports;
}
const env = { APP_ORIGIN: 'https://invites.example', CRON_SECRET: 'test-private-secret' };

test('scheduled worker authenticates only to the configured HTTPS origin and refuses redirects', async () => {
  let calls = 0, job;
  const w = worker(async (url, options) => {
    calls++;
    assert.equal(url.toString(), 'https://invites.example/api/internal/cloudinary/cleanup');
    assert.equal(options.headers.Authorization, 'Bearer test-private-secret');
    assert.equal(options.redirect, 'error');
    return Response.json({ deleted: 2, retained: 1, failed: 0 });
  });
  w.default.scheduled({}, env, { waitUntil: task => { job = task; } });
  await job;
  assert.equal(calls, 1);
  for (const APP_ORIGIN of ['', 'http://invites.example', 'https://user:pass@invites.example', 'https://invites.example/path']) {
    await assert.rejects(w.cleanup({ ...env, APP_ORIGIN }));
  }
  await assert.rejects(w.cleanup({ ...env, CRON_SECRET: '' }));
  assert.equal(calls, 1);
});

test('scheduled failures remain visible for HTTP failures, bad responses and partial deletion failures', async () => {
  await assert.rejects(worker(async () => new Response('', { status: 503 })).cleanup(env), /503/);
  await assert.rejects(worker(async () => Response.json({})).cleanup(env), /invalid result/);
  await assert.rejects(worker(async () => Response.json({ deleted: 0, retained: 0, failed: 1 })).cleanup(env), /queued for retry/);
});
