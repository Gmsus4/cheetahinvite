/* eslint-disable @typescript-eslint/no-require-imports -- Exercise real routes/actions with isolated database and provider doubles. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const HOUR = 60 * 60 * 1000;
const MAX = 5 * 1024 * 1024;
beforeEach(() => {
  Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'test', CLOUDINARY_API_SECRET: 'private-test-secret', CLOUDINARY_UPLOAD_PRESET: 'test', CRON_SECRET: 'cron-test-secret' });
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
  assert.equal(f.requests.length, 1);
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

test('signs one reserved public ID without sending a file or revealing the API secret', async () => {
  const f = createFixture();
  const grant = await f.issue();
  const [asset] = f.state.assets.values();
  assert.equal(grant.publicId, asset.publicId);
  assert.equal(grant.fields.public_id, asset.publicId);
  assert.equal(grant.fields.overwrite, 'false');
  assert.equal(grant.fields.allowed_formats, 'jpg,png,webp,avif');
  assert.match(grant.fields.eval, /resource_info.bytes>5242880/);
  assert.equal(grant.uploadUrl, 'https://api.cloudinary.com/v1_1/test/image/upload');
  assert.equal(asset.state, 'UPLOADING');
  assert.equal(asset.bytes, MAX);
  assert.ok(asset.expiresAt > new Date(Date.now() + 69 * 60 * 1000));
  assert.equal(asset.nextAttemptAt.getTime(), asset.expiresAt.getTime());
  assert.equal(f.requests.every(r => r.method !== 'POST'), true);
  assert.equal(JSON.stringify(grant).includes(process.env.CLOUDINARY_API_SECRET), false);
  assert.equal((await f.actions.updateEvent('event', f.saveForm(f.url(asset.publicId)))).ok, false);
});

test('a file above the Vercel payload limit travels only to Cloudinary and confirmed bytes come from the provider', async () => {
  const f = createFixture();
  const file = new File([new Uint8Array(5_000_000)], 'large.png', { type: 'image/png' });
  const url = await f.client.uploadInvitationImage(file, 'event');
  const [asset] = f.state.assets.values();
  assert.equal(asset.url, url);
  assert.equal(asset.bytes, file.size);
  assert.equal(asset.state, 'READY');
  assert.ok(asset.expiresAt > new Date(Date.now() + 23 * HOUR));
  assert.equal(f.requests.filter(r => r.form instanceof FormData && r.form.has('file')).length, 1);
  assert.equal(f.clientCalls.length, 2);
  for (const call of f.clientCalls) {
    assert.equal(typeof call.body, 'string');
    assert.ok(Buffer.byteLength(call.body) < 1024);
    assert.equal(call.headers['Content-Type'], 'application/json');
  }
  const adminRequest = f.requests.find(r => r.url.includes('/resources/image/upload/'));
  assert.match(adminRequest.headers.Authorization, /^Basic /);
  assert.equal(adminRequest.cache, 'no-store');
  assert.equal((await f.actions.updateEvent('event', f.saveForm(url))).ok, true);
});

test('temporary verification failures preserve the upload for retry and abandoned grants are eventually cleaned', async () => {
  const f = createFixture();
  const grant = await f.issue();
  f.failure = 'connection lost';
  assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 503);
  const [asset] = f.state.assets.values();
  assert.equal(asset.state, 'UPLOADING');
  assert.equal(asset.bytes, MAX);
  assert.ok(asset.nextAttemptAt > new Date());
  f.failure = null;
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 0);
  asset.expiresAt = past();
  asset.nextAttemptAt = past();
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
  assert.equal(f.state.assets.size, 0);
  assert.equal([...f.state.budgets.values()].find(row => row.key.includes(':hour:')).count, 1);
});

test('mismatched or oversized provider assets are rejected even when browser metadata claims a valid image', async () => {
  for (const override of [{ public_id: 'foreign' }, { bytes: MAX + 1 }, { resource_type: 'raw' }, { format: 'svg' }, { version: 124 }, { secure_url: 'https://example.com/forged.png' }]) {
    const f = createFixture();
    const grant = await f.issue();
    f.responseOverride = id => Response.json({ public_id: id, secure_url: f.url(id), resource_type: 'image', type: 'upload', format: 'png', version: 123, bytes: 100, ...override });
    assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId, { bytes: 1, secure_url: f.url(grant.publicId) }))).status, 400);
    assert.equal([...f.state.assets.values()][0].state, 'DELETE_PENDING');
    assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 0);
    assert.equal(f.state.events.get('event').imageUrl, '');
  }
});

test('confirmation rejects forged signatures and cross-account, expired or deleted reservations before provider access', async () => {
  const f = createFixture(), grant = await f.issue();
  f.requests.length = 0;
  assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId, { signature: 'a'.repeat(40) }))).status, 400);
  f.owner = 'another';
  assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 400);
  f.owner = 'owner';
  f.state.assets.get(grant.publicId).expiresAt = past();
  assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 409);
  f.state.assets.delete(grant.publicId);
  assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 404);
  assert.equal(f.requests.length, 0);
});

test('lost or simultaneous confirmation responses are idempotent and never upload twice or renew the temporary lease', async () => {
  const f = createFixture(); f.loseConfirmationResponse = true;
  const url = await f.client.uploadInvitationImage(new File(['photo'], 'photo.png', { type: 'image/png' }), 'event');
  assert.equal(f.clientCalls.filter(r => r.method === 'PUT').length, 2);
  assert.equal(f.requests.filter(r => r.form instanceof FormData && r.form.has('file')).length, 1);
  const [asset] = f.state.assets.values(), originalExpiry = asset.expiresAt;
  const result = await Promise.all([f.route.PUT(f.confirmRequest(asset.publicId)), f.route.PUT(f.confirmRequest(asset.publicId))]);
  for (const response of result) assert.equal((await response.json()).secureUrl, url);
  assert.equal(f.state.assets.get(asset.publicId).expiresAt.getTime(), originalExpiry.getTime());
  assert.equal(f.state.assets.size, 1);
});

test('unrestricted or unsigned presets never issue a usable upload signature', async () => {
  for (const preset of [{ unsigned: true }, { unsigned: false, settings: {} }, { unsigned: false, settings: { allowed_formats: ['svg'] } }]) {
    const f = createFixture(); f.preset = preset;
    const response = await f.route.POST(f.uploadRequest());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).fields, undefined);
  }
});

test('simultaneous initial confirmations settle the same reservation once', async () => {
  const f = createFixture(), grant = await f.issue();
  f.putProviderAsset(grant.publicId);
  const responses = await Promise.all([f.route.PUT(f.confirmRequest(grant.publicId)), f.route.PUT(f.confirmRequest(grant.publicId))]);
  assert.deepEqual(responses.map(response => response.status), [200, 200]);
  const urls = await Promise.all(responses.map(response => response.json()));
  assert.equal(urls[0].secureUrl, urls[1].secureUrl);
  assert.equal(f.state.assets.size, 1);
  assert.equal([...f.state.assets.values()][0].bytes, 100);
});

test('expired upload signatures trigger variant cleanup without deleting a saved or still-temporary image', async () => {
  const f = createFixture();
  const saved = f.addAsset({ nextAttemptAt: past() });
  const temporary = f.addAsset({ nextAttemptAt: past(), expiresAt: new Date(Date.now() + 24 * HOUR) });
  f.state.events.get('event').imageUrl = saved.url;
  const results = await Promise.all([f.storage.runCloudinaryCleanup(), f.storage.runCloudinaryCleanup()]);
  assert.equal(results.reduce((sum, result) => sum + result.retained, 0), 2);
  assert.equal(results.reduce((sum, result) => sum + result.deleted, 0), 0);
  assert.equal(f.requests.length, 4);
  assert.equal(f.requests.some(request => request.url.endsWith('/image/destroy')), false);
  assert.equal(f.state.assets.get(saved.publicId).state, 'READY');
  assert.equal(f.state.assets.get(temporary.publicId).state, 'READY');
  assert.equal(f.state.assets.get(saved.publicId).nextAttemptAt, null);
  assert.equal(f.state.assets.get(temporary.publicId).nextAttemptAt, null);
});

test('removed and deleted direct uploads cannot be destroyed while their upload signature remains valid', async () => {
  const f = createFixture();
  const url = await f.client.uploadInvitationImage(new File(['photo'], 'photo.png', { type: 'image/png' }), 'event');
  const [asset] = f.state.assets.values(), deadline = asset.nextAttemptAt.getTime();
  await f.actions.updateEvent('event', f.saveForm(url));
  await f.actions.updateEvent('event', f.saveForm());
  assert.equal(f.state.assets.get(asset.publicId).state, 'DELETE_PENDING');
  assert.equal(f.state.assets.get(asset.publicId).nextAttemptAt.getTime(), deadline);
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 0);
  await f.actions.deleteEvent('event');
  assert.equal(f.state.assets.get(asset.publicId).nextAttemptAt.getTime(), deadline);
  f.state.assets.get(asset.publicId).nextAttemptAt = past();
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
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
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
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
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 0);
  await f.actions.updateEvent('event', f.saveForm());
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
});

test('event deletion retains its durable cleanup records, defers in-flight uploads and rejects other owners', async () => {
  const f = createFixture();
  const image = f.addAsset();
  f.state.events.get('event').imageUrl = image.url;
  const pending = await f.storage.reserveCloudinaryImage('owner', 'event');
  f.owner = 'other'; f.state.users.set('other', { id: 'other' });
  await f.actions.deleteEvent('event');
  assert.equal(f.state.events.has('event'), true);
  f.owner = 'owner';
  assert.equal((await f.actions.deleteEvent('event')).error, null);
  assert.equal(f.state.events.has('event'), false);
  assert.equal(f.state.assets.get(image.publicId).state, 'DELETE_PENDING');
  assert.ok(f.state.assets.get(pending.publicId).nextAttemptAt > new Date());
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
  assert.equal(f.state.assets.has(pending.publicId), true);
  await assert.rejects(f.storage.finishCloudinaryImage('owner', 'event', pending.publicId, f.url(pending.publicId), 100));
  f.state.assets.get(pending.publicId).nextAttemptAt = past();
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
});

test('cleanup preserves legacy images referenced by another event and deletes after that reference disappears', async () => {
  const f = createFixture();
  const image = f.addAsset({ state: 'DELETE_PENDING', nextAttemptAt: past() });
  f.state.events.set('shared', { id: 'shared', ownerId: 'another', sections: [{ imageUrl: image.url, enabled: false }] });
  assert.equal((await f.storage.runCloudinaryCleanup()).retained, 1);
  assert.equal(f.requests.length, 0);
  f.state.events.delete('shared');
  f.state.assets.get(image.publicId).nextAttemptAt = past();
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
});

test('cleanup failures keep storage charged and concurrent workers do not destroy the same image twice', async () => {
  const f = createFixture();
  const image = f.addAsset({ state: 'DELETE_PENDING', nextAttemptAt: past() });
  f.failure = 'provider unavailable';
  assert.equal((await f.storage.runCloudinaryCleanup()).failed, 1);
  assert.equal(f.state.assets.has(image.publicId), true);
  assert.ok(f.state.assets.get(image.publicId).nextAttemptAt > new Date());
  f.failure = null;
  f.state.assets.get(image.publicId).nextAttemptAt = past();
  f.requests.length = 0;
  const results = await Promise.all([f.storage.runCloudinaryCleanup(), f.storage.runCloudinaryCleanup()]);
  assert.equal(results.reduce((sum, r) => sum + r.deleted, 0), 1);
  assert.equal(f.requests.filter(r => r.url.endsWith('/image/destroy')).length, 1);
  assert.equal(f.requests.length, 3);
  for (const request of f.requests) {
    assert.equal(request.form.get('invalidate'), 'true');
    assert.equal(request.form.get('public_id'), image.publicId);
  }
});

test('image identifiers mentioned only in text do not block cleanup', async () => {
  const f = createFixture();
  const image = f.addAsset({ state: 'DELETE_PENDING', nextAttemptAt: past() });
  f.state.events.get('event').sections = [{ type: 'custom', content: image.publicId, imageUrl: '' }];
  assert.equal((await f.storage.runCloudinaryCleanup()).deleted, 1);
});

test('abandoned uploads expire and saved references are rechecked before cleanup', async () => {
  const f = createFixture();
  const unused = f.addAsset({ expiresAt: past() });
  const referenced = f.addAsset({ expiresAt: past() });
  f.state.events.get('event').imageUrl = referenced.url;
  const result = await f.storage.runCloudinaryCleanup();
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
  const { GET } = f.load('app/api/internal/cloudinary/cleanup/route.ts');
  assert.equal((await GET(new Request('http://localhost/cleanup'))).status, 401);
  assert.equal((await GET(new Request('http://localhost/cleanup', { headers: { authorization: 'Bearer wrong' } }))).status, 401);
  const response = await GET(new Request('http://localhost/cleanup', { headers: { authorization: 'Bearer cron-test-secret' } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: 0, retained: 0, failed: 0 });
  delete process.env.CRON_SECRET;
  assert.equal((await GET(new Request('http://localhost/cleanup'))).status, 503);
});
