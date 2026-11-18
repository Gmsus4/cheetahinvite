/* eslint-disable @typescript-eslint/no-require-imports -- Exercise real routes/actions with isolated database and provider doubles. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const HOUR = 60 * 60 * 1000;
const MAX = 5 * 1024 * 1024;

beforeEach(() => { process.env.APP_URL = 'http://localhost'; process.env.CRON_SECRET = 'cron-test-secret'; });
test('cleanup retains a photo referenced only as the invitation background', async () => {
  const f = createFixture();
  const asset = f.addAsset({ expiresAt: new Date(Date.now() - 1000) });
  f.state.events.get('event').backgroundImageUrl = asset.url;
  const retained = await f.storage.runImageCleanup('owner');
  assert.equal(retained.retained, 1);
  assert.ok(f.state.assets.has(asset.publicId));
  f.state.events.get('event').backgroundImageUrl = null;
  f.state.assets.get(asset.publicId).expiresAt = new Date(Date.now() - 1000);
  const removed = await f.storage.runImageCleanup('owner');
  assert.equal(removed.deleted, 1);
});
function budget(fixture, name, count) {
  const duration = name === 'hour' ? HOUR : 24 * HOUR;
  const bucket = Math.floor(Date.now() / duration);
  const key = `owner:${name}:${bucket}`;
  fixture.state.budgets.set(key, { key, ownerId: 'owner', count, expiresAt: new Date((bucket + 1) * duration) });
}
function past() { return new Date(Date.now() - 1000); }

test('requires authentication and event ownership before contacting Cloudinary', async () => {
  const f = createFixture();
  f.owner = null;
  assert.equal((await f.route.POST(f.uploadRequest())).status, 401);
  assert.equal((await f.route.PUT(f.confirmRequest('anything'))).status, 401);
  f.owner = 'owner';
  f.state.events.get('event').ownerId = 'another';
  assert.equal((await f.route.POST(f.uploadRequest())).status, 404);
  assert.equal(f.requests.length, 0);
  assert.equal(f.state.assets.size, 0);
});

test('ignores forged browser counts and enforces stored file and byte budgets on the server', async () => {
  const f = createFixture();
  for (let i = 0; i < 40; i++) f.addAsset();
  assert.equal((await f.route.POST(f.uploadRequest({ activeImageCount: '0', imageScope: 'single' }))).status, 409);
  assert.equal(f.requests.length, 0);
  f.state.assets.clear();
  for (let i = 0; i < 20; i++) f.addAsset({ bytes: MAX });
  assert.equal((await f.route.POST(f.uploadRequest())).status, 409);
  assert.equal(f.requests.length, 0);
});

test('enforces persistent account budgets across events and simultaneous last-slot requests', async () => {
  const f = createFixture();
  budget(f, 'hour', 19);
  const results = await Promise.all([f.route.POST(f.uploadRequest()), f.route.POST(f.uploadRequest())]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 429]);
  assert.equal(f.requests.length, 0);
  assert.equal(f.state.assets.size, 1);
  assert.equal([...f.state.budgets.values()].find(row => row.key.includes(':hour:')).count, 20);
  f.state.events.set('other', { id: 'other', ownerId: 'owner', sections: [] });
  assert.equal((await f.route.POST(f.uploadRequest({ eventId: 'other' }))).status, 429);
  f.state.budgets.clear(); budget(f, 'day', 60);
  assert.equal((await f.route.POST(f.uploadRequest())).status, 429);
});

test('storage debt from deleted events cannot be bypassed by creating another invitation', async () => {
  const f = createFixture();
  for (let i = 0; i < 120; i++) f.addAsset({ eventId: 'deleted', state: 'DELETE_PENDING', nextAttemptAt: new Date(Date.now() + HOUR) });
  assert.equal((await f.route.POST(f.uploadRequest())).status, 409);
  assert.equal(f.requests.length, 0);
  f.state.assets.clear();
  for (let i = 0; i < 60; i++) f.addAsset({ eventId: 'deleted', bytes: MAX, state: 'DELETE_PENDING', nextAttemptAt: new Date(Date.now() + HOUR) });
  assert.equal((await f.route.POST(f.uploadRequest())).status, 409);
  assert.equal(f.requests.length, 0);
});

test('daily budgets survive event deletion and recreation and expired windows reset', async () => {
  const f = createFixture();
  budget(f, 'day', 60);
  await f.actions.deleteEvent('event');
  f.state.events.set('event', { id: 'event', ownerId: 'owner', sections: [] });
  assert.equal((await f.route.POST(f.uploadRequest())).status, 429);
  for (const row of f.state.budgets.values()) row.expiresAt = past();
  assert.equal((await f.route.POST(f.uploadRequest())).status, 200);
});

test('accepts only bounded same-origin JSON metadata and rejects invalid file declarations', async () => {
  const f = createFixture();
  let remaining = 8192;
  const big = new Request('http://localhost/upload', { method: 'POST', duplex: 'half', body: new ReadableStream({
    pull(controller) {
      if (!remaining) { controller.close(); return; }
      const length = Math.min(remaining, 64 * 1024); remaining -= length;
      controller.enqueue(new Uint8Array(length));
    },
  }), headers: { 'content-type': 'application/json', origin: 'http://localhost' } });
  assert.equal(big.headers.has('content-length'), false);
  assert.equal((await f.route.POST(big)).status, 413);
  assert.equal((await f.route.POST(f.uploadRequest({}, new File(['x'], 'x.svg', { type: 'image/svg+xml' })))).status, 400);
  assert.equal((await f.route.POST(f.uploadRequest({}, new File([], 'empty.png', { type: 'image/png' })))).status, 400);
  assert.equal((await f.route.POST(f.uploadRequest({ size: MAX + 1 }))).status, 413);
  const foreignOrigin = f.uploadRequest(); foreignOrigin.headers.set('origin', 'https://another.example');
  assert.equal((await f.route.POST(foreignOrigin)).status, 403);
  const multipart = new Request('http://localhost/upload', { method: 'POST', headers: { origin: 'http://localhost' }, body: new FormData() });
  assert.equal((await f.route.POST(multipart)).status, 415);
  assert.equal((await f.route.POST(f.jsonRequest(null))).status, 400);
  assert.equal(f.requests.length, 0);
});

test('saving replacement photos queues only previously saved unused images and protects other tab temporaries', async () => {
  const f = createFixture();
  const old = f.addAsset();
  const replacement = f.addAsset({ expiresAt: new Date(Date.now() + 24 * HOUR) });
  const otherTab = f.addAsset({ expiresAt: new Date(Date.now() + 24 * HOUR) });
  f.state.events.get('event').imageUrl = old.url;
  assert.equal(f.state.assets.get(old.publicId).state, 'READY');
  await f.actions.updateEvent('event', f.saveForm(replacement.url));
  assert.equal(f.state.events.get('event').imageUrl, replacement.url);
  assert.equal(f.state.assets.get(old.publicId).state, 'DELETE_PENDING');
  assert.equal(f.state.assets.get(replacement.publicId).expiresAt, null);
  assert.equal(f.state.assets.get(otherTab.publicId).state, 'READY');
  assert.ok(f.state.assets.get(otherTab.publicId).expiresAt);
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
  assert.equal(f.state.assets.has(old.publicId), false);
  assert.equal(f.state.assets.has(replacement.publicId), true);
});

test('a cover reused in a disabled section is retained until its last reference is removed', async () => {
  const f = createFixture();
  const image = f.addAsset();
  f.state.events.get('event').imageUrl = image.url;
  const section = { id: 'story', type: 'story', title: 'Historia', content: '', detail: '', link: '', imageUrl: image.url, enabled: false };
  await f.actions.updateEvent('event', f.saveForm('', [section]));
  assert.equal(f.state.assets.get(image.publicId).state, 'READY');
  assert.equal((await f.storage.runImageCleanup()).deleted, 0);
  await f.actions.updateEvent('event', f.saveForm());
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
});

test('event deletion retains its durable cleanup records, defers in-flight uploads and rejects other owners', async () => {
  const f = createFixture();
  const image = f.addAsset();
  f.state.events.get('event').imageUrl = image.url;
  const pending = await f.storage.reserveImage('owner', 'event');
  f.owner = 'other'; f.state.users.set('other', { id: 'other' });
  await f.actions.deleteEvent('event');
  assert.equal(f.state.events.has('event'), true);
  f.owner = 'owner';
  assert.equal((await f.actions.deleteEvent('event')).error, null);
  assert.equal(f.state.events.has('event'), false);
  assert.equal(f.state.assets.get(image.publicId).state, 'DELETE_PENDING');
  assert.ok(f.state.assets.get(pending.publicId).nextAttemptAt > new Date());
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
  assert.equal(f.state.assets.has(pending.publicId), true);
  await assert.rejects(f.storage.finishImage('owner', 'event', pending.publicId, f.url(pending.publicId), 100));
  f.state.assets.get(pending.publicId).nextAttemptAt = past();
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
});

test('cleanup preserves legacy images referenced by another event and deletes after that reference disappears', async () => {
  const f = createFixture();
  const image = f.addAsset({ state: 'DELETE_PENDING', nextAttemptAt: past() });
  f.state.events.set('shared', { id: 'shared', ownerId: 'another', sections: [{ imageUrl: image.url, enabled: false }] });
  assert.equal((await f.storage.runImageCleanup()).retained, 1);
  assert.equal(f.requests.length, 0);
  f.state.events.delete('shared');
  f.state.assets.get(image.publicId).nextAttemptAt = past();
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
});

test('cleanup failures keep storage charged and concurrent workers do not destroy the same image twice', async () => {
  const f = createFixture();
  const image = f.addAsset({ state: 'DELETE_PENDING', nextAttemptAt: past() });
  f.failure = 'provider unavailable';
  assert.equal((await f.storage.runImageCleanup()).failed, 1);
  assert.equal(f.state.assets.has(image.publicId), true);
  assert.ok(f.state.assets.get(image.publicId).nextAttemptAt > new Date());
  f.failure = null;
  f.state.assets.get(image.publicId).nextAttemptAt = past();
  f.requests.length = 0;
  const results = await Promise.all([f.storage.runImageCleanup(), f.storage.runImageCleanup()]);
  assert.equal(results.reduce((sum, r) => sum + r.deleted, 0), 1);
  assert.equal(f.requests.filter(r => r.method === 'DELETE').length, 1);
  assert.equal(f.requests[0].key, image.publicId);
});

test('image identifiers mentioned only in text do not block cleanup', async () => {
  const f = createFixture();
  const image = f.addAsset({ state: 'DELETE_PENDING', nextAttemptAt: past() });
  f.state.events.get('event').sections = [{ type: 'custom', content: image.publicId, imageUrl: '' }];
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
});

test('abandoned uploads expire and saved references are rechecked before cleanup', async () => {
  const f = createFixture();
  const unused = f.addAsset({ expiresAt: past() });
  const referenced = f.addAsset({ expiresAt: past() });
  f.state.events.get('event').imageUrl = referenced.url;
  const result = await f.storage.runImageCleanup();
  assert.equal(result.deleted, 1);
  assert.equal(result.retained, 1);
  assert.equal(f.state.assets.has(unused.publicId), false);
  assert.equal(f.state.assets.get(referenced.publicId).expiresAt, null);
});

test('legacy saved owned images are adopted without claiming external URLs or allowing stale/foreign saves', async () => {
  const f = createFixture();
  const legacy = f.addAsset(); f.state.assets.clear();
  f.state.events.get('event').imageUrl = legacy.url;
  await f.actions.updateEvent('event', f.saveForm('https://example.com/photo.jpg'));
  assert.equal(f.state.assets.get(legacy.publicId).state, 'DELETE_PENDING');
  assert.equal((await f.actions.updateEvent('event', f.saveForm(legacy.url))).ok, false);
  const foreign = f.url('cheetahinvite/another/event/00000000-0000-4000-8000-000000000000');
  assert.equal((await f.actions.updateEvent('event', f.saveForm(foreign))).ok, false);
  assert.equal(f.state.events.get('event').imageUrl, 'https://example.com/photo.jpg');
});

test('cleanup endpoint requires its own secret and does not leak per-asset details', async () => {
  const f = createFixture();
  const { GET } = f.load('app/api/internal/images/cleanup/route.ts');
  assert.equal((await GET(new Request('http://localhost/cleanup'))).status, 401);
  assert.equal((await GET(new Request('http://localhost/cleanup', { headers: { authorization: 'Bearer wrong' } }))).status, 401);
  const response = await GET(new Request('http://localhost/cleanup', { headers: { authorization: 'Bearer cron-test-secret' } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: 0, retained: 0, failed: 0, invitations: { archived: 0, deleted: 0, retained: 0, failed: 0 } });
  delete process.env.CRON_SECRET;
  assert.equal((await GET(new Request('http://localhost/cleanup'))).status, 503);
});
