/* eslint-disable @typescript-eslint/no-require-imports -- Atomic replacement with isolated services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
function setup() {
  const f = createFixture();
  Object.assign(f.state.events.get('event'), { eventType: 'wedding', status: 'REFUNDED', paidAt: new Date(), expiresAt: new Date('2099-01-01'), draftLastSavedAt: new Date('2026-01-01'), slug: 'old-public', customSlug: 'old-alias', stripePaymentIntentId: 'pi_old', privacy: 'PRIVATE', pinHash: 'old-pin', accent: '#E9560A', venue: 'Lugar', eventDate: new Date('2027-01-01'), sections: [{ type: 'gallery', imageUrls: [], title: 'Fotos' }] });
  f.state.users.get('owner').invitationCount = 3;
  f.state.events.set('paid1', { id: 'paid1', ownerId: 'owner', status: 'PUBLISHED' });
  f.state.events.set('paid2', { id: 'paid2', ownerId: 'owner', status: 'PUBLISHED' });
  f.state.payments.set('purchase', { id: 'purchase', ownerId: 'owner', eventId: 'event', status: 'PAID', refundedAmount: 26900 });
  return f;
}
const reuse = f => f.load('lib/refunded-invitation.ts').reuseRefundedInvitation('owner', 'event');

test('replacement at full capacity keeps content and paid invitations, clears access and retains purchase history', async () => {
  const f = setup(), before = structuredClone(f.state.events.get('event'));
  const id = await reuse(f), event = f.state.events.get(id);
  assert.notEqual(id, 'event'); assert.equal(f.state.events.size, 3);
  assert.equal(f.state.events.has('event'), false);
  assert.equal(f.state.users.get('owner').invitationCount, 3);
  assert.equal(f.state.events.get('paid1').status, 'PUBLISHED');
  for (const key of ['name', 'eventType', 'sections', 'venue', 'eventDate', 'accent']) assert.deepEqual(event[key], before[key]);
  for (const key of ['paidAt', 'expiresAt', 'stripePaymentIntentId', 'stripeCheckoutSessionId', 'pinHash', 'slug', 'customSlug']) assert.ok(event[key] == null);
  assert.equal(event.status, 'DRAFT'); assert.equal(event.privacy, 'UNSET');
  assert.ok(event.draftLastSavedAt > before.draftLastSavedAt);
  assert.equal(f.state.payments.get('purchase').eventId, 'event');
  assert.equal(f.state.payments.get('purchase').refundedAmount, 26900);
});

test('concurrent submissions and lost-response retries produce exactly one replacement', async () => {
  const f = setup();
  const ids = await Promise.all([reuse(f), reuse(f)]);
  assert.equal(ids[0], ids[1]); assert.equal(await reuse(f), ids[0]);
  assert.equal(f.state.events.size, 3); assert.equal(f.state.users.get('owner').invitationCount, 3);
});

test('saved R2 photos move without duplication, survive saves, and enter cleanup when removed', async () => {
  const f = setup(), asset = f.addAsset();
  f.state.events.get('event').imageUrl = asset.url;
  const id = await reuse(f);
  assert.equal(f.state.assets.size, 1);
  assert.equal(f.state.assets.get(asset.publicId).eventId, id);
  assert.equal(f.state.assets.get(asset.publicId).state, 'READY');
  const current = f.state.events.get(id);
  await f.storage.syncImages(f.prisma, 'owner', id, current, current);
  assert.equal(f.state.assets.get(asset.publicId).state, 'READY');
  await f.storage.syncImages(f.prisma, 'owner', id, current, { imageUrl: '', sections: [] });
  assert.equal(f.state.assets.get(asset.publicId).state, 'DELETE_PENDING');
});

test('an image transfer failure rolls back new draft, source deletion and queue changes', async () => {
  const f = setup();
  const before = structuredClone(f.state);
  const transfer = f.storage.transferSavedImages;
  f.storage.transferSavedImages = async (...args) => { await transfer(...args); throw Error('Forced failure'); };
  await assert.rejects(reuse(f), /Forced failure/);
  assert.deepEqual(f.state, before);
});

test('other accounts, examples, paid, disputed and expired-content invitations cannot be reused', async () => {
  for (const changes of [{ ownerId: 'other' }, { isExample: true }, { status: 'PUBLISHED' }, { status: 'SUSPENDED' }, { expiresAt: new Date('2020-01-01') }]) {
    const f = setup(); Object.assign(f.state.events.get('event'), changes);
    await assert.rejects(reuse(f)); assert.equal(f.state.events.size, 3);
  }
});

test('unresolved payment attempts block reuse without losing the original', async () => {
  const f = setup(); f.state.payments.set('pending', { id: 'pending', ownerId: 'owner', eventId: 'event', status: 'PENDING' });
  await assert.rejects(reuse(f), /pendiente de verificar/);
  assert.equal(f.state.events.has('event'), true);
});

test('server action requires authentication and explicit confirmation', async () => {
  const f = setup(), action = f.load('app/dashboard/eventos/[id]/pago/reuse-actions.ts');
  assert.ok((await action.reuseRefundedEvent('event', false)).error);
  f.owner = null;
  assert.ok((await action.reuseRefundedEvent('event', true)).error);
  assert.equal(f.state.events.has('event'), true);
});

test('confirmation UI explains replacement and requires consent before creating and opening the draft', async () => {
  const fs = require('node:fs'), ts = require('typescript');
  const f = setup(), mod = { exports: {} }, states = [], jobs = [], routes = [];
  let slot = 0;
  const source = ts.transpileModule(fs.readFileSync('components/dashboard/ReuseRefundedInvitation.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', source)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react') return { useId: () => 'reuse', useRef: () => ({ current: { showModal() {}, close() {} } }), useTransition: () => [false, fn => jobs.push(fn())], useState: initial => {
      const i = slot++; if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = value; }];
    } };
    if (name === 'next/navigation') return { useRouter: () => ({ replace: path => routes.push(path), refresh() {} }) };
    if (name.startsWith('@/app/')) return f.load('app/dashboard/eventos/[id]/pago/reuse-actions.ts');
    return new Proxy({}, { get: () => () => null });
  }, mod, mod.exports);
  const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
  const render = () => { slot = 0; return nodes(mod.exports.ReuseRefundedInvitation({ eventId: 'event', eventName: 'Prueba' })); };
  let tree = render();
  assert.equal(tree.find(n => n.props.type === 'submit').props.disabled, true);
  await tree.find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(jobs.length, 0); assert.equal(f.state.events.has('event'), true);
  tree.find(n => n.props.type === 'checkbox').props.onChange({ target: { checked: true } });
  tree = render(); assert.equal(tree.find(n => n.props.type === 'submit').props.disabled, false);
  tree.find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  await Promise.all(jobs);
  assert.equal(routes.length, 1); assert.match(routes[0], /^\/dashboard\/eventos\/reuse_/);
  assert.equal(f.state.events.has('event'), false);
});
