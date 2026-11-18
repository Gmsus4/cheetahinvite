/* eslint-disable @typescript-eslint/no-require-imports -- Package locally and enforce the documented Worker size limit. */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
require('./worker-env.cjs').assertWorkerEnvIsPublic();
const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--dry-run', '--outdir', path.join('.cloudflare-test', `bundle-${Date.now()}`)], {
  encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, maxBuffer: 10 * 1024 * 1024,
});
if (result.error) throw result.error;
process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
if (result.status !== 0) process.exit(result.status ?? 1);
const size = /Total Upload:\s*([\d.]+) KiB/.exec(result.stdout);
if (!size) throw Error('Wrangler did not report the Worker bundle size');
// Since September 2026 the limit is 64 MiB uncompressed on Free and Paid.
// https://developers.cloudflare.com/workers/platform/limits/#worker-size
if (Number(size[1]) > 64 * 1024) throw Error('Worker exceeds the 64 MiB uncompressed size limit');
