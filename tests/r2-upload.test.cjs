/* eslint-disable @typescript-eslint/no-require-imports -- Exercise routes with isolated SQL and R2 bindings. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
beforeEach(() => { process.env.APP_URL = 'http://localhost'; });
const past = () => new Date(Date.now() - 1000);

test('R2 uploads reserve 5 MB, decode bytes and store only the server-produced image', async () => {
  const f = createFixture();
  const url = await f.client.uploadInvitationImage(new File([new Uint8Array(5_000_000)], 'large.png', { type: 'image/png' }), 'event');
  const [asset] = f.state.assets.values();
  assert.equal(asset.provider, 'R2'); assert.equal(asset.state, 'READY'); assert.equal(asset.bytes, 100);
  assert.equal(url, f.url(asset.publicId)); assert.ok(asset.expiresAt > new Date(Date.now() + 23 * 3600_000));
  assert.equal(f.requests.length, 1); assert.equal(f.requests[0].method, 'PUT');
  assert.equal(f.requests[0].options.onlyIf.etagDoesNotMatch, '*');
  assert.equal((await f.actions.updateEvent('event', f.saveForm(url))).ok, true);
});

test('R2 grants carry no credentials and cannot be used for another owner or event', async () => {
  const f = createFixture(), grant = await f.issue();
  assert.deepEqual(Object.keys(grant), ['publicId']);
  assert.equal(f.requests.length, 0);
  f.owner = 'other'; assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 400);
  f.owner = 'owner'; assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId, { eventId: 'other' }))).status, 400);
  assert.equal((await f.route.PUT(f.confirmRequest('invalid'))).status, 400);
  f.state.assets.get(grant.publicId).expiresAt = past();
  assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 409);
  assert.equal(f.requests.length, 0);
});

test('invalid image bytes, SVG, pixel bombs, oversized and unbounded request bodies never reach R2', async () => {
  for (const info of [{ format: 'image/svg+xml' }, { width: 100_000, height: 100_000 }, { width: 0 }]) {
    const f = createFixture(), grant = await f.issue(); f.imageInfo = info;
    assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 400);
    assert.equal(f.requests.length, 0);
  }
  const f = createFixture(), grant = await f.issue(); f.decodeError = true;
  assert.notEqual((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 200);
  assert.equal(f.requests.length, 0);
  const request = new Request(f.confirmRequest(grant.publicId).url, { method: 'PUT', duplex: 'half', headers: { origin: 'http://localhost', 'content-type': 'image/png' }, body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(5 * 1024 * 1024 + 1)); c.close(); } }) });
  assert.equal(request.headers.has('content-length'), false);
  assert.equal((await f.route.PUT(request)).status, 413);
  assert.equal(f.requests.length, 0);
});

test('lost responses and concurrent uploads reuse one immutable object without renewing the temporary lease', async () => {
  const f = createFixture(); f.loseConfirmationResponse = true;
  const url = await f.client.uploadInvitationImage(new File(['image'], 'image.png', { type: 'image/png' }), 'event');
  const [asset] = f.state.assets.values(), expires = asset.expiresAt.getTime();
  const responses = await Promise.all([f.route.PUT(f.confirmRequest(asset.publicId)), f.route.PUT(f.confirmRequest(asset.publicId))]);
  for (const response of responses) assert.equal((await response.json()).secureUrl, url);
  assert.equal(f.requests.length, 1); assert.equal(f.state.assets.get(asset.publicId).expiresAt.getTime(), expires);
});

test('failed R2 writes remain charged and abandoned reservations enter durable cleanup', async () => {
  const f = createFixture(), grant = await f.issue(); f.failure = 'unavailable';
  assert.equal((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 503);
  assert.equal(f.state.assets.get(grant.publicId).bytes, 5 * 1024 * 1024);
  assert.equal(f.state.assets.get(grant.publicId).state, 'UPLOADING');
  f.failure = null; f.state.assets.get(grant.publicId).expiresAt = past();
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
});

test('deleting or expiring an event during validation prevents a late R2 write', async () => {
  for (const change of [f => f.state.events.delete('event'), f => { f.state.events.get('event').status = 'ARCHIVED'; }]) {
    const f = createFixture(), grant = await f.issue();
    f.env.IMAGES.info = async () => { change(f); return { format: 'image/png', width: 10, height: 10 }; };
    assert.notEqual((await f.route.PUT(f.confirmRequest(grant.publicId))).status, 200);
    assert.equal(f.requests.length, 0);
  }
});

test('R2 cleanup cannot touch historical Cloudinary rows or their URLs', async () => {
  const f = createFixture();
  const asset = f.addAsset({ provider: 'CLOUDINARY', url: 'https://res.cloudinary.com/legacy/image/upload/v1/photo.jpg', state: 'DELETE_PENDING', nextAttemptAt: past() });
  assert.equal((await f.storage.runImageCleanup()).deleted, 0);
  assert.ok(f.state.assets.has(asset.publicId)); assert.equal(f.requests.length, 0);
});

test('media delivery serves only verified R2 objects, preserves shared pending images and revalidates deletion', async () => {
  const f = createFixture(), grant = await f.issue();
  const { GET } = f.load('app/api/media/[...key]/route.ts');
  const get = () => GET(new Request(f.url(grant.publicId)), { params: Promise.resolve({ key: grant.publicId.split('/') }) });
  assert.equal((await get()).status, 404);
  await f.route.PUT(f.confirmRequest(grant.publicId));
  const response = await get(); assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/webp'); assert.match(response.headers.get('cache-control'), /must-revalidate/);
  f.state.assets.get(grant.publicId).state = 'DELETE_PENDING';
  f.state.assets.get(grant.publicId).nextAttemptAt = past();
  f.state.events.get('event').imageUrl = f.url(grant.publicId);
  assert.equal((await f.storage.runImageCleanup()).retained, 1);
  assert.equal((await get()).status, 200);
  f.state.events.get('event').imageUrl = '';
  f.state.assets.get(grant.publicId).nextAttemptAt = past();
  assert.equal((await f.storage.runImageCleanup()).deleted, 1);
  assert.equal((await get()).status, 404);
});
