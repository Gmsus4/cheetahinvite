/* eslint-disable @typescript-eslint/no-require-imports -- Real RSVP handlers, no external services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRsvpFixture } = require('./helpers/rsvp-fixture.cjs');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

test('only the event owner can delete a response and deleted rows disappear from CSV', async () => {
  const f = createRsvpFixture();
  await f.submit();
  const row = [...f.responses.values()][0];
  const { deleteRsvpResponse } = f.load('app/dashboard/eventos/[id]/asistencias/actions.ts');
  const ownerId = f.ownerId;
  f.ownerId = null;
  assert.ok((await deleteRsvpResponse(f.eventId, row.id)).error);
  f.ownerId = 'another-owner';
  assert.ok((await deleteRsvpResponse(f.eventId, row.id)).error);
  assert.equal(f.responses.size, 1);
  f.ownerId = ownerId;
  f.responses.set('foreign-response', { ...row, id: 'foreign-response', eventId: 'another-event' });
  assert.equal((await deleteRsvpResponse(f.eventId, 'foreign-response')).error, null);
  assert.equal(f.responses.size, 2);
  assert.ok((await (await f.csv()).text()).includes(f.values.name));
  assert.equal((await deleteRsvpResponse(f.eventId, row.id)).error, null);
  assert.equal(f.responses.size, 1);
  assert.ok(!(await (await f.csv()).text()).includes(f.values.name));
  assert.ok(f.invalidations.includes(`/dashboard/eventos/${f.eventId}/asistencias`));
  assert.equal((await deleteRsvpResponse(f.eventId, row.id)).error, null);
});

test('integrated RSVP is opt-in and legacy/external/disabled sections never accept submissions', async () => {
  const f = createRsvpFixture();
  for (const sections of [[], [{ type: 'rsvp', enabled: false, rsvpMode: 'integrated' }], [{ type: 'rsvp', enabled: true, rsvpMode: 'external' }], [{ type: 'rsvp', enabled: true }]]) {
    f.events.get(f.eventId).sections = sections;
    assert.equal((await f.submit()).status, 404);
    assert.equal((await f.read()).status, 404);
  }
  assert.equal(f.responses.size, 0); assert.equal(f.budgets.size, 0);
});

test('only paid, published, unexpired invitations receive responses', async () => {
  const f = createRsvpFixture(); const original = structuredClone(f.events.get(f.eventId));
  for (const change of [{ status: 'DRAFT' }, { paidAt: null }, { status: 'SUSPENDED' }, { status: 'REFUNDED' }, { expiresAt: new Date(0) }]) {
    f.events.set(f.eventId, { ...original, ...change }); assert.equal((await f.submit()).status, 404);
  }
  f.events.clear(); assert.equal((await f.submit()).status, 404); assert.equal(f.responses.size, 0);
});

test('the principal guest may bring up to five extras; invalid counts and declines with companions are rejected', async () => {
  const f = createRsvpFixture();
  for (const change of [{ companions: 6 }, { companions: -1 }, { companions: 1.5 }, { companions: '5' }, { attending: false }, { attending: 'true' }, { name: '' }, { name: 'A' }, { name: 'a'.repeat(121) }, { name: 'Ana\nPérez' }, { token: 'guess' }, { website: 'https://bot.example' }]) assert.equal((await f.submit({ ...f.values, ...change })).status, 400);
  assert.equal(f.responses.size, 0);
  f.ownerId = null; // Guests never need an account to submit.
  const response = await f.submit(); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { response: { name: 'Ana Pérez', attending: true, companions: 5 } });
  const record = [...f.responses.values()][0]; assert.equal(record.companions + 1, 6);
  assert.notEqual(record.tokenHash, f.values.token); assert.equal(JSON.stringify(record).includes(f.values.token), false);
});

test('repeated delivery and an updated answer change one response instead of duplicating attendees', async () => {
  const f = createRsvpFixture();
  await Promise.all([f.submit(), f.submit()]); assert.equal(f.responses.size, 1);
  await f.submit({ ...f.values, attending: false, companions: 0 });
  const stored = (await (await f.read()).json()).response;
  assert.deepEqual(stored, { name: 'Ana Pérez', attending: false, companions: 0 });
  assert.equal(f.responses.size, 1);
});

test('visitors can retrieve only their own response and no keys or guest list are exposed', async () => {
  const f = createRsvpFixture(); await f.submit();
  const own = (await (await f.read()).json()).response;
  assert.deepEqual(Object.keys(own).sort(), ['attending', 'companions', 'name']);
  assert.deepEqual(await (await f.read('b'.repeat(64))).json(), { response: null });
  assert.equal((await f.read('invalid')).status, 400);
  f.eventId = 'another-event'; f.events.set(f.eventId, { ...f.events.get('event-fixture'), id: f.eventId });
  assert.deepEqual(await (await f.read()).json(), { response: null });
});

test('cross-origin, malformed and oversized payloads are rejected before any write', async () => {
  const f = createRsvpFixture();
  assert.equal((await f.submit(f.values, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await f.submit(f.values, { Origin: '' })).status, 403);
  assert.equal((await f.submit(f.values, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await f.submit({ ...f.values, name: 'a'.repeat(3000) })).status, 413);
  const request = new Request('http://localhost:3000/api/events/event-fixture/rsvp', { method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal((await f.route.POST(request, { params: Promise.resolve({ id: f.eventId }) })).status, 400);
  assert.equal(f.responses.size, 0); assert.equal(f.budgets.size, 0);
});

test('persistent limits are atomic across simultaneous submissions and remain bounded', async () => {
  const f = createRsvpFixture(); const { RSVP_LIMITS } = f.load('lib/rsvp.ts');
  await f.submit(); const budget = [...f.budgets.values()].find(row => row.key.includes(':event:')); budget.count = RSVP_LIMITS.submissionsPerHour - 1;
  const responses = await Promise.all([f.submit({ ...f.values, token: 'b'.repeat(64) }), f.submit({ ...f.values, token: 'c'.repeat(64) })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 429]); assert.equal(f.responses.size, 2);
  assert.equal([...f.budgets.values()].find(row => row.key.includes(':event:')).count, RSVP_LIMITS.submissionsPerHour);
  assert.equal(responses.find(r => r.status === 429).headers.get('Retry-After'), '3600');
});

test('one browser can update at most the configured hourly limit without adding duplicate rows', async () => {
  const f = createRsvpFixture(); const { RSVP_LIMITS } = f.load('lib/rsvp.ts');
  for (let index = 0; index < RSVP_LIMITS.updatesPerHour; index++) assert.equal((await f.submit()).status, 200);
  assert.equal((await f.submit()).status, 429); assert.equal(f.responses.size, 1);
  for (const budget of f.budgets.values()) budget.expiresAt = new Date(0);
  assert.equal((await f.submit()).status, 200); assert.equal(f.budgets.size, 2);
});

test('CSV requires the event owner, omits secret keys and neutralizes spreadsheet formulas', async () => {
  const f = createRsvpFixture(); await f.submit({ ...f.values, name: '=HYPERLINK("https://example.test")' });
  f.ownerId = null; assert.equal((await f.csv()).status, 401);
  f.ownerId = 'someone-else'; assert.equal((await f.csv()).status, 404);
  f.ownerId = 'owner-fixture'; const response = await f.csv(); assert.equal(response.status, 200);
  const csv = await response.text(); assert.match(csv, /'=HYPERLINK/); assert.match(csv, /"5","6"/);
  assert.equal(csv.includes([...f.responses.values()][0].tokenHash), false);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('RSVP mode survives editor saving, can be disabled and invalid modes are rejected', async () => {
  const f = createFixture(); const section = { id: 'rsvp', type: 'rsvp', title: 'Confirmación', content: '', detail: '', link: '', imageUrl: '', enabled: true, rsvpMode: 'integrated' };
  assert.equal((await f.actions.updateEvent('event', f.saveForm('', [section]))).ok, true);
  assert.equal(f.state.events.get('event').sections[0].rsvpMode, 'integrated');
  assert.equal((await f.actions.updateEvent('event', f.saveForm('', [{ ...section, enabled: false }]))).ok, true);
  assert.equal(f.state.events.get('event').sections[0].enabled, false);
  assert.equal((await f.actions.updateEvent('event', f.saveForm('', [{ ...section, rsvpMode: 'anything' }]))).code, 'validation');
});
