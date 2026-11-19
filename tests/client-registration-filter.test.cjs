/* eslint-disable @typescript-eslint/no-require-imports -- Isolated server-page checks without a database connection. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

function fixture() {
  const f = { calls: [], clients: [], allowed: true };
  const cache = new Map();
  f.load = file => {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute);
    const mod = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const mock = name => {
      if (name.endsWith('.css')) return {};
      if (name === '@/lib/admin-access') return { requireAdmin: async () => { if (!f.allowed) throw Error('denied'); } };
      if (name === '@/prisma') return { prisma: { user: { findMany: async args => { f.calls.push(args); return f.clients; } } } };
      if (name === '@/components/BrandLoader') return { BrandLoader: () => null };
      if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (name.startsWith('@/')) {
        const base = name.slice(2);
        return f.load(fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`);
      }
      return require(name);
    };
    new Function('require', 'module', 'exports', source)(mock, mod, mod.exports);
    cache.set(absolute, mod.exports);
    return mod.exports;
  };
  f.render = async query => {
    const boundary = f.load('app/admin/clientes/page.tsx').default({ searchParams: Promise.resolve(query) });
    return boundary.props.children.type(boundary.props.children.props);
  };
  return f;
}

function elements(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => elements(child, predicate));
  return [...(predicate(node) ? [node] : []), ...elements(node.props?.children, predicate)];
}

test('registration dates include the entire selected day in central Mexico time', () => {
  const { adminRegistrationRange } = fixture().load('lib/admin-validation.ts');
  const range = adminRegistrationRange('2028-02-29', '2028-02-29');
  assert.equal(range.error, '');
  assert.equal(range.createdAt.gte.toISOString(), '2028-02-29T06:00:00.000Z');
  assert.equal(range.createdAt.lt.toISOString(), '2028-03-01T06:00:00.000Z');
  assert.deepEqual(adminRegistrationRange('', '').createdAt, undefined);
  assert.equal(adminRegistrationRange('2027-01-01', '').createdAt.lt, undefined);
  assert.equal(adminRegistrationRange('', '2027-01-01').createdAt.gte, undefined);
  for (const [from, to] of [['2027-02-29', ''], ['2027-04-31', ''], ['0000-01-01', ''], ['bad', ''], [[], ''], ['', ['2027-01-01']], ['2027-02-02', '2027-02-01']]) {
    const invalid = adminRegistrationRange(from, to);
    assert.ok(invalid.error);
    assert.equal(invalid.createdAt, undefined);
  }
});

test('the page combines name/email and registration dates, retaining both during pagination', async () => {
  const f = fixture();
  const tree = await f.render({ q: '  Ana & Co  ', from: '2027-01-01', to: '2027-01-31', page: '2' });
  const args = f.calls[0];
  assert.equal(args.where.OR[0].name.contains, 'Ana & Co');
  assert.equal(args.where.OR[1].email.mode, 'insensitive');
  assert.equal(args.where.createdAt.gte.toISOString(), '2027-01-01T06:00:00.000Z');
  assert.equal(args.where.createdAt.lt.toISOString(), '2027-02-01T06:00:00.000Z');
  assert.equal(args.skip, 25);
  const pagination = elements(tree, node => node.type.name === 'AdminPagination')[0];
  const url = new URL(pagination.props.href, 'https://site.test');
  assert.equal(url.searchParams.get('q'), 'Ana & Co');
  assert.equal(url.searchParams.get('from'), '2027-01-01');
  assert.equal(url.searchParams.get('to'), '2027-01-31');
  const form = elements(tree, node => node.type === 'form')[0];
  assert.equal(form.props.action, '/admin/clientes');
  assert.equal(elements(form, node => node.type === 'input' && node.props.name === 'page').length, 0);
});

test('invalid ranges display an error without running an unfiltered database query', async () => {
  const f = fixture();
  const tree = await f.render({ from: '2027-03-02', to: '2027-03-01' });
  assert.equal(f.calls.length, 0);
  assert.ok(elements(tree, node => node.type.name === 'AdminNotice')[0].props.error);
  f.allowed = false;
  await assert.rejects(f.render({}), /denied/);
  assert.equal(f.calls.length, 0);
});

test('unfiltered clients include historical accounts and display the known registration date', async () => {
  const f = fixture();
  f.clients = [
    { id: 'legacy', name: 'Anterior', createdAt: null, _count: { events: 0 } },
    { id: 'new', name: 'Nueva', createdAt: new Date('2027-01-02T05:59:59Z'), _count: { events: 1 } },
  ];
  const tree = await f.render({});
  assert.deepEqual(f.calls[0].where, {});
  assert.equal(elements(tree, node => node.type === 'td' && node.props.children === 'Sin fecha registrada').length, 1);
  assert.equal(elements(tree, node => node.type === 'time')[0].props.children, '1 ene 2027');
});

test('SQL migration preserves unknown historical dates, timestamps new accounts and filters day boundaries', async () => {
  const { PGlite } = require('@electric-sql/pglite');
  const db = new PGlite();
  try {
    const root = 'prisma/migrations';
    const folders = fs.readdirSync(root).filter(name => fs.existsSync(path.join(root, name, 'migration.sql'))).sort();
    const migration = '20261119000001_user_registration_date';
    for (const folder of folders.filter(name => name < migration)) await db.exec(fs.readFileSync(path.join(root, folder, 'migration.sql'), 'utf8'));
    await db.query('INSERT INTO "User" (id) VALUES ($1)', ['legacy']);
    await db.exec(fs.readFileSync(path.join(root, migration, 'migration.sql'), 'utf8'));
    assert.equal((await db.query('SELECT "createdAt" FROM "User" WHERE id = $1', ['legacy'])).rows[0].createdAt, null);
    const start = Date.now();
    const account = (await db.query('INSERT INTO "User" (id) VALUES ($1) RETURNING "createdAt"', ['new'])).rows[0];
    assert.ok(account.createdAt.getTime() >= start - 1000);
    for (const [id, date] of [
      ['before', '2027-01-01T05:59:59.999Z'], ['start', '2027-01-01T06:00:00.000Z'],
      ['end', '2027-01-02T05:59:59.999Z'], ['after', '2027-01-02T06:00:00.000Z'],
    ]) await db.query('INSERT INTO "User" (id, "createdAt") VALUES ($1, $2)', [id, new Date(date)]);
    const { createdAt } = fixture().load('lib/admin-validation.ts').adminRegistrationRange('2027-01-01', '2027-01-01');
    const results = await db.query('SELECT id FROM "User" WHERE "createdAt" >= $1 AND "createdAt" < $2 ORDER BY id', [createdAt.gte, createdAt.lt]);
    assert.deepEqual(results.rows.map(row => row.id), ['end', 'start']);
  } finally { await db.close(); }
});
