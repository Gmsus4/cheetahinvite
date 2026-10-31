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
