/* eslint-disable @typescript-eslint/no-require-imports -- Verify durable, account-scoped notice acknowledgement with isolated services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const fs = require('node:fs'), ts = require('typescript'), React = require('react');

function clientFixture(result = { ok: true }) {
  const state = [], jobs = [], calls = [];
  let index = 0;
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('components/dashboard/CourtesyNotice.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  function requireMock(name) {
    if (name === 'react') return { ...React, useState(initial) { const slot = index++; if (!(slot in state)) state[slot] = initial; return [state[slot], value => { state[slot] = value; }]; }, useTransition: () => [false, work => jobs.push(Promise.resolve().then(work))] };
    if (name === 'next/navigation') return { useRouter: () => ({ push: path => calls.push(['navigate', path]) }) };
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (name === '@/app/dashboard/actions') return { acknowledgeCourtesyNotice: async id => { calls.push(['read', id]); return result; } };
    return require(name);
  }
  new Function('require', 'module', 'exports', source)(requireMock, mod, mod.exports);
  return { calls, jobs, render() { index = 0; return mod.exports.CourtesyNotice({ grantId: 'gift', eventId: 'event', name: 'Celebración', expiresAt: new Date('2027-11-09'), published: true }); } };
}

test('closing a notice hides it after saving without navigating', async () => {
  const f = clientFixture();
  f.render().props.children[3].props.onClick();
  await Promise.all(f.jobs);
  assert.deepEqual(f.calls, [['read', 'gift']]);
  assert.equal(f.render(), null);
});

test('opening the invitation saves the read state before navigating and a failed save remains retryable', async () => {
  const f = clientFixture();
  let prevented = false;
  f.render().props.children[2].props.onNavigate({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(f.calls.length, 0);
  await Promise.all(f.jobs);
  assert.deepEqual(f.calls, [['read', 'gift'], ['navigate', '/dashboard/eventos/event']]);
  assert.equal(f.render(), null);
  const failed = clientFixture({ ok: false, error: 'Inténtalo de nuevo.' });
  failed.render().props.children[3].props.onClick();
  await Promise.all(failed.jobs);
  const notice = failed.render();
  assert.ok(notice);
  assert.equal(notice.props.children[1].props.children.at(-1).props.role, 'alert');
  assert.equal(failed.calls.some(call => call[0] === 'navigate'), false);
});

test('recipients can acknowledge their own courtesy once without changing invitation access', async () => {
  const f = createFixture();
  f.state.courtesy.set('gift', { id: 'gift', ownerId: 'owner', eventId: 'event', readAt: null });
  f.state.courtesy.set('other', { id: 'other', ownerId: 'another-owner', eventId: 'another-event', readAt: null });
  const event = structuredClone(f.state.events.get('event'));
  const { acknowledgeCourtesyNotice } = f.load('app/dashboard/actions.ts');
  assert.equal((await acknowledgeCourtesyNotice('gift')).ok, true);
  const firstRead = f.state.courtesy.get('gift').readAt;
  assert.ok(firstRead instanceof Date);
  await acknowledgeCourtesyNotice('gift');
  assert.equal(f.state.courtesy.get('gift').readAt.getTime(), firstRead.getTime());
  await acknowledgeCourtesyNotice('other');
  assert.equal(f.state.courtesy.get('other').readAt, null);
  assert.deepEqual(f.state.events.get('event'), event);
});

test('anonymous and invalid acknowledgements cannot mark notices as read, and storage failures allow retry', async () => {
  const f = createFixture();
  f.state.courtesy.set('gift', { id: 'gift', ownerId: 'owner', readAt: null });
  const { acknowledgeCourtesyNotice } = f.load('app/dashboard/actions.ts');
  f.owner = null;
  assert.equal((await acknowledgeCourtesyNotice('gift')).ok, false);
  f.owner = 'owner';
  for (const value of ['', null, 'x'.repeat(129)]) assert.equal((await acknowledgeCourtesyNotice(value)).ok, false);
  const update = f.prisma.courtesyGrant.updateMany;
  f.prisma.courtesyGrant.updateMany = async () => { throw Error('Database unavailable'); };
  assert.equal((await acknowledgeCourtesyNotice('gift')).ok, false);
  assert.equal(f.state.courtesy.get('gift').readAt, null);
  f.prisma.courtesyGrant.updateMany = update;
  assert.equal((await acknowledgeCourtesyNotice('gift')).ok, true);
});

test('a replacement courtesy remains unread after the previous gift was acknowledged and revoked', async () => {
  const f = createFixture();
  const { grantCourtesy, revokeCourtesy } = f.load('lib/courtesy.ts');
  const { acknowledgeCourtesyNotice } = f.load('app/dashboard/actions.ts');
  const expiresAt = new Date(Date.now() + 365 * 86400000);
  const first = await grantCourtesy('admin', 'event', 'owner', 'Regalo de prueba', expiresAt);
  await acknowledgeCourtesyNotice(first.id);
  await revokeCourtesy('admin', first.id, 'Retiro de prueba');
  const next = await grantCourtesy('admin', 'event', 'owner', 'Nuevo regalo de prueba', expiresAt);
  const unread = await f.prisma.courtesyGrant.findMany({ where: { ownerId: 'owner', readAt: null, revokedAt: null } });
  assert.deepEqual(unread.map(row => row.id), [next.id]);
  assert.ok(f.state.courtesy.get(first.id).readAt);
});
