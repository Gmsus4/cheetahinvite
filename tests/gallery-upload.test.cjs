/* eslint-disable @typescript-eslint/no-require-imports -- Exercise the actual file-input handler and upload routes with isolated bindings. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  return predicate(node) ? node : find(node.props?.children, predicate);
}

function gallery({ images = [], ensureEvent } = {}) {
  const db = createFixture(), states = [], changes = [], busy = [];
  let index = 0, complete;
  const finished = new Promise(resolve => { complete = resolve; });
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('components/dashboard/InvitationImageUpload.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  function requireMock(name) {
    if (name === 'react') return { ...React, useState(initial) {
      const slot = index++;
      if (!(slot in states)) states[slot] = initial;
      return [states[slot], value => { states[slot] = value; }];
    } };
    if (name === 'next/image') return { __esModule: true, default: () => null };
    if (name === '@/lib/image-upload') return db.client;
    if (name === '@/lib/limits') return db.load('lib/limits.ts');
    return require(name);
  }
  new Function('require', 'exports', source)(requireMock, exports);
  const props = { eventId: 'event', images, multiple: true, ensureEvent,
    onChange: value => changes.push(value), onBusyChange: value => { busy.push(value); if (!value) complete(); } };
  function render() { index = 0; return exports.InvitationImageUpload(props); }
  return { db, changes, busy, render, async select(files) {
    find(render(), node => node.type === 'input').props.onChange({ currentTarget: { files, value: 'selected' } });
    if (busy.length) await finished;
  } };
}

const photo = name => new File(['photo'], name, { type: 'image/png' });

test('a failed gallery photo does not block later files or discard successful uploads', async () => {
  let preparations = 0;
  const f = gallery({ images: ['existing-photo'], ensureEvent: async () => { preparations++; return 'event'; } });
  const put = f.db.route.PUT;
  let attempts = 0;
  f.db.route.PUT = request => {
    attempts++;
    return attempts === 2 || attempts === 3
      ? new Response('error code: 1102', { status: 503 }) : put(request);
  };
  await f.select([photo('primera.png'), new File(['svg'], 'no-admitida.svg', { type: 'image/svg+xml' }), photo('fallida.png'), photo('ultima.png')]);
  assert.equal(preparations, 1);
  assert.deepEqual(f.busy, [true, false]);
  assert.deepEqual(f.changes.map(value => value.length), [2, 3]);
  assert.equal(f.changes[0][0], 'existing-photo');
  assert.equal(f.changes[1][1], f.changes[0][1]);
  assert.equal(f.db.providerAssets.size, 2);
  const alert = find(f.render(), node => node.props?.role === 'alert');
  assert.match(alert.props.children, /no-admitida.svg: Usa imágenes/);
  assert.match(alert.props.children, /fallida.png: El servidor alcanzó su límite de recursos/);
});

test('gallery limit warnings survive a successful partial batch', async () => {
  const f = gallery({ images: Array.from({ length: 11 }, (_, i) => `existing-${i}`) });
  await f.select([photo('primera.png'), photo('sin-espacio.png')]);
  assert.equal(f.changes[0].length, 12);
  assert.equal(f.db.providerAssets.size, 1);
  assert.match(find(f.render(), node => node.props?.role === 'alert').props.children, /Solo puedes agregar 1 foto más/);
});

test('an event preparation failure releases the busy state and sends no files', async () => {
  const f = gallery({ ensureEvent: async () => { throw Error('No pudimos guardar tu evento.'); } });
  await f.select([photo('foto.png')]);
  assert.deepEqual(f.busy, [true, false]);
  assert.equal(f.db.clientCalls.length, 0);
  assert.equal(f.changes.length, 0);
  assert.match(find(f.render(), node => node.props?.role === 'alert').props.children, /guardar tu evento/);
});

test('invalid files do not create a draft or reserve storage', async () => {
  let preparations = 0;
  const f = gallery({ ensureEvent: async () => { preparations++; return 'event'; } });
  await f.select([new File([], 'vacia.png', { type: 'image/png' }), new File(['svg'], 'no-admitida.svg', { type: 'image/svg+xml' })]);
  assert.equal(preparations, 0);
  assert.equal(f.db.clientCalls.length, 0);
  assert.equal(f.busy.length, 0);
  const error = find(f.render(), node => node.props?.role === 'alert').props.children;
  assert.match(error, /vacia.png/);
  assert.match(error, /no-admitida.svg/);
});

test('Cloudflare resource errors during authorization produce a useful message without retrying reservations', async () => {
  const f = createFixture();
  f.route.POST = async () => new Response('error code: 1102\n', { status: 503 });
  await assert.rejects(f.client.uploadInvitationImage(photo('foto.png'), 'event'), /servidor alcanzó su límite de recursos/);
  assert.equal(f.clientCalls.length, 1);
  assert.equal(f.state.assets.size, 0);
});

test('a lost Cloudflare upload response retries the same grant and preserves one stored photo', async () => {
  const f = createFixture(), put = f.route.PUT;
  let first = true;
  f.route.PUT = async request => {
    const response = await put(request);
    if (first) { first = false; return new Response('error code: 1102', { status: 503 }); }
    return response;
  };
  const url = await f.client.uploadInvitationImage(photo('foto.png'), 'event');
  assert.equal(f.providerAssets.size, 1);
  assert.equal(f.state.assets.size, 1);
  const attempts = f.clientCalls.filter(call => call.method === 'PUT');
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].url, attempts[1].url);
  assert.equal([...f.state.assets.values()][0].url, url);
});

test('persistent non-JSON upload errors remain readable after the bounded retry', async () => {
  const f = createFixture();
  f.route.PUT = async () => new Response('<title>Error 1102</title>', { status: 503 });
  await assert.rejects(f.client.uploadInvitationImage(photo('foto.png'), 'event'), /servidor alcanzó su límite de recursos/);
  assert.equal(f.clientCalls.filter(call => call.method === 'PUT').length, 2);
  assert.equal(f.state.assets.size, 1);
});
