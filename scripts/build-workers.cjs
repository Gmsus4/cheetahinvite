/* eslint-disable @typescript-eslint/no-require-imports -- Portable local build entry point. */
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const temporary = path.resolve('.cloudflare-test/tmp');
fs.mkdirSync(temporary, { recursive: true });
// Avoid URL-significant characters in Windows sandbox TEMP paths (notably #).
const preload = process.platform === 'win32' ? ['--require', path.resolve('scripts/windows-build-compat.cjs')] : [];
const result = spawnSync(process.execPath, [...preload, 'node_modules/@opennextjs/cloudflare/dist/cli/index.js', 'build', ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, TEMP: temporary, TMP: temporary, TMPDIR: temporary, NEXT_TELEMETRY_DISABLED: '1',
    DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/cheetahinvite_test',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/cheetahinvite_test' },
});
if (result.error) throw result.error;
if (result.status === 0) {
  require('./worker-runtime-assets.cjs').copyWorkerRuntimeAssets();
  const removed = require('./worker-env.cjs').sanitizeWorkerEnv();
  console.log(`Removed ${removed} local runtime variable entries from the Worker artifact.`);
}
process.exitCode = result.status ?? 1;
