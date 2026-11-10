/* eslint-disable @typescript-eslint/no-require-imports -- Test the real persistence queue against controlled storage/network. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const modules = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const mod = { exports: {} }; modules.set(absolute, mod);
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name), mod, mod.exports);
  return mod.exports;
}
const { EditorPersistence } = load('lib/editor-persistence.ts');
const { editorFormData, parseEditorDraft, editorDraftPrefix, EDITOR_DRAFT_LIFETIME } = load('lib/invitation-editor.ts');
const { EditorSaveFailure } = load('lib/invitation-editor.ts');
const values = name => JSON.stringify({ name, eventType: 'wedding', eventDate: '', eventTime: '', hostNames: '', venue: '', address: '', message: '', imageUrl: '', accent: '#E9560A', typography: 'default', bodyTypography: 'inter', sections: [], customSlug: '', templateId: 'none', texture: 'none', heroHorizontal: 'left', heroVertical: 'center', buttonAppearance: { shape: 'square', filled: true, icons: true, border: false, bold: true } });
class MemoryStorage {
  data = new Map();
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
const flush = async () => { for (let index = 0; index < 15; index++) await Promise.resolve(); };
function setup(t, options = {}) {
  const storage = options.storage ?? new MemoryStorage();
  let online = true, calls = [];
  const controller = new EditorPersistence({ ownerId: 'owner', eventId: 'event', snapshot: values('Inicial'), version: 0, creation: false, manualOnly: false,
    save: async (snapshot, version, automatic) => { calls.push({ snapshot, version, automatic }); return { ok: true, eventId: 'event', version: version + 1 }; }, ...options });
  controller.start({ storage, now: () => Date.now(), uuid: randomUUID, online: () => online });
  t.after(() => controller.stop());
  return { controller, storage, calls, offline() { online = false; }, online() { online = true; } };
}
const edit = (controller, name, uploading = false) => controller.update(values(name), uploading, { step: 0, activeExtra: null }, false);

test('debounces edits, saves only the latest values and clears its local backup after acknowledgment', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { controller: c, calls, storage } = setup(t);
  edit(c, 'Primero'); edit(c, 'Segundo'); edit(c, 'Último');
  assert.equal(c.shouldWarn(), true);
  assert.equal(storage.length, 1);
  t.mock.timers.tick(1499); await flush(); assert.equal(calls.length, 0);
  t.mock.timers.tick(1); await flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].snapshot, values('Último'));
  assert.equal(calls[0].automatic, true);
  assert.equal(c.getVersion(), 1);
  assert.equal(c.shouldWarn(), false);
  assert.equal(storage.length, 0);
});

test('typing during a pending save stays dirty and cannot be erased by an older response', async t => {
  let resolve;
  const { controller: c, storage } = setup(t, { save: () => new Promise(done => { resolve = done; }) });
  edit(c, 'Enviado'); const save = c.saveNow(true); await flush();
  edit(c, 'Más reciente');
  resolve({ ok: true, eventId: 'event', version: 1 }); await save;
  assert.equal(c.getSnapshot().acknowledged, values('Enviado'));
  assert.equal(c.isDirty(), true);
  assert.equal(JSON.parse([...storage.data.values()][0]).snapshot, values('Más reciente'));
});

test('manual save waits for the autosave in flight and flushes edits made afterwards', async t => {
  let resolve; const calls = [];
  const { controller: c } = setup(t, { save: async (snapshot, version) => {
    calls.push({ snapshot, version });
    if (calls.length === 1) return new Promise(done => { resolve = done; });
    return { ok: true, eventId: 'event', version: version + 1 };
  } });
  edit(c, 'Primero'); const automatic = c.saveNow(true); await flush();
  edit(c, 'Segundo'); const manual = c.saveNow(false);
  resolve({ ok: true, eventId: 'event', version: 1 }); await automatic;
  assert.equal((await manual).version, 2);
  assert.deepEqual(calls.map(call => [JSON.parse(call.snapshot).name, call.version]), [['Primero', 0], ['Segundo', 1]]);
  assert.equal(c.isDirty(), false);
});

test('network failures retain recoverable copies and successful recovery clears only that copy', async t => {
  const first = setup(t, { save: async () => { throw Error('offline'); } });
  edit(first.controller, 'Sin perder');
  assert.equal((await first.controller.saveNow()).code, 'unavailable');
  first.controller.stop();
  const next = setup(t, { storage: first.storage });
  assert.equal(next.controller.getSnapshot().recovery.snapshot, values('Sin perder'));
  assert.equal(next.controller.getSnapshot().recovery.ownerId, 'owner');
  const recovered = next.controller.recover();
  assert.equal(JSON.parse(recovered.snapshot).name, 'Sin perder');
  assert.equal((await next.controller.saveNow()).ok, true);
  assert.equal(first.storage.length, 0);
});

test('published invitations keep device backups and require an explicit save', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { controller: c, calls, storage } = setup(t, { manualOnly: true });
  edit(c, 'Publicada editada'); t.mock.timers.tick(60_000); await flush();
  assert.equal(calls.length, 0); assert.equal(storage.length, 1);
  assert.equal((await c.saveNow()).ok, true);
  assert.equal(calls[0].automatic, false);
});

test('/show starts with transferred edits as unsaved changes and does not consume other tabs backups', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const source = setup(t, { manualOnly: true }); edit(source.controller, 'Desde el asistente');
  const originalKeys = [...source.storage.data.keys()];
  const preview = setup(t, { storage: source.storage, manualOnly: true, initialChanges: { snapshot: values('Desde el asistente'), version: 0, privacyVersion: 0 } });
  assert.equal(preview.controller.getSnapshot().recovery, null);
  assert.equal(preview.controller.getSnapshot().acknowledged, values('Inicial'));
  assert.equal(preview.controller.isDirty(), true);
  t.mock.timers.tick(60_000); await flush();
  assert.equal(preview.calls.length, 0);
  assert.equal((await preview.controller.saveNow()).ok, true);
  assert.equal(preview.calls[0].snapshot, values('Desde el asistente'));
  assert.equal(preview.calls[0].automatic, false);
  assert.equal(preview.controller.isDirty(), false);
  for (const key of originalKeys) assert.ok(source.storage.getItem(key));
});

test('/show detects content or privacy changes made after the preview was opened', async t => {
  for (const revisions of [{ version: 1, privacyVersion: 0 }, { version: 0, privacyVersion: 1 }]) {
    const { controller, calls } = setup(t, { ...revisions, manualOnly: true, initialChanges: { snapshot: values('Pendiente'), version: 0, privacyVersion: 0 } });
    assert.equal(controller.getSnapshot().code, 'conflict');
    assert.equal((await controller.saveNow()).ok, false); assert.equal(calls.length, 0);
    assert.equal((await controller.saveNow(false, revisions.version, revisions.privacyVersion)).ok, true);
    assert.equal(calls.length, 1);
  }
});

test('/show reloads offer the edits made inside that preview without taking another tabs copy', t => {
  const sessionId = randomUUID(), storage = new MemoryStorage();
  const options = { storage, manualOnly: true, initialChanges: { snapshot: values('Desde el asistente'), version: 0, sessionId } };
  const first = setup(t, options);
  first.controller.update(values('Editado dentro de show'), false, { step: 0, activeExtra: null }, true);
  first.controller.stop();
  const reloaded = setup(t, options);
  assert.equal(JSON.parse(reloaded.controller.getSnapshot().recovery.snapshot).name, 'Editado dentro de show');
  assert.equal(JSON.parse(reloaded.controller.recover().snapshot).name, 'Editado dentro de show');
});

test('uploads block autosave and manual publication prerequisites until completion', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { controller: c, calls } = setup(t);
  edit(c, 'Con foto', true); t.mock.timers.tick(5000); await flush();
  assert.equal(calls.length, 0); assert.equal(c.shouldWarn(), true);
  assert.equal((await c.saveNow()).ok, false);
  edit(c, 'Con foto', false); t.mock.timers.tick(1500); await flush();
  assert.equal(calls.length, 1);
});

test('offline work stays local and an online retry sends it with the original version', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = setup(t); f.offline(); edit(f.controller, 'Sin conexión');
  assert.equal((await f.controller.saveNow(true)).ok, false);
  assert.equal(f.calls.length, 0); assert.equal(f.storage.length, 1);
  f.online(); f.controller.retry(); t.mock.timers.tick(10_000); await flush();
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].version, 0);
});

test('conflicts stop autosave and require an explicit decision before replacing another version', async t => {
  const calls = [];
  const { controller: c, storage } = setup(t, { save: async (snapshot, version) => {
    calls.push({ snapshot, version });
    return version === 0 ? { ok: false, code: 'conflict', message: 'Otra pestaña guardó', version: 3 } : { ok: true, eventId: 'event', version: 4 };
  } });
  edit(c, 'Mi copia'); assert.equal((await c.saveNow(true)).code, 'conflict');
  assert.equal((await c.saveNow()).code, 'conflict'); assert.equal(calls.length, 1);
  assert.equal(storage.length, 1);
  assert.equal((await c.saveNow(false, 3)).ok, true);
  assert.equal(calls[1].version, 3); assert.equal(storage.length, 0);
});

test('separate tabs keep independent local records; one save cannot delete another tab backup', async t => {
  const storage = new MemoryStorage();
  const first = setup(t, { storage }); const second = setup(t, { storage });
  edit(first.controller, 'Pestaña uno'); edit(second.controller, 'Pestaña dos');
  assert.equal(storage.length, 2);
  await first.controller.saveNow();
  assert.equal(storage.length, 1);
  assert.equal(JSON.parse([...storage.data.values()][0]).snapshot, values('Pestaña dos'));
});

test('canceling contextual edits clears its conflict and backup while retaining the acknowledged values', async t => {
  const { controller: c, storage, calls } = setup(t, { manualOnly: true });
  c.update(values('Cambio cancelado'), false, { step: 0, activeExtra: null }, true);
  c.acceptFailure({ ok: false, code: 'conflict', message: 'Otra versión', version: 7 });
  assert.equal(c.discardChanges(), true);
  assert.equal(c.getSnapshot().acknowledged, values('Inicial'));
  assert.equal(c.getSnapshot().error, '');
  assert.equal(c.getSnapshot().conflictVersion, undefined);
  assert.equal(c.shouldWarn(), false);
  assert.equal(storage.length, 0);
  assert.equal(calls.length, 0);
  c.update(values('Nuevo cambio'), false, { step: 0, activeExtra: null }, true);
  await c.saveNow();
  assert.equal(calls[0].version, 0, 'Discarding cannot silently accept a newer server version');
});

test('canceling recovered edits removes that recovery copy without touching another tab backup', t => {
  const first = setup(t, { manualOnly: true });
  first.controller.update(values('Copia recuperable'), false, { step: 0, activeExtra: null }, true);
  first.controller.stop();
  const next = setup(t, { storage: first.storage, manualOnly: true });
  assert.equal(next.controller.discardChanges(), false, 'An unreviewed recovery must be handled first');
  next.controller.recover();
  const other = setup(t, { storage: first.storage, eventId: 'other-event', manualOnly: true });
  other.controller.update(values('Otra pestaña'), false, { step: 0, activeExtra: null }, true);
  assert.equal(next.controller.discardChanges(), true);
  assert.equal(first.storage.length, 1);
  assert.equal(JSON.parse([...first.storage.data.values()][0]).snapshot, values('Otra pestaña'));
});

test('canceling cannot discard an upload or a save in flight', async t => {
  let resolve;
  const { controller: c } = setup(t, { manualOnly: true, save: () => new Promise(done => { resolve = done; }) });
  c.update(values('Con foto'), true, { step: 0, activeExtra: null }, true);
  assert.equal(c.discardChanges(), false);
  c.update(values('Con foto'), false, { step: 0, activeExtra: null }, true);
  const flight = c.saveNow();
  await flush();
  assert.equal(c.discardChanges(), false);
  resolve({ ok: true, eventId: 'event', version: 1 });
  await flight;
  assert.equal(c.getSnapshot().acknowledged, values('Con foto'));
});

test('blocked browser storage shows a warning, retains navigation protection and allows server saves', async t => {
  const storage = { length: 0, key() {}, getItem() {}, setItem() { throw Error('Quota'); }, removeItem() {} };
  const { controller: c } = setup(t, { storage });
  edit(c, 'Protegido'); assert.equal(c.getSnapshot().localWarning, true); assert.equal(c.shouldWarn(), true);
  assert.equal((await c.saveNow()).ok, true); assert.equal(c.isDirty(), false);
});

test('creation limits and expected preparation failures retain their actionable message and local copy', async t => {
  const { controller: c, storage } = setup(t, { eventId: '', creation: true, save: async () => { throw new EditorSaveFailure({ ok: false, code: 'validation', message: 'Tus tres espacios están ocupados.' }); } });
  edit(c, 'Mi invitación');
  const result = await c.saveNow();
  assert.equal(result.code, 'validation');
  assert.equal(c.getSnapshot().error, 'Tus tres espacios están ocupados.');
  assert.equal(storage.length, 1);
});

test('creation resumes the same prepared event and a successful completion leaves no recovery ghost', async t => {
  const first = setup(t, { eventId: '', creation: true });
  edit(first.controller, 'Wizard'); first.controller.setEventId('prepared-event'); first.controller.stop();
  const next = setup(t, { storage: first.storage, eventId: 'prepared-event', creation: true });
  assert.equal(next.controller.getSnapshot().recovery.eventId, 'prepared-event');
  next.controller.recover(); assert.equal(next.controller.getEventId(), 'prepared-event');
  assert.equal(next.controller.getCreationKey(), first.controller.getCreationKey());
  await next.controller.saveNow(); next.controller.stop();
  assert.equal(first.storage.length, 0);
});

test('the paid-event editor can recover creation backups for that same event including playlist links', async t => {
  const first = setup(t, { eventId: '', creation: true });
  const draft = JSON.parse(values('Con playlist'));
  draft.sections = [{ id: 'birthday-music', type: 'music', title: 'Playlist', content: '', detail: '', link: 'https://example.com/playlist', imageUrl: '', enabled: true }];
  first.controller.setEventId('prepared-event');
  first.controller.update(JSON.stringify(draft), false, { step: 2, activeExtra: null }, false);
  first.controller.stop();

  const next = setup(t, { storage: first.storage, eventId: 'prepared-event', manualOnly: true, version: 3 });
  const record = next.controller.getSnapshot().recovery;
  assert.ok(record, 'editing must discover the matching backup from creation');
  assert.equal(JSON.parse(record.snapshot).sections[0].link, 'https://example.com/playlist');
  next.controller.recover();
  assert.equal(next.controller.getSnapshot().code, 'conflict', 'an older backup must not overwrite published changes automatically');
  assert.equal(next.calls.length, 0);
  const unrelated = setup(t, { storage: first.storage, eventId: 'different-event', manualOnly: true });
  assert.equal(unrelated.controller.getSnapshot().recovery, null);
  const foreign = setup(t, { storage: first.storage, ownerId: 'another-owner', eventId: 'prepared-event', manualOnly: true });
  assert.equal(foreign.controller.getSnapshot().recovery, null);
});

test('consecutive creation sessions start empty and save distinct events without changing the previous one', async t => {
  const storage = new MemoryStorage();
  const saved = new Map();
  const save = async (snapshot, version) => {
    const id = randomUUID(); saved.set(id, snapshot);
    return { ok: true, eventId: id, version: version + 1 };
  };
  const first = setup(t, { storage, eventId: '', snapshot: values(''), creation: true, save });
  edit(first.controller, 'Primer evento');
  const firstResult = await first.controller.saveNow(); first.controller.stop();
  assert.equal(storage.length, 0);
  const second = setup(t, { storage, eventId: '', snapshot: values(''), creation: true, save });
  assert.equal(second.controller.getEventId(), '');
  assert.equal(second.controller.getSnapshot().acknowledged, values(''));
  assert.equal(second.controller.getSnapshot().recovery, null);
  assert.notEqual(second.controller.getCreationKey(), first.controller.getCreationKey());
  edit(second.controller, 'Segundo evento');
  const secondResult = await second.controller.saveNow(); second.controller.stop();
  assert.notEqual(firstResult.eventId, secondResult.eventId);
  assert.equal(saved.get(firstResult.eventId), values('Primer evento'));
  assert.equal(saved.get(secondResult.eventId), values('Segundo evento'));
  assert.equal(storage.length, 0);
});

test('restoring a copy older than the server requires a conflict decision', async t => {
  const first = setup(t); edit(first.controller, 'Viejo local'); first.controller.stop();
  const next = setup(t, { storage: first.storage, version: 2, snapshot: values('Nuevo servidor') });
  next.controller.recover();
  assert.equal(next.controller.getSnapshot().code, 'conflict');
  assert.equal(next.controller.getSnapshot().conflictVersion, 2);
});

test('backup parser accepts incomplete fields but rejects foreign, malformed and expired records', () => {
  const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), snapshot: values(''), version: 0, updatedAt: Date.now(), wizard: { step: 0, activeExtra: null } };
  assert.ok(parseEditorDraft(JSON.stringify(record), 'owner', 'event', Date.now()));
  for (const change of [{ ownerId: 'other' }, { eventId: 'other' }, { version: -1 }, { snapshot: '{}' }, { updatedAt: Date.now() - EDITOR_DRAFT_LIFETIME - 1000 }]) {
    assert.equal(parseEditorDraft(JSON.stringify({ ...record, ...change }), 'owner', 'event', Date.now()), null);
  }
  assert.equal(parseEditorDraft('broken JSON', 'owner', 'event', Date.now()), null);
  assert.notEqual(editorDraftPrefix('owner', 'event'), editorDraftPrefix('other', 'event'));
  const form = editorFormData(values('Nombre'), 3);
  assert.equal(form.get('contentVersion'), '3'); assert.equal(form.get('buttonFilled'), 'true'); assert.equal(form.get('sections'), '[]');
});

test('new wizard flow survives backup and recovery without changing event content', t => {
  const first = setup(t);
  const wizard = { step: 4, activeExtra: null, flow: 'content-v2' };
  first.controller.update(values('Mi celebración'), false, wizard, false);
  first.controller.stop();
  const next = setup(t, { storage: first.storage });
  const record = next.controller.recover();
  assert.deepEqual(record.wizard, wizard);
  assert.equal(JSON.parse(record.snapshot).name, 'Mi celebración');
  assert.equal(parseEditorDraft(JSON.stringify({ ...record, wizard: { ...wizard, flow: 'unknown' } }), 'owner', 'event', Date.now()), null);
});

test('three-step wizard retains the open personalization panel and event content in backups', t => {
  const first = setup(t);
  const wizard = { step: 1, activeExtra: 'appearance', flow: 'content-v3' };
  first.controller.update(values('Mi celebración'), false, wizard, false);
  first.controller.stop();
  const next = setup(t, { storage: first.storage });
  const record = next.controller.recover();
  assert.deepEqual(record.wizard, wizard);
  assert.equal(JSON.parse(record.snapshot).name, 'Mi celebración');
  assert.equal(parseEditorDraft(JSON.stringify({ ...record, wizard: { ...wizard, flow: 'unknown' } }), 'owner', 'event', Date.now()), null);
});

test('gradual journey retains the active detail and event content in backups', t => {
  const first = setup(t);
  const wizard = { step: 3, activeExtra: 'my-story', flow: 'content-v4' };
  first.controller.update(values('Mi celebración'), false, wizard, false);
  first.controller.stop();
  const next = setup(t, { storage: first.storage });
  const record = next.controller.recover();
  assert.deepEqual(record.wizard, wizard);
  assert.equal(JSON.parse(record.snapshot).name, 'Mi celebración');
  assert.equal(parseEditorDraft(JSON.stringify({ ...record, wizard: { ...wizard, flow: 'unknown' } }), 'owner', 'event', Date.now()), null);
});

test('local backups retain section photo placement and reject unsupported positions', () => {
  const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 0, updatedAt: Date.now(), wizard: { step: 2, activeExtra: 'story' } };
  for (const position of ['before', 'after', 'sideways']) {
    const snapshot = JSON.parse(values('Mi boda'));
    snapshot.sections = [{ id: 'story', type: 'story', title: 'Nuestra historia', content: '', detail: '', link: '', imageUrl: 'https://example.com/photo.jpg', imagePosition: position, enabled: true }];
    const parsed = parseEditorDraft(JSON.stringify({ ...record, snapshot: JSON.stringify(snapshot) }), 'owner', 'event', Date.now());
    if (position === 'sideways') assert.equal(parsed, null);
    else assert.equal(JSON.parse(parsed.snapshot).sections[0].imagePosition, position);
  }
});

test('local backups retain section surfaces and reject unsupported finishes', () => {
  for (const panelStyle of ['auto','blur','blur-color','color','glass','none','invalid']) {
    const snapshot = JSON.parse(values('Mi boda'));
    snapshot.sections = [{id:'story',type:'story',title:'Historia',content:'',detail:'',link:'',imageUrl:'',enabled:true,panelStyle}];
    const record = {schema:1,ownerId:'owner',eventId:'event',creationKey:randomUUID(),version:0,updatedAt:Date.now(),wizard:{step:2,activeExtra:'story'},snapshot:JSON.stringify(snapshot)};
    const parsed = parseEditorDraft(JSON.stringify(record),'owner','event',Date.now());
    if (panelStyle === 'invalid') assert.equal(parsed,null);
    else assert.equal(JSON.parse(parsed.snapshot).sections[0].panelStyle,panelStyle);
  }
});


test('local draft recovery retains the global finish and rejects unsupported finishes', () => {
  const now = Date.now();
  const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 0, updatedAt: now, wizard: { step: 5, activeExtra: null, flow: 'content-v4' } };
  for (const panelStyle of ['auto', 'blur', 'blur-color', 'color', 'glass', 'none', undefined]) {
    const snapshot = JSON.stringify({ ...JSON.parse(values('Celebracion')), panelStyle });
    const recovered = parseEditorDraft(JSON.stringify({ ...record, snapshot }), 'owner', 'event', now);
    assert.ok(recovered);
    assert.equal(JSON.parse(recovered.snapshot).panelStyle, panelStyle);
    if (panelStyle) assert.equal(editorFormData(snapshot, 0).get('panelStyle'), panelStyle);
  }
  const snapshot = JSON.stringify({ ...JSON.parse(values('Celebracion')), panelStyle: 'invalid' });
  assert.equal(parseEditorDraft(JSON.stringify({ ...record, snapshot }), 'owner', 'event', now), null);
});


test('draft recovery retains blur intensity and rejects unsupported values', () => {
  const now = Date.now();
  const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 0, updatedAt: now, wizard: { step: 4, activeExtra: null, flow: 'content-v4' } };
  for (const blurIntensity of [0, 50, 100, undefined]) {
    const snapshot = JSON.stringify({ ...JSON.parse(values('Celebracion')), blurIntensity });
    const recovered = parseEditorDraft(JSON.stringify({ ...record, snapshot }), 'owner', 'event', now);
    assert.ok(recovered);
    assert.equal(JSON.parse(recovered.snapshot).blurIntensity, blurIntensity);
    if (blurIntensity !== undefined) assert.equal(editorFormData(snapshot, 0).get('blurIntensity'), String(blurIntensity));
  }
  for (const blurIntensity of [-1, 101, 0.5, '50', null]) {
    const snapshot = JSON.stringify({ ...JSON.parse(values('Celebracion')), blurIntensity });
    assert.equal(parseEditorDraft(JSON.stringify({ ...record, snapshot }), 'owner', 'event', now), null);
  }
});


test('local backups retain text alignment and reject unsupported values', () => {
  for (const textAlign of ['auto','left','center','right','justify',null]) {
    const snapshot = JSON.parse(values('Mi boda'));
    snapshot.sections = [{id:'story',type:'story',title:'Historia',content:'',detail:'',link:'',imageUrl:'',enabled:true,textAlign}];
    const record = {schema:1,ownerId:'owner',eventId:'event',creationKey:randomUUID(),version:0,updatedAt:Date.now(),wizard:{step:2,activeExtra:'story'},snapshot:JSON.stringify(snapshot)};
    const parsed = parseEditorDraft(JSON.stringify(record),'owner','event',Date.now());
    if (textAlign === 'justify' || textAlign === null) assert.equal(parsed,null);
    else assert.equal(JSON.parse(parsed.snapshot).sections[0].textAlign,textAlign);
  }
});


test('local backups retain global section corners and accept older drafts without the option', () => {
 for(const sectionCorners of [undefined,'square','soft','rounded','invalid',null]) {
  const snapshot={...JSON.parse(values('Mi boda')),sectionCorners};
  const record={schema:1,ownerId:'owner',eventId:'event',creationKey:randomUUID(),version:0,updatedAt:Date.now(),wizard:{step:4,activeExtra:null},snapshot:JSON.stringify(snapshot)};
  const parsed=parseEditorDraft(JSON.stringify(record),'owner','event',Date.now());
  if(sectionCorners==='invalid'||sectionCorners===null) assert.equal(parsed,null);
  else assert.equal(JSON.parse(parsed.snapshot).sectionCorners,sectionCorners);
 }
});


test('local backups retain icon preferences and allow legacy sections without the flag',()=>{
 for(const showIcon of [undefined,true,false,'false',0,null]) {
  const snapshot=JSON.parse(values('Fiesta'));snapshot.sections=[{id:'story',type:'story',title:'Historia',content:'',detail:'',link:'',imageUrl:'',enabled:true,showIcon}];
  const record={schema:1,ownerId:'owner',eventId:'event',creationKey:randomUUID(),version:0,updatedAt:Date.now(),wizard:{step:3,activeExtra:'story'},snapshot:JSON.stringify(snapshot)};
  const parsed=parseEditorDraft(JSON.stringify(record),'owner','event',Date.now());
  if(showIcon===undefined||typeof showIcon==='boolean') assert.equal(JSON.parse(parsed.snapshot).sections[0].showIcon,showIcon);
  else assert.equal(parsed,null);
 }
});


test('glass border preference survives form serialization and draft recovery', () => {
  for (const glassBorder of [undefined, true, false, 'false', null]) {
    const snapshot = JSON.stringify({ ...JSON.parse(values('Fiesta')), glassBorder });
    const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 0, updatedAt: Date.now(), wizard: { step: 4, activeExtra: null }, snapshot };
    const parsed = parseEditorDraft(JSON.stringify(record), 'owner', 'event', Date.now());
    if (glassBorder === undefined || typeof glassBorder === 'boolean') {
      assert.equal(JSON.parse(parsed.snapshot).glassBorder, glassBorder);
      assert.equal(editorFormData(snapshot, 0).get('glassBorder'), glassBorder === undefined ? null : String(glassBorder));
    } else assert.equal(parsed, null);
  }
});

test('page background blur survives form serialization and draft recovery with a legacy default', () => {
  for (const backgroundBlurIntensity of [undefined, 0, 35, 100, -1, 101, 1.5, '50', null]) {
    const snapshot = JSON.stringify({ ...JSON.parse(values('Fiesta')), backgroundBlurIntensity });
    const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 0, updatedAt: Date.now(), wizard: { step: 3, activeExtra: null }, snapshot };
    const parsed = parseEditorDraft(JSON.stringify(record), 'owner', 'event', Date.now());
    if (backgroundBlurIntensity === undefined || [0, 35, 100].includes(backgroundBlurIntensity)) {
      assert.equal(JSON.parse(parsed.snapshot).backgroundBlurIntensity, backgroundBlurIntensity);
      assert.equal(editorFormData(snapshot, 0).get('backgroundBlurIntensity'), backgroundBlurIntensity === undefined ? null : String(backgroundBlurIntensity));
    } else assert.equal(parsed, null);
  }
});

test('page background dimming survives serialization and draft recovery and accepts older drafts', () => {
  for (const backgroundDimIntensity of [undefined, 0, 30, 100, -1, 101, 1.5, '50', null]) {
    const snapshot = JSON.stringify({ ...JSON.parse(values('Fiesta')), backgroundDimIntensity });
    const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 0, updatedAt: Date.now(), wizard: { step: 3, activeExtra: null }, snapshot };
    const parsed = parseEditorDraft(JSON.stringify(record), 'owner', 'event', Date.now());
    if (backgroundDimIntensity === undefined || [0, 30, 100].includes(backgroundDimIntensity)) {
      assert.equal(JSON.parse(parsed.snapshot).backgroundDimIntensity, backgroundDimIntensity);
      assert.equal(editorFormData(snapshot, 0).get('backgroundDimIntensity'), backgroundDimIntensity === undefined ? null : String(backgroundDimIntensity));
    } else assert.equal(parsed, null);
  }
});

test('cover layouts survive form serialization and draft recovery without invalidating older drafts', () => {
  for (const coverLayout of [undefined, 'split', 'split-reverse', 'stacked', 'overlay', 'invalid', null, false]) {
    const snapshot = JSON.stringify({ ...JSON.parse(values('Fiesta')), coverLayout });
    const record = { schema: 1, ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 0, updatedAt: Date.now(), wizard: { step: 3, activeExtra: null }, snapshot };
    const parsed = parseEditorDraft(JSON.stringify(record), 'owner', 'event', Date.now());
    if (coverLayout === undefined || ['split', 'split-reverse', 'stacked', 'overlay'].includes(coverLayout)) {
      assert.equal(JSON.parse(parsed.snapshot).coverLayout, coverLayout);
      assert.equal(editorFormData(snapshot, 0).get('coverLayout'), coverLayout ?? null);
    } else assert.equal(parsed, null);
  }
});

test('global icon preference survives draft recovery and accepts older drafts',()=>{
 for(const showSectionIcons of [undefined,true,false,'false',null]) {
  const snapshot={...JSON.parse(values('Fiesta')),showSectionIcons};
  const record={schema:1,ownerId:'owner',eventId:'event',creationKey:randomUUID(),version:0,updatedAt:Date.now(),wizard:{step:4,activeExtra:null},snapshot:JSON.stringify(snapshot)};
  const parsed=parseEditorDraft(JSON.stringify(record),'owner','event',Date.now());
  if(showSectionIcons===undefined||typeof showSectionIcons==='boolean')assert.equal(JSON.parse(parsed.snapshot).showSectionIcons,showSectionIcons);else assert.equal(parsed,null);
 }
});


test('draft recovery preserves the new appearance substep and rejects unknown flow versions',()=>{
 const now=Date.now();
 for(const activeExtra of ['style:corners','style:icons','style:surface','style:colors','style:fonts']) {
  const wizard={step:3,activeExtra,flow:'content-v5'};
  const record={schema:1,ownerId:'owner',eventId:'event',creationKey:randomUUID(),version:0,updatedAt:now,wizard,snapshot:values('Fiesta')};
  assert.deepEqual(parseEditorDraft(JSON.stringify(record),'owner','event',now).wizard,wizard);
  assert.equal(parseEditorDraft(JSON.stringify({...record,wizard:{...wizard,flow:'unknown'}}),'owner','event',now),null);
 }
});


test('draft recovery keeps independent mobile and desktop image framing and accepts legacy photos', () => {
 const now = Date.now();
 const record = { schema:1,ownerId:'owner',eventId:'event',creationKey:randomUUID(),version:0,updatedAt:now,wizard:{step:0,activeExtra:null} };
 for (const key of ['mobileImageFocus', 'desktopImageFocus']) for (const focus of [undefined, 'top', 'center', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'diagonal', null, 0]) {
  const section = {id:'cover',type:'cover',title:'Portada',content:'',detail:'',link:'',imageUrl:'',enabled:true,[key]:focus};
  const snapshot = JSON.stringify({...JSON.parse(values('Fiesta')),sections:[section]});
  const parsed = parseEditorDraft(JSON.stringify({...record,snapshot}), 'owner', 'event', now);
  if (focus === undefined || ['top','center','bottom','left','right','top-left','top-right','bottom-left','bottom-right'].includes(focus)) {
   assert.ok(parsed);
   assert.deepEqual(JSON.parse(parsed.snapshot).sections, JSON.parse(snapshot).sections);
  } else assert.equal(parsed, null);
 }
});

test('device recovery retains privacy edits without storing the pending PIN', async t => {
  const initial = JSON.stringify({ ...JSON.parse(values('Inicial')), privacy: 'PUBLIC', pin: '', pinPending: false });
  const first = setup(t, { snapshot: initial, privacyVersion: 4, manualOnly: true });
  first.controller.update(JSON.stringify({ ...JSON.parse(initial), privacy: 'PRIVATE', pin: '001234', pinPending: true }), false, { step: 5, activeExtra: null }, true);
  const raw = [...first.storage.data.values()][0];
  assert.equal(raw.includes('001234'), false);
  const backup = JSON.parse(raw); assert.equal(backup.privacyVersion, 4);
  assert.equal(JSON.parse(backup.snapshot).pinPending, true);
  first.controller.stop();
  const next = setup(t, { snapshot: initial, storage: first.storage, privacyVersion: 5, manualOnly: true });
  const recovered = next.controller.recover();
  assert.equal(JSON.parse(recovered.snapshot).privacy, 'PRIVATE'); assert.equal(JSON.parse(recovered.snapshot).pin, '');
  assert.equal(next.controller.getSnapshot().code, 'conflict');
  assert.equal(next.controller.getSnapshot().conflictPrivacyVersion, 5);
});

test('privacy revisions advance with saves and an explicit conflict decision updates both revisions', async t => {
  const calls = []; let conflict = false;
  const f = setup(t, { privacyVersion: 2, manualOnly: true, save: async (snapshot, version, automatic, privacyVersion) => {
    calls.push([version, privacyVersion]);
    if (conflict) return { ok: false, code: 'conflict', message: 'Privacy changed', version: 1, privacyVersion: 8 };
    return { ok: true, eventId: 'event', version: version + 1, privacyVersion: privacyVersion + 1 };
  } });
  edit(f.controller, 'Primero'); await f.controller.saveNow();
  edit(f.controller, 'Segundo'); conflict = true; await f.controller.saveNow();
  assert.equal(f.controller.getSnapshot().conflictPrivacyVersion, 8);
  assert.equal((await f.controller.saveNow()).code, 'conflict');
  conflict = false; await f.controller.saveNow(false, 1, 8);
  assert.deepEqual(calls, [[0, 2], [1, 3], [1, 8]]);
  assert.equal(f.controller.getSnapshot().conflictPrivacyVersion, undefined);
});
