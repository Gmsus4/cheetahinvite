/* eslint-disable @typescript-eslint/no-require-imports -- Isolated authorization, pricing, publishing and courtesy checks. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');

const submit = async promise => { try { await promise; assert.fail('Expected navigation'); } catch (error) { if (!error.url) throw error; return error.url; } };
function adminFixture() {
  const f = createFixture();
  f.state.users.get('owner').role = 'ADMIN';
  f.admin = f.load('app/admin/actions.ts');
  return f;
}
function completeEvent(f, changes = {}) {
  Object.assign(f.state.events.get('event'), { name: 'Nombre elegido por el operador', eventType: 'wedding', hostNames: 'Anfitriones de prueba', eventDate: new Date('2027-05-20T12:00:00Z'), eventTime: '18:00', venue: 'Lugar de prueba', address: 'Dirección de prueba', privacy: 'PUBLIC', accent: '#E9560A', ...changes });
}

test('every administrative action rejects anonymous, normal and revoked accounts before any mutation', async () => {
  const f = adminFixture();
  for (const identity of [null, 'owner', 'deleted']) {
    f.owner = identity;
    f.state.users.get('owner').role = 'USER';
    for (const [name, action] of Object.entries(f.admin)) {
      await assert.rejects(action(new FormData(), new FormData()), error => Boolean(error.status === 404 || error.url?.startsWith('/login')), name);
    }
  }
  assert.equal(f.state.audit.size, 0);
  assert.equal(f.state.prices.size, 0);
  assert.equal(f.state.examples.size, 0);
  assert.equal(f.state.courtesy.size, 0);
});

test('price changes validate cents, keep immutable history and reject stale submissions', async () => {
  const f = adminFixture();
  const { parsePriceAmount } = f.load('lib/admin-validation.ts');
  assert.equal(parsePriceAmount('299.99'), 29999);
  for (const value of ['9.99', '0', '-25', '20.123', '1e3', 'NaN', '1000000']) assert.equal(parsePriceAmount(value), null);
  const form = new FormData();
  form.set('amount', '299.99'); form.set('reason', 'Cambio de prueba'); form.set('expectedPriceId', 'default');
  assert.match(await submit(f.admin.savePrice(form)), /saved=1/);
  assert.equal((await f.load('lib/site-pricing.ts').getCurrentPrice()).amount, 29999);
  assert.equal(f.state.prices.size, 1);
  assert.match(await submit(f.admin.savePrice(form)), /error=/);
  assert.equal(f.state.prices.size, 1);
  const current = [...f.state.prices.values()][0];
  form.set('expectedPriceId', current.id); form.set('effectiveAt', '2030-01-01T12:00'); form.set('amount', '350');
  await submit(f.admin.savePrice(form));
  assert.equal((await f.load('lib/site-pricing.ts').getCurrentPrice()).amount, 29999);
  const future = [...f.state.prices.values()].find(p => p.amount === 35000);
  await submit(f.admin.cancelScheduledPrice(future.id));
  assert.ok(f.state.prices.get(future.id).cancelledAt);
  assert.equal(f.state.prices.get(current.id).amount, 29999);
});

test('new checkout uses the configured price while old paid purchases retain their original amount', async () => {
  const f = createPaymentFixture();
  f.currentPrice = { id: 'revision', amount: 34950, currency: 'mxn' };
  f.events.set('event-fixture', { ...f.eventDetails, id: 'event-fixture', ownerId: f.ownerId, name: 'Evento', paidAt: null, status: 'DRAFT', privacy: 'PUBLIC' });
  await f.checkout.prepareInvitationCheckout('event-fixture', f.ownerId);
  assert.equal([...f.payments.values()][0].amount, 34950);
  assert.equal(f.calls.find(call => call[0] === 'create')[1].line_items[0].price_data.unit_amount, 34950);
  const previous = f.addPurchase({ id: 'earlier-purchase', eventId: 'earlier-event', amount: 26900 });
  await f.fulfillment.fulfillInvitationPayment(previous.session);
  assert.equal(f.payments.get('earlier-purchase').amount, 26900);
});

test('the example collection starts empty and blank drafts are created only by explicit submission', async () => {
  const f = adminFixture();
  assert.equal(f.state.examples.size, 0);
  const originalEvents = f.state.events.size;
  const form = new FormData(); form.set('label', 'Mi ejemplo'); form.set('eventType', 'wedding'); form.set('slug', 'mi-ejemplo');
  assert.match(await submit(f.admin.createExample(form)), /\/admin\/disenos\/.+\/editar/);
  assert.equal(f.state.examples.size, 1);
  const example = [...f.state.examples.values()][0];
  const event = f.state.events.get(example.eventId);
  assert.equal(event.hostNames, undefined);
  assert.deepEqual(event.sections, []);
  assert.equal(event.isExample, true);
  assert.equal(event.paidAt, null);
  assert.equal(f.state.users.get('owner').invitationCount, 1);
  assert.equal(f.state.events.size, originalEvents + 1);
});

test('public examples use an explicit snapshot; saving a draft cannot leak unpublished changes', async () => {
  const f = adminFixture();
  completeEvent(f, { isExample: true });
  f.state.examples.set('example', { id: 'example', eventId: 'event', slug: 'mi-diseno', label: 'Mi diseño', publishedAt: null, showInHero: true, showInCatalog: true, position: 0 });
  const form = new FormData(); form.set('version', '0');
  await submit(f.admin.publishExample('example', form));
  const service = f.load('lib/showcase.ts');
  assert.equal((await service.getShowcaseInvitation('mi-diseno')).hostNames, 'Anfitriones de prueba');
  f.state.events.get('event').hostNames = 'Cambio privado';
  f.state.events.get('event').contentVersion = 1;
  assert.equal((await service.getShowcaseInvitation('mi-diseno')).hostNames, 'Anfitriones de prueba');
  assert.match(await submit(f.admin.publishExample('example', form)), /error=/);
  form.set('version', '1');
  await submit(f.admin.publishExample('example', form));
  assert.equal((await service.getShowcaseInvitation('mi-diseno')).hostNames, 'Cambio privado');
  await submit(f.admin.unpublishExample('example'));
  assert.equal(await service.getShowcaseInvitation('mi-diseno'), null);
  f.state.settings.set('site', { id: 'site', useCustomExamples: true });
  assert.deepEqual(await service.getShowcaseExamples('hero'), []);
});

test('a courtesy publishes without a payment, enforces expiry and revocation, and keeps financial records empty', async () => {
  const f = adminFixture(); completeEvent(f);
  const service = f.load('lib/courtesy.ts');
  const grant = await service.grantCourtesy('owner', 'event', 'owner', 'Colaboración de prueba', new Date(Date.now() + 86400000));
  const event = f.state.events.get('event');
  assert.equal(event.paidAt, null);
  assert.ok(event.complimentaryAt);
  assert.equal(event.status, 'PUBLISHED');
  assert.equal(f.state.payments.size, 0);
  assert.equal(f.load('lib/invitation-payment.ts').isInvitationPublished(event), true);
  assert.equal(f.load('lib/invitation-payment.ts').isInvitationPublished(event, new Date(Date.now() + 2 * 86400000)), false);
  assert.ok(await f.load('lib/public-invitation.ts').getPublicInvitation(event.slug, undefined, true));
  await service.revokeCourtesy('owner', grant.id, 'Retirada de prueba');
  assert.equal(f.state.events.get('event').complimentaryAt, null);
  assert.equal(f.state.events.get('event').status, 'DRAFT');
  assert.equal(f.state.courtesy.size, 1);
  assert.ok(f.state.courtesy.get(grant.id).revokedAt);
});

test('courtesies cannot replace a paid or ambiguous checkout and simultaneous grants have one winner', async () => {
  const f = adminFixture(); completeEvent(f);
  const service = f.load('lib/courtesy.ts');
  const args = ['owner', 'event', 'owner', 'Motivo de prueba', new Date(Date.now() + 86400000)];
  f.state.payments.set('pending', { id: 'pending', eventId: 'event', status: 'PENDING' });
  await assert.rejects(service.grantCourtesy(...args), /pago en proceso/);
  f.state.payments.get('pending').status = 'FAILED';
  await assert.rejects(service.grantCourtesy(...args), /intento fallido sin cerrar/);
  f.state.payments.clear();
  f.state.events.get('event').paidAt = new Date();
  await assert.rejects(service.grantCourtesy(...args), /sin pago/);
  f.state.events.get('event').paidAt = null;
  const results = await Promise.allSettled([service.grantCourtesy(...args), service.grantCourtesy(...args)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(f.state.courtesy.size, 1);
});

test('a courtesy for an incomplete draft stays private until its owner finishes and explicitly publishes', async () => {
  const f = adminFixture();
  f.state.events.get('event').privacy = 'UNSET';
  const service = f.load('lib/courtesy.ts');
  await service.grantCourtesy('owner', 'event', 'owner', 'Publicación de prueba', new Date(Date.now() + 86400000));
  assert.equal(f.state.events.get('event').status, 'DRAFT');
  completeEvent(f);
  assert.deepEqual(await f.actions.publishEvent('event', 0), { ok: true, eventId: 'event', version: 0 });
  assert.equal(f.state.events.get('event').status, 'PUBLISHED');
});

test('revoking an administrator also blocks the existing invitation editor for their examples', async () => {
  const f = adminFixture();
  completeEvent(f, { isExample: true });
  f.state.users.get('owner').role = 'USER';
  const result = await f.actions.updateEvent('event', f.saveForm());
  assert.equal(result.ok, false);
  assert.equal(result.code, 'auth');
  assert.equal(f.state.events.get('event').contentVersion, 0);
});

test('anonymous measurement deduplicates sessions, rejects invalid events and respects privacy preferences', async () => {
  const f = adminFixture();
  f.owner = null;
  const previousSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = 'isolated-analytics-secret';
  try {
    const { POST } = f.load('app/api/analytics/route.ts');
    const visitor = require('node:crypto').randomUUID();
    const request = (body = { kind: 'landing_view', visitor }, headers = {}) => new Request('http://localhost/api/analytics', { method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
    for (const headers of [{ origin: 'https://other.invalid' }, { dnt: '1' }, { 'sec-gpc': '1' }]) await POST(request(undefined, headers));
    await POST(request({ kind: 'invalid', visitor }));
    await POST(request({ kind: 'example_select', exampleSlug: 'nonexistent-example', visitor }));
    assert.equal(f.state.analytics.size, 0);
    await Promise.all([POST(request()), POST(request()), POST(request())]);
    assert.equal(f.state.analytics.size, 1);
    const entry = [...f.state.analytics.values()][0];
    assert.ok(!JSON.stringify(entry).includes(visitor));
    const exampleSlug = f.load('lib/landing-invitation-example.ts').landingEventExamples[0].slug;
    await POST(request({ kind: 'example_select', exampleSlug, visitor }));
    assert.equal(f.state.analytics.size, 2);
    f.owner = 'owner';
    await POST(request({ kind: 'landing_view', visitor: require('node:crypto').randomUUID() }));
    assert.equal(f.state.analytics.size, 2);
  } finally { if (previousSecret === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = previousSecret; }
});

test('published example photos remain retained while the draft changes, then are cleaned after replacement', async () => {
  const oldConfig = Object.fromEntries(['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_UPLOAD_PRESET'].map(key => [key, process.env[key]]));
  process.env.CLOUDINARY_CLOUD_NAME = 'test';
  process.env.CLOUDINARY_API_KEY = 'fixture-key';
  process.env.CLOUDINARY_API_SECRET = 'fixture-secret';
  process.env.CLOUDINARY_UPLOAD_PRESET = 'fixture-preset';
  try {
    const f = adminFixture();
    const asset = f.addAsset();
    const previous = { imageUrl: asset.url, sections: [], isExample: true };
    const next = { imageUrl: '', sections: [], isExample: true };
    Object.assign(f.state.events.get('event'), next);
    f.state.examples.set('example', { id: 'example', eventId: 'event', publishedAt: new Date(), publishedContent: previous });
    await f.storage.syncCloudinaryImages(f.prisma, 'owner', 'event', previous, next);
    assert.equal(f.state.assets.get(asset.publicId).state, 'READY');
    await f.storage.runCloudinaryCleanup('owner', 5);
    assert.ok(f.state.assets.has(asset.publicId));
    f.state.examples.get('example').publishedContent = next;
    await f.storage.syncCloudinaryImages(f.prisma, 'owner', 'event', next, next);
    assert.equal(f.state.assets.get(asset.publicId).state, 'DELETE_PENDING');
    await f.storage.runCloudinaryCleanup('owner', 5);
    assert.equal(f.state.assets.has(asset.publicId), false);
  } finally { for (const [key, value] of Object.entries(oldConfig)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});

test('hero previews optimize their own copy without changing full-size public example images', () => {
  const f = adminFixture();
  const { showcasePreview } = f.load('lib/showcase.ts');
  const content = { imageUrl: 'https://res.cloudinary.com/test/image/upload/v123/folder/photo.jpg', backgroundImageUrl: '', sections: [{ imageUrl: '', imageUrls: ['https://external.invalid/photo.jpg'] }] };
  const before = structuredClone(content);
  const preview = showcasePreview(content);
  assert.match(preview.imageUrl, /c_limit,w_640,q_auto,f_auto/);
  assert.equal(preview.sections[0].imageUrls[0], content.sections[0].imageUrls[0]);
  assert.deepEqual(content, before);
});

test('all migrations preserve existing accounts, default to normal access, and create no example invitations', async () => {
  const { PGlite } = require('@electric-sql/pglite');
  const db = new PGlite();
  try {
    const root = 'prisma/migrations';
    const folders = fs.readdirSync(root).filter(name => fs.existsSync(path.join(root, name, 'migration.sql'))).sort();
    for (const folder of folders.filter(name => name !== '20261108000001_admin_workspace')) await db.exec(fs.readFileSync(path.join(root, folder, 'migration.sql'), 'utf8'));
    await db.query('INSERT INTO "User" (id, email, "invitationCount") VALUES ($1, $2, 2)', ['existing', 'fixture@example.invalid']);
    await db.exec(fs.readFileSync(path.join(root, '20261108000001_admin_workspace/migration.sql'), 'utf8'));
    assert.equal((await db.query('SELECT role FROM "User" WHERE id = $1', ['existing'])).rows[0].role, 'USER');
    assert.equal((await db.query('SELECT count(*)::int AS count FROM "ShowcaseExample"')).rows[0].count, 0);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM "Event"')).rows[0].count, 0);
    await assert.rejects(db.query('UPDATE "User" SET role = $1 WHERE id = $2', ['OWNER', 'existing']), /check constraint/);
    await assert.rejects(db.query('INSERT INTO "PriceRevision" (id, amount, "effectiveAt", "actorId", reason) VALUES ($1, 1, NOW(), $2, $3)', ['bad-price', 'existing', 'Invalid']), /check constraint/);
  } finally { await db.close(); }
});
