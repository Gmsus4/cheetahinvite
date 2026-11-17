/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

const submit = async promise => { try { await promise; assert.fail('Expected navigation'); } catch (error) { if (!error.url) throw error; return error.url; } };

function setup() {
  const f = createFixture();
  f.state.users.get('owner').role = 'ADMIN';
  Object.assign(f.state.events.get('event'), { isExample: true, name: 'Celebración', eventType: 'wedding', hostNames: 'Alex y Sam', eventDate: new Date('2027-05-20T12:00:00Z'), eventTime: '18:00', venue: 'Salón', address: 'Centro', privacy: 'PUBLIC', accent: '#E9560A' });
  f.state.examples.set('example', { id: 'example', eventId: 'event', slug: 'diseno', label: 'Diseño', publishedAt: null });
  const form = new FormData(); form.set('version', '0');
  return { f, form, admin: f.load('app/admin/actions.ts'), previews: f.load('lib/demo-preview.ts') };
}

test('publishing stores the capture with the exact published content and strips image bytes from the public invitation', async () => {
  const { f, form, admin, previews } = setup();
  assert.match(await submit(admin.publishExample('example', form)), /saved=1/);
  const first = structuredClone(f.state.examples.get('example').publishedContent);
  assert.ok(previews.readDemoPreview(first));
  const firstUrl = previews.demoPreviewImage(first, 'diseno');
  assert.match(firstUrl, /^\/api\/demo-previews\/diseno\/[a-f0-9]{24}$/);
  assert.equal((await f.load('lib/showcase.ts').getShowcaseInvitation('diseno')).demoPreview, undefined);
  Object.assign(f.state.events.get('event'), { hostNames: 'Nuevos nombres', imageUrl: '/new-photo.webp', contentVersion: 1 });
  form.set('version', '1');
  f.demoCapture = async (_id, _version, invitation) => {
    assert.deepEqual(f.state.examples.get('example').publishedContent, first);
    return previews.createDemoPreview(invitation, Buffer.from('new-image-bytes'));
  };
  assert.match(await submit(admin.publishExample('example', form)), /saved=1/);
  const updated = f.state.examples.get('example').publishedContent;
  assert.equal(updated.hostNames, 'Nuevos nombres');
  assert.equal(updated.imageUrl, '/new-photo.webp');
  assert.notEqual(previews.demoPreviewImage(updated, 'diseno'), firstUrl);
  assert.equal(f.demoCaptures.length, 2);
});

test('capture failures and edits during capture preserve the previous publication', async () => {
  const { f, form, admin, previews } = setup();
  await submit(admin.publishExample('example', form));
  const first = structuredClone(f.state.examples.get('example'));
  f.demoCapture = async () => { throw Error('Capture unavailable'); };
  assert.match(decodeURIComponent(await submit(admin.publishExample('example', form))), /No pudimos generar/);
  assert.deepEqual(f.state.examples.get('example'), first);
  f.demoCapture = async (_id, _version, invitation) => {
    f.state.events.get('event').contentVersion++;
    return previews.createDemoPreview(invitation, Buffer.from('changed-during-capture'));
  };
  assert.match(decodeURIComponent(await submit(admin.publishExample('example', form))), /borrador cambió/);
  assert.deepEqual(f.state.examples.get('example'), first);
});

test('the image endpoint serves only the matching published image and never a draft or withdrawn example', async () => {
  const { f, form, admin } = setup();
  await submit(admin.publishExample('example', form));
  const key = f.state.examples.get('example').publishedContent.demoPreview.key;
  const route = f.load('app/api/demo-previews/[slug]/[key]/route.ts');
  const get = key => route.GET(new Request('http://localhost/image'), { params: Promise.resolve({ slug: 'diseno', key }) });
  const response = await get(key);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/webp');
  assert.match(response.headers.get('Cache-Control'), /immutable/);
  assert.equal(await response.text(), 'fixture-webp');
  assert.equal((await get('a'.repeat(24))).status, 404);
  await submit(admin.unpublishExample('example'));
  assert.equal((await get(key)).status, 404);
});

test('revoking an administrator while the capture runs prevents publication', async () => {
  const { f, form, admin, previews } = setup();
  f.demoCapture = async (_id, _version, invitation) => {
    f.state.users.get('owner').role = 'USER';
    return previews.createDemoPreview(invitation, Buffer.from('revoked-before-publishing'));
  };
  await assert.rejects(admin.publishExample('example', form), error => error.status === 404);
  assert.equal(f.state.examples.get('example').publishedAt, null);
});

test('capture tokens expire and cannot be reused for another example or draft version', () => {
  const f = createFixture();
  const tokens = f.load('lib/demo-capture-token.ts');
  const previous = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = 'test-only-capture-secret';
  try {
    const now = 1_800_000_000_000;
    const { expires, token } = tokens.demoCaptureToken('example', 3, now);
    assert.equal(tokens.validDemoCaptureToken('example', 3, expires, token, now), true);
    assert.equal(tokens.validDemoCaptureToken('other', 3, expires, token, now), false);
    assert.equal(tokens.validDemoCaptureToken('example', 4, expires, token, now), false);
    assert.equal(tokens.validDemoCaptureToken('example', 3, expires, token, Number(expires)), false);
    assert.equal(tokens.validDemoCaptureToken('example', 3, expires, 'bad-token', now), false);
  } finally { if (previous === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = previous; }
});
