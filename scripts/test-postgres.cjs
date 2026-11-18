/* eslint-disable @typescript-eslint/no-require-imports -- Disposable PostgreSQL integration runner. */
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');

function run(file, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], { env, stdio: 'inherit', windowsHide: true });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(Error(`${file} exited ${code}`)));
  });
}
async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const port = await new Promise(resolve => { const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
  const directory = path.resolve('.cloudflare-test', `postgres-${Date.now()}`);
  fs.mkdirSync(directory, { recursive: true });
  const password = randomBytes(24).toString('hex');
  const pg = new EmbeddedPostgres({ databaseDir: directory, user: 'postgres', password, port, persistent: true,
    createPostgresUser: false, autoRehydrateSymlinks: true, postgresFlags: ['-h', '127.0.0.1'], onLog() {}, onError() {} });
  let started = false;
  try {
    await pg.initialise(); await pg.start(); started = true; await pg.createDatabase('cheetahinvite_test');
    const url = `postgresql://postgres:${password}@127.0.0.1:${port}/cheetahinvite_test`;
    // Override every database input, regardless of the parent shell/.env.
    const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url, TEST_DATABASE_URL: url, APP_URL: 'http://localhost:8787',
      APP_ENV: 'local', AUTH_SECRET: randomBytes(32).toString('hex') };
    await run('node_modules/prisma/build/index.js', ['migrate', 'deploy'], env);
    if (process.argv.includes('--workers')) {
      await run('scripts/test-workers.cjs', [], env);
    } else {
      const failures = [];
      for (const file of fs.readdirSync('tests').filter(name => name.endsWith('.postgres.cjs') && name !== 'invitation-privacy.postgres.cjs')) {
        try { await run(path.join('tests', file), [], env); }
        catch { failures.push(file); }
      }
      if (failures.length) throw Error(`PostgreSQL suites failed: ${failures.join(', ')}`);
    }
  } finally {
    if (started && process.platform === 'win32' && pg.process) {
      // Use PostgreSQL's own graceful shutdown; taskkill in embedded-postgres
      // can leave Windows I/O child processes holding its output pipes open.
      const pgCtl = path.join(path.dirname(pg.process.spawnfile), 'pg_ctl.exe');
      await new Promise((resolve, reject) => {
        const child = spawn(pgCtl, ['stop', '-D', directory, '-m', 'fast', '-w', '-t', '15'], { stdio: 'inherit', windowsHide: true });
        child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(Error('Temporary PostgreSQL could not stop')));
      });
      pg.process = undefined;
    } else if (started) await pg.stop();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
