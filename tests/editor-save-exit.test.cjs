/* eslint-disable @typescript-eslint/no-require-imports -- Exercise editor navigation against real persistence and isolated server actions. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { randomUUID } = require('node:crypto');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

class MemoryStorage {
  data = new Map();
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
const tick = () => new Promise(resolve => setImmediate(resolve));
function nodes(node, match) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, match));
  return [...(match(node) ? [node] : []), ...nodes(node.props?.children, match)];
}
function text(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return node && typeof node === 'object' ? text(node.props?.children) : '';
}

function editor(t, { creation = true, exampleId, privacy = 'PUBLIC', privacyVersion = 0, published = false, mobile = false } = {}) {
  const db = createFixture();
  const { EditorPersistence } = db.load('lib/editor-persistence.ts');
  const f = { db, states: [], refs: [], routes: [], windows: [], storage: new MemoryStorage(), destination: null, online: true, saveCalls: 0, pending: [], publications: 0 };
  const event = { ...db.state.events.get('event'), id: creation ? '' : 'event', eventType: 'wedding', accent: '#E9560A',
    name: 'Mi celebración', contentVersion: 0, eventDate: null, eventTime: null, typography: 'default', bodyTypography: 'inter', templateId: 'none', texture: 'none',
    paidAt: published ? new Date() : null, expiresAt: published ? new Date('2099-01-01') : null,
    ...(published ? {hostNames:'Alex y Sam',eventDate:new Date('2027-01-15T12:00:00Z'),eventTime:'18:00',venue:'Salón',address:'Calle'} : {}),
    status: published ? 'PUBLISHED' : 'DRAFT', slug: published ? 'mi-celebracion' : null, privacy, privacyVersion };
  Object.assign(db.state.events.get('event'), event, { id: 'event' });
  f.event = event;
  let stateIndex = 0, refIndex = 0;
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync('components/dashboard/GuidedInvitationEditor.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  function requireMock(name) {
    if (name === 'react') return { ...React,
      useState(initial) { const slot = stateIndex++; if (!(slot in f.states)) f.states[slot] = typeof initial === 'function' ? initial() : initial; return [f.states[slot], value => { f.states[slot] = typeof value === 'function' ? value(f.states[slot]) : value; }]; },
      useRef(initial) { const slot = refIndex++; if (!f.refs[slot]) f.refs[slot] = { current: initial }; return f.refs[slot]; },
      useEffect: effect => effect(),
    };
    if (name === 'next/navigation') return { useRouter: () => ({ replace: href => f.routes.push(['replace', href]), push: href => f.routes.push(['push', href]) }) };
    if (name === '@/app/crear/actions') return db.load('app/crear/actions.ts');
    if (name === '@/app/dashboard/eventos/[id]/actions') return {
      updateEvent: (...args) => { f.saveCalls++; const pending = f.save ? f.save(...args) : db.actions.updateEvent(...args); f.pending.push(pending); return pending; },
      publishEvent: (...args) => { if (!f.allowPublication) throw new Error('Saving and leaving must never publish or initiate payment'); f.publications++; return db.actions.publishEvent(...args); },
    };
    if (name === './useEditorProtection') return { useEditorProtection(options) {
      if (!f.controller) {
        f.controller = new EditorPersistence(options);
        f.controller.start({ storage: f.storage, uuid: randomUUID, now: Date.now, online: () => f.online });
      }
      return { controller: f.controller, state: f.controller.getSnapshot(), confirmNavigation() {}, navigation: {
        destination: f.destination, stay: () => { f.destination = null; }, leave: () => f.routes.push(['push', f.destination]),
      } };
    } };
    if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name.startsWith('@/lib/')) return db.load(name.slice(2) + '.ts');
    if (name.startsWith('.') || name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => {
      const component = () => null; Object.defineProperty(component, 'name', { value: String(key) }); return component;
    } });
    return require(name);
  }
  new Function('require', 'module', 'exports', 'window', compiled)(requireMock, { exports }, exports,
    { scrollTo() {}, matchMedia: query => ({ matches: query === '(max-width: 600px)' ? mobile : true }), localStorage: f.storage,
      addEventListener() {}, removeEventListener() {}, setInterval() { return 0; }, clearInterval() {},
      open() { if (f.blockPopup) return null; const preview = { closed: false, location: { replace(href) { preview.href = href; } }, close() { preview.closed = true; } }; f.windows.push(preview); return preview; } });
  f.render = () => {
    // The real useSyncExternalStore rerenders when the update effect writes a backup.
    for (let render = 0; render < 2; render++) {
      stateIndex = 0; refIndex = 0;
      f.view = exports.GuidedInvitationEditor({ event, creation, exampleId, saved: false, published: false, error: '' });
    }
    return f.view;
  };
  f.button = () => nodes(f.view, node => node.type === 'button' && node.props.className === 'saveAndExitButton')[0];
  f.flush = async () => { await tick(); let count; do { count = f.pending.length; await Promise.all(f.pending); await tick(); } while (f.pending.length !== count); f.render(); };
  f.click = async () => { f.button().props.onClick(); await f.flush(); };
  f.changeName = name => { f.states[0] = { ...f.states[0], name }; f.render(); };
  f.render();
  t.after(() => f.controller.stop());
  return f;
}

test('continuing a new invitation saves its information and opens /show without leaving creation', async t => {
  for (const mobile of [false, true]) {
    const f = editor(t, { mobile }); f.states[1] = 5;
    f.states[0] = { ...f.states[0], hostNames: 'Alex y Sam', eventDate: '2027-01-15', eventTime: '18:00', venue: 'Salón', address: 'Calle' };
    f.changeName('Mi invitación para personalizar');
    const [previewButton] = nodes(f.view, node => node.props?.['aria-label'] === 'Editar diseño en una nueva pestaña');
    assert.equal(previewButton.props.disabled, false);
    previewButton.props.onClick(); await f.flush();
    const id = f.controller.getEventId();
    const url = new URL(f.windows[0].href, 'https://example.invalid');
    assert.equal(url.pathname, `/dashboard/eventos/${id}/show`);
    const { invitationPreviewKey, parseInvitationPreview } = f.db.load('lib/invitation-preview.ts');
    const preview = parseInvitationPreview(f.storage.getItem(invitationPreviewKey('owner', id, url.searchParams.get('preview'))), 'owner', id);
    assert.equal(JSON.parse(preview.snapshot).name, 'Mi invitación para personalizar');
    assert.equal(preview.creationFlow, true);
    assert.equal(f.saveCalls, 1); assert.equal(f.publications, 0);
    assert.equal(f.db.state.events.get(id).status, 'DRAFT');
    assert.equal(f.db.state.events.get(id).contentVersion, 1);
    assert.equal(f.db.state.events.size, 2);
    assert.equal(JSON.parse(f.controller.getSnapshot().acknowledged).name, 'Mi invitación para personalizar');
    assert.equal(nodes(f.view, node => node.props?.expanded && node.props.fitViewport).length, 0);
    assert.equal(f.states[0].name, 'Mi invitación para personalizar'); assert.equal(f.states[1], 5);
    assert.equal(f.routes.some(([, href]) => href.includes('/show')), false);
  }
});

test('editing information omits design tools while preserving pending content and privacy', t => {
  const f=editor(t,{creation:false,published:true});f.states[1]=6;
  const before=structuredClone(f.db.state.events.get('event'));
  f.states[0]={...f.states[0],name:'Sin publicar',privacy:'PRIVATE',pin:'123456',pinPending:true};f.render();
  assert.equal(nodes(f.view,node=>node.props?.className==='reviewTools').length,0);
  assert.equal(nodes(f.view,node=>node.props?.['aria-label']==='Ajustar apariencia').length,0);
  assert.doesNotMatch(text(f.view),/La vista previa muestra/);
  assert.deepEqual(f.db.state.events.get('event'),before);
  assert.equal(f.controller.shouldWarn(),true);
  assert.equal(f.saveCalls,0);assert.equal(f.windows.length,0);
});

test('an expired creation session closes the preview tab and keeps the sign-in recovery action', async t => {
  const f = editor(t); f.states[1] = 5;
  f.states[0] = { ...f.states[0], hostNames: 'Alex y Sam', eventDate: '2027-01-15', eventTime: '18:00', venue: 'Salón', address: 'Calle' };
  f.changeName('Sin perder'); f.db.owner = null;
  nodes(f.view, node => node.props?.['aria-label'] === 'Editar diseño en una nueva pestaña')[0].props.onClick(); await f.flush();
  assert.equal(f.windows[0].closed, true); assert.deepEqual(f.routes, []); assert.equal(f.saveCalls, 0);
  assert.equal(f.controller.getSnapshot().code, 'auth'); assert.equal(f.states[0].name, 'Sin perder');
});

test('draft and live edit actions clearly distinguish saving from publishing', async t => {
  const draft = editor(t); draft.states[1] = 6; draft.changeName('Un borrador');
  assert.equal(text(draft.button()), 'Guardar borrador y salir');
  assert.ok(nodes(draft.view, node => node.props?.['aria-label'] === 'Guardar borrador')[0]);
  await draft.click();
  assert.equal(draft.db.state.events.get(draft.controller.getEventId()).status, 'DRAFT');
  const live = editor(t, { creation: false, published: true }); live.states[1] = 6; live.changeName('Versión nueva');
  assert.equal(text(live.button()), 'Publicar cambios y salir');
  const [publish] = nodes(live.view, node => node.props?.['aria-label'] === 'Publicar cambios');
  assert.ok(publish); live.refs[0].current = { reportValidity: () => true };
  publish.props.onClick(); await live.flush();
  assert.equal(live.db.state.events.get('event').name, 'Versión nueva');
  assert.equal(live.db.state.events.get('event').status, 'PUBLISHED');
  assert.equal(live.saveCalls, 1); assert.equal(live.publications, 0);
  assert.match(text(live.view), /Tus invitados ya pueden verlos/);
});

test('a published edit leave dialog explicitly identifies the public update', t => {
  const f = editor(t, { creation: false, published: true });
  f.changeName('Cambio pendiente'); f.destination = '/dashboard'; f.render();
  const [dialog] = nodes(f.view, node => node.props?.onSaveAndLeave);
  assert.equal(dialog.props.saveLabel, 'Publicar cambios y salir');
  assert.equal(dialog.props.publishesChanges, true);
});

test('every step saves an incomplete creation in the account and returns to the dashboard without payment', async t => {
  for (const step of [0, 1, 4, 5, 6]) {
    const f = editor(t);
    f.states[1] = step; f.render();
    assert.equal(f.button().props.disabled, false);
    await f.click();
    assert.deepEqual(f.routes.at(-1), ['replace', '/dashboard']);
    const saved = f.db.state.events.get(f.controller.getEventId());
    assert.equal(saved.name, 'Mi celebración');
    assert.equal(saved.status, 'DRAFT');
    assert.equal(saved.paidAt, null);
    assert.equal(saved.eventDate, null);
    assert.equal(saved.hostNames, '');
    assert.equal(saved.venue, '');
    assert.equal(saved.contentVersion, 1);
    assert.equal(f.storage.length, 0);
    assert.equal(f.db.state.users.get('owner').invitationCount, 2);
  }
});

test('the mobile save icon saves in place without exiting or opening an overflow menu', async t => {
  const f=editor(t,{mobile:true});f.changeName('Avance desde móvil');
  f.refs[0].current={reportValidity:()=>true};
  const [save]=nodes(f.view,node=>node.type==='button'&&node.props.className==='mobileSaveButton');
  assert.equal(save.props['aria-label'],'Guardar borrador');
  assert.equal(text(save),'');
  assert.equal(nodes(f.view,node=>node.props?.className==='mobileSaveMenu').length,0);
  save.props.onClick();
  await f.flush();
  assert.equal(f.routes.some(([,href])=>href==='/dashboard'),false);
  assert.equal(f.states[1],0);
  assert.equal(f.db.state.events.get(f.controller.getEventId()).name,'Avance desde móvil');
});

test('offline saves stay in the editor and retain a recoverable device copy', async t => {
  const f = editor(t); f.changeName('Mi avance'); f.online = false;
  await f.click();
  assert.equal(f.routes.length, 0);
  assert.equal(f.controller.getSnapshot().code, 'unavailable');
  assert.equal(f.storage.length, 1);
  assert.equal(JSON.parse([...f.storage.data.values()][0]).snapshot.includes('Mi avance'), true);
  f.online = true; await f.click();
  assert.deepEqual(f.routes.at(-1), ['replace', '/dashboard']);
});

test('session expiry and conflicts retain edits instead of navigating away', async t => {
  const expired = editor(t); expired.changeName('Sin perder'); expired.db.owner = null;
  await expired.click();
  assert.equal(expired.controller.getSnapshot().code, 'auth');
  assert.equal(expired.routes.length, 0);
  assert.equal(expired.storage.length, 1);
  const conflict = editor(t, { creation: false }); conflict.changeName('Mi versión');
  conflict.db.state.events.get('event').contentVersion = 1;
  await conflict.click();
  assert.equal(conflict.controller.getSnapshot().code, 'conflict');
  assert.equal(conflict.routes.length, 0);
  assert.equal(conflict.storage.length, 1);
});

test('uploading disables save-and-exit and neither saves nor leaves', async t => {
  const f = editor(t); f.states[7] = 1; f.render();
  assert.equal(f.button().props.disabled, true);
  await f.click();
  assert.equal(f.saveCalls, 0); assert.equal(f.routes.length, 0);
});

test('saving waits for confirmation, blocks repeated clicks and exits to the requested destination', async t => {
  const f = editor(t, { creation: false }); f.changeName('Actualizada'); f.destination = '/dashboard/compras';
  let release;
  f.save = (...args) => new Promise(resolve => { release = async () => resolve(await f.db.actions.updateEvent(...args)); });
  f.render();
  const [dialog] = nodes(f.view, node => node.props?.onSaveAndLeave);
  dialog.props.onSaveAndLeave(); dialog.props.onSaveAndLeave(); await tick();
  assert.equal(f.saveCalls, 1); assert.equal(f.routes.length, 0);
  f.render();
  assert.equal(f.button().props.disabled, true);
  await release(); await tick(); f.render();
  assert.deepEqual(f.routes, [['push', '/dashboard/compras']]);
  assert.equal(f.destination, null);
});

test('the status distinguishes device copies, saved account content and an untouched new creation', async t => {
  const f = editor(t);
  const status = () => text(nodes(f.view, node => node.props?.className === 'saveAndExitStatus')[0]);
  assert.equal(status(), 'Cambios pendientes de guardar');
  f.changeName('Una copia local'); assert.equal(status(), 'Copia en este dispositivo');
  await f.click(); assert.equal(status(), 'Guardado en tu cuenta');
  const saved = editor(t, { creation: false });
  assert.equal(text(nodes(saved.view, node => node.props?.className === 'saveAndExitStatus')[0]), 'Guardado en tu cuenta');
});

test('example editors save and return to their own administration instead of the customer dashboard', async t => {
  const f = editor(t, { creation: false, exampleId: 'example' });
  f.changeName('Ejemplo actualizado'); await f.click();
  assert.deepEqual(f.routes.at(-1), ['push', '/admin/disenos/example']);
});

test('the leave dialog offers save, stay and unsaved exit and protects an active save from Escape', () => {
  const compiled = ts.transpileModule(fs.readFileSync('components/dashboard/EditorLeaveDialog.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => name === 'react' ? { ...React, useRef: () => ({ current: null }), useEffect() {} } : require(name), mod, mod.exports);
  let stays = 0;
  const view = mod.exports.EditorLeaveDialog({ onStay: () => stays++, onLeave() {}, onSaveAndLeave() {}, saving: true, error: 'No se pudo guardar.' });
  assert.deepEqual(nodes(view, node => node.type === 'button').map(text), ['Seguir editando', 'Salir sin guardar', 'Guardando…']);
  assert.ok(nodes(view, node => node.type === 'button').every(node => node.props.disabled));
  assert.equal(text(nodes(view, node => node.props?.role === 'alert')[0]), 'No se pudo guardar.');
  let prevented = false;
  view.props.onCancel({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(stays, 0);
});

test('privacy is edited as part of the invitation and its PIN is never written to the device backup', async t => {
  const f = editor(t, { privacy: 'UNSET' }); f.states[1] = 6; f.render();
  const [fields] = nodes(f.view, node => node.props?.onChange && node.props.privacy === 'UNSET');
  fields.props.onChange({ privacy: 'PRIVATE', pin: '001234', pinPending: true }); f.render();
  assert.equal(f.controller.shouldWarn(), true);
  const record = JSON.parse([...f.storage.data.values()][0]);
  assert.equal(JSON.parse(record.snapshot).privacy, 'PRIVATE');
  assert.equal(JSON.parse(record.snapshot).pin, '');
  assert.equal(JSON.parse(record.snapshot).pinPending, true);
  assert.equal(JSON.stringify(record).includes('001234'), false);
  await f.click();
  const saved = f.db.state.events.get(f.controller.getEventId());
  assert.equal(saved.privacy, 'PRIVATE'); assert.equal(saved.privacyVersion, 1);
  assert.equal(await f.db.load('lib/invitation-pin.ts').verifyInvitationPin('001234', saved.pinHash), true);
  assert.deepEqual(f.routes.at(-1), ['replace', '/dashboard']);
});

test('continuing to payment saves the selected privacy and PIN without a separate settings action', async t => {
  for (const privacy of ['PUBLIC', 'PRIVATE']) {
    const f = editor(t, { privacy: 'UNSET' }); f.allowPublication = true;
    f.states[0] = { ...f.states[0], hostNames: 'Alex y Sam', eventDate: '2027-01-15', eventTime: '18:00', venue: 'Salón', address: 'Calle',
      privacy, pin: privacy === 'PRIVATE' ? '001234' : '', pinPending: privacy === 'PRIVATE' };
    f.states[1] = 6; f.render();
    f.refs[0].current = { reportValidity: () => true };
    const [button] = nodes(f.view, node => node.props?.['aria-label'] === 'Guardar y continuar al pago');
    assert.equal(button.props.disabled, false);
    button.props.onClick(); await f.flush();
    const saved = f.db.state.events.get(f.controller.getEventId());
    assert.equal(saved.privacy, privacy); assert.equal(saved.status, 'PENDING_PAYMENT');
    assert.equal(f.publications, 1);
    assert.deepEqual(f.routes.at(-1), ['replace', `/dashboard/eventos/${saved.id}/pago`]);
  }
});

test('a missing privacy choice or unfinished PIN appears in review and prevents payment', async t => {
  const f = editor(t, { privacy: 'UNSET' }); f.states[1] = 6; f.render();
  assert.match(text(f.view), /Elige si tu invitación será pública o protegida con PIN/);
  assert.equal(nodes(f.view, node => node.props?.['aria-label'] === 'Guardar y continuar al pago')[0].props.disabled, true);
  f.states[0] = { ...f.states[0], privacy: 'PRIVATE', pin: '123', pinPending: true }; f.render();
  assert.match(text(f.view), /PIN de seis dígitos/);
  await f.click();
  assert.equal(f.controller.getSnapshot().code, 'validation');
  assert.equal(f.routes.length, 0);
});

test('subsequent content saves retain the configured PIN and its privacy revision', async t => {
  const f = editor(t, { creation: false, privacy: 'UNSET' });
  f.states[0] = { ...f.states[0], privacy: 'PRIVATE', pin: '001234', pinPending: true }; f.render();
  await f.controller.saveNow(false); f.render();
  const first = structuredClone(f.db.state.events.get('event'));
  f.db.state.accessSessions.set('session', { tokenHash: 'session', eventId: 'event' });
  f.changeName('Otro contenido'); await f.controller.saveNow(false); f.render();
  const next = f.db.state.events.get('event');
  assert.equal(next.privacyVersion, first.privacyVersion); assert.equal(next.pinHash, first.pinHash);
  assert.equal(f.db.state.accessSessions.size, 1);
  f.states[0] = { ...f.states[0], privacy: 'PUBLIC', pin: '', pinPending: false }; f.render();
  await f.controller.saveNow(false);
  assert.equal(f.db.state.events.get('event').privacy, 'PUBLIC');
  assert.equal(f.db.state.events.get('event').pinHash, null);
  assert.equal(f.db.state.accessSessions.size, 0);
});

test('a privacy change in another tab cannot be overwritten without reviewing the conflict', async t => {
  const f = editor(t, { creation: false, privacy: 'UNSET' });
  const settings = f.db.load('app/dashboard/eventos/[id]/ajustes/actions.ts');
  assert.equal((await settings.saveInvitationPrivacy('event', 'PUBLIC', '', 0)).ok, true);
  f.states[0] = { ...f.states[0], name: 'Mi versión', privacy: 'PRIVATE', pin: '001234', pinPending: true }; f.render();
  await f.click();
  assert.equal(f.controller.getSnapshot().code, 'conflict');
  assert.equal(f.controller.getSnapshot().conflictPrivacyVersion, 1);
  assert.equal(f.db.state.events.get('event').name, 'Mi celebración');
  assert.equal(f.db.state.events.get('event').privacy, 'PUBLIC');
  assert.equal(f.routes.length, 0);
  assert.equal((await f.controller.saveNow(false, 0, 1)).ok, true);
  assert.equal(f.db.state.events.get('event').privacy, 'PRIVATE');
  assert.equal(f.db.state.events.get('event').privacyVersion, 2);
});
