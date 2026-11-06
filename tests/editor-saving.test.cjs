/* eslint-disable @typescript-eslint/no-require-imports -- Exercise actual actions against an isolated data store. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

test('concurrent saves have one winner, retain the other copy and allow a deliberate retry', async () => {
  const f = createFixture();
  const first = f.saveForm(), second = f.saveForm(); first.set('name', 'Primera'); second.set('name', 'Segunda');
  const results = await Promise.all([f.actions.updateEvent('event', first), f.actions.updateEvent('event', second)]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.find(result => !result.ok).code, 'conflict');
  assert.equal(results.find(result => !result.ok).version, 1);
  second.set('contentVersion', '1');
  assert.equal((await f.actions.updateEvent('event', second)).version, 2);
  assert.equal(f.state.events.get('event').name, 'Segunda');
});

test('automatic writes cannot change a published invitation; manual writes still require its version', async () => {
  const f = createFixture(); const event = f.state.events.get('event'); event.paidAt = new Date(); event.status = 'PUBLISHED';
  const form = f.saveForm(); form.set('name', 'Nuevo nombre');
  assert.equal((await f.actions.updateEvent('event', form, 'auto')).code, 'published');
  assert.equal(f.state.events.get('event').name, 'Celebración');
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
});

test('validation, missing versions, session expiry and another owner return errors without redirects or mutation', async () => {
  const f = createFixture(); const initial = structuredClone(f.state.events.get('event'));
  const invalid = f.saveForm(); invalid.set('name', '');
  assert.equal((await f.actions.updateEvent('event', invalid)).code, 'validation');
  const missing = f.saveForm(); missing.delete('contentVersion');
  assert.equal((await f.actions.updateEvent('event', missing)).code, 'validation');
  f.owner = null; assert.equal((await f.actions.updateEvent('event', f.saveForm())).code, 'auth');
  f.owner = 'other'; f.state.users.set('other', { id: 'other' });
  assert.equal((await f.actions.updateEvent('event', f.saveForm())).code, 'not-found');
  assert.deepEqual(f.state.events.get('event'), initial);
});

test('publication rejects an outdated version before changing payment state', async () => {
  const f = createFixture();
  const form = f.saveForm();
  for (const [key, value] of Object.entries({ hostNames: 'Alex y Sam', eventDate: '2027-01-15', eventTime: '18:00', venue: 'Salón', address: 'Calle' })) form.set(key, value);
  await f.actions.updateEvent('event', form);
  assert.equal((await f.actions.publishEvent('event', 0)).code, 'conflict');
  assert.equal(f.state.events.get('event').status, 'DRAFT');
  assert.equal((await f.actions.publishEvent('event', 1)).ok, true);
  assert.equal(f.state.events.get('event').status, 'PENDING_PAYMENT');
});

test('creation retries and simultaneous requests reuse one draft and consume only one account slot', async () => {
  const f = createFixture(); const { prepareEvent } = f.load('app/crear/actions.ts');
  f.state.users.get('owner').invitationCount = 2;
  const form = f.saveForm(); form.set('creationKey', randomUUID());
  const results = await Promise.all([prepareEvent(form), prepareEvent(form)]);
  assert.equal(results.every(result => result.ok), true);
  assert.equal(results[0].eventId, results[1].eventId);
  assert.equal(f.state.users.get('owner').invitationCount, 3);
  assert.equal((await prepareEvent(form)).eventId, results[0].eventId);
  assert.equal(f.state.events.size, 2);
});

test('a save racing with publication returns the new version for an explicit conflict decision', async () => {
  const f = createFixture();
  Object.assign(f.state.events.get('event'), { eventType: 'wedding', hostNames: 'Alex y Sam', eventDate: new Date('2027-01-15T12:00:00Z'), eventTime: '18:00', venue: 'Salón', address: 'Calle' });
  f.prisma.event.updateMany = async () => { f.state.events.get('event').contentVersion = 1; return { count: 0 }; };
  const result = await f.actions.publishEvent('event', 0);
  assert.equal(result.code, 'conflict');
  assert.equal(result.version, 1);
  assert.equal(f.state.events.get('event').status, 'DRAFT');
});


test('global finishes persist independently and restore per-section choices after reload', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  const sections = [{ id: 'story', type: 'story', title: 'Historia', content: 'Nuestra historia', detail: '', link: '', imageUrl: '', enabled: true, panelStyle: 'color' }];
  for (const panelStyle of ['blur', 'blur-color', 'color', 'auto']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('panelStyle', panelStyle);
    form.set('sections', JSON.stringify(sections));
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const stored = f.state.events.get('event');
    assert.equal(stored.panelStyle, panelStyle);
    assert.equal(stored.sections[0].panelStyle, 'color');
    const restored = initialGuidedValues(stored);
    assert.equal(restored.panelStyle, panelStyle);
    assert.equal(restored.sections[0].panelStyle, 'color');
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  f.state.events.get('event').panelStyle = 'blur';
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').panelStyle, 'blur');
});

test('invalid global finishes are rejected without changing the saved invitation', async () => {
  const f = createFixture();
  const before = structuredClone(f.state.events.get('event'));
  for (const value of ['', 'invalid', 'BLUR']) {
    const form = f.saveForm(); form.set('panelStyle', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.deepEqual(f.state.events.get('event'), before);
  }
});


test('blur intensity saves and reloads independently from the finish, including zero', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  for (const intensity of [0, 25, 50, 100]) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('blurIntensity', String(intensity));
    form.set('panelStyle', 'blur-color');
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    assert.equal(initialGuidedValues(f.state.events.get('event')).blurIntensity, intensity);
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').blurIntensity, 100);
});

test('invalid blur intensities cannot overwrite the saved invitation', async () => {
  const f = createFixture();
  const before = structuredClone(f.state.events.get('event'));
  for (const value of ['', '-1', '101', '50.5', 'abc', 'Infinity']) {
    const form = f.saveForm(); form.set('blurIntensity', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.deepEqual(f.state.events.get('event'), before);
  }
});
