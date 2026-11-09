/* eslint-disable @typescript-eslint/no-require-imports -- Verify unified privacy/content saves and controlled editor fields without external services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function privacyForm(f, privacy, pin = '', overrides = {}) {
  const event = f.state.events.get('event');
  const form = f.saveForm();
  for (const [key, value] of Object.entries({ privacy, pin, privacyVersion: String(event.privacyVersion), name: 'Contenido actualizado', ...overrides })) form.set(key, value);
  return form;
}

test('content, privacy and a leading-zero PIN save together and revoke old guest sessions', async () => {
  const f = createFixture(); f.state.events.get('event').privacy = 'UNSET';
  f.state.accessSessions.set('old', { tokenHash: 'old', eventId: 'event' });
  const result = await f.actions.updateEvent('event', privacyForm(f, 'PRIVATE', '001234'));
  assert.deepEqual(result, { ok: true, eventId: 'event', version: 1, privacyVersion: 1 });
  const event = f.state.events.get('event');
  assert.equal(event.name, 'Contenido actualizado'); assert.equal(event.privacy, 'PRIVATE');
  assert.equal(event.contentVersion, 1); assert.equal(event.privacyVersion, 1);
  assert.equal(await f.load('lib/invitation-pin.ts').verifyInvitationPin('001234', event.pinHash), true);
  assert.equal(JSON.stringify(result).includes('001234'), false);
  assert.equal(f.state.accessSessions.size, 0);
});

test('invalid access values and missing PINs cannot partially change the invitation', async () => {
  const f = createFixture(); const before = structuredClone(f.state.events.get('event'));
  for (const [privacy, pin, overrides] of [['PRIVATE', '', {}], ['PRIVATE', '123', {}], ['INVALID', '', {}],
    ['PUBLIC', '', { privacyVersion: '-1' }], ['PUBLIC', '', { privacyVersion: 'invalid' }], ['PRIVATE', '', { pinPending: 'true' }]]) {
    assert.equal((await f.actions.updateEvent('event', privacyForm(f, privacy, pin, overrides))).code, 'validation');
    assert.deepEqual(f.state.events.get('event'), before);
  }
});

test('a transaction failure rolls back both privacy and content and preserves existing guest sessions', async t => {
  const f = createFixture(); const before = structuredClone(f.state.events.get('event'));
  f.state.accessSessions.set('old', { tokenHash: 'old', eventId: 'event' });
  f.prisma.invitationAccessSession.deleteMany = async () => { throw new Error('Temporary failure'); };
  t.mock.method(console, 'error', () => {});
  assert.equal((await f.actions.updateEvent('event', privacyForm(f, 'PRIVATE', '001234'))).code, 'unavailable');
  assert.deepEqual(f.state.events.get('event'), before);
  assert.equal(f.state.accessSessions.size, 1);
});

test('the server checks privacy again before payment even when content has not changed', async () => {
  const f = createFixture();
  const settings = f.load('app/dashboard/eventos/[id]/ajustes/actions.ts');
  assert.equal((await settings.saveInvitationPrivacy('event', 'PRIVATE', '001234', 0)).ok, true);
  const result = await f.actions.publishEvent('event', 0, 0);
  assert.equal(result.code, 'conflict'); assert.equal(result.privacyVersion, 1);
  assert.equal(f.state.events.get('event').status, 'DRAFT');
});

test('older content-only saves preserve privacy and a pending replacement cannot silently reuse the old PIN', async () => {
  const f = createFixture();
  await f.load('app/dashboard/eventos/[id]/ajustes/actions.ts').saveInvitationPrivacy('event', 'PRIVATE', '001234', 0);
  const before = structuredClone(f.state.events.get('event'));
  assert.equal((await f.actions.updateEvent('event', f.saveForm())).ok, true);
  assert.equal(f.state.events.get('event').pinHash, before.pinHash);
  const current = structuredClone(f.state.events.get('event'));
  assert.equal((await f.actions.updateEvent('event', privacyForm(f, 'PRIVATE', '', { pinPending: 'true' }))).code, 'validation');
  assert.deepEqual(f.state.events.get('event'), current);
});

function fields(props) {
  const changes = [];
  const mod = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync('components/dashboard/InvitationPrivacyFields.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return { ...React, useState: initial => [initial, () => {}] };
    if (name.endsWith('.css')) return { default: {} };
    return require(name);
  }, mod, mod.exports);
  const view = mod.exports.InvitationPrivacyFields({ privacy: 'UNSET', pin: '', pinPending: false, hasPin: false, disabled: false, onChange: value => changes.push(value), ...props });
  return { view, changes };
}
function nodes(node, match) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, match));
  return [...(match(node) ? [node] : []), ...nodes(node.props?.children, match)];
}
function text(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(text).join('');
  return node && typeof node === 'object' ? text(node.props?.children) : '';
}

test('the editor fields generate a PIN locally, update the parent and have no separate save button', () => {
  const f = fields();
  const buttons = nodes(f.view, node => node.type === 'button');
  assert.equal(buttons.some(node => /Guardar privacidad/.test(text(node))), false);
  buttons[1].props.onClick();
  assert.equal(f.changes[0].privacy, 'PRIVATE'); assert.match(f.changes[0].pin, /^\d{6}$/); assert.equal(f.changes[0].pinPending, true);
  const privateFields = fields({ privacy: 'PRIVATE', pin: '001234', pinPending: true });
  nodes(privateFields.view, node => node.type === 'button')[0].props.onClick();
  assert.deepEqual(privateFields.changes[0], { privacy: 'PUBLIC', pin: '', pinPending: false });
});

test('existing PINs stay hidden while recovered PIN edits require explicit re-entry', () => {
  const saved = fields({ privacy: 'PRIVATE', hasPin: true });
  assert.equal(nodes(saved.view, node => node.type === 'input').length, 0);
  assert.match(text(saved.view), /Conservaremos tu PIN actual/);
  const recovered = fields({ privacy: 'PRIVATE', hasPin: true, pinPending: true });
  assert.equal(nodes(recovered.view, node => node.type === 'input').length, 1);
  assert.match(text(recovered.view), /volver a escribir o generar el PIN/);
  const disabled = fields({ privacy: 'PRIVATE', pin: '001234', pinPending: true, disabled: true });
  assert.ok(nodes(disabled.view, node => node.type === 'button' || node.type === 'input').every(node => node.props.disabled));
});
