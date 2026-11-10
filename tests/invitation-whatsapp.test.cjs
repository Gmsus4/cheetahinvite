/* eslint-disable @typescript-eslint/no-require-imports -- Exercise editor callbacks and saves without external services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

const section = { id: 'rsvp', type: 'rsvp', title: 'Confirmación', content: '', detail: '', link: '', imageUrl: '', enabled: true, rsvpMode: 'external' };
const f = createFixture();
const { invitationWhatsAppLink: link, parseInvitationWhatsAppLink: parse } = f.load('lib/invitation-whatsapp.ts');

test('WhatsApp links normalize international numbers and encode the exact message', () => {
  const message = '¡Sí asistiré! 🎉\nAna & Luis + familia #2';
  const url = link('+52 (55) 1234-5678', message);
  assert.equal(new URL(url).pathname, '/525512345678');
  assert.equal(new URL(url).searchParams.get('text'), message);
  assert.deepEqual(parse(url), { phone: '525512345678', message });
  assert.equal(link('+1 415 555 2671', ''), 'https://wa.me/14155552671');
  for (const number of ['', '123', '0123456789', '+52abc5512345678', '1234567890123456']) assert.equal(link(number, message), '');
});

test('saved WhatsApp links reopen as phone and message; other URLs remain external links', () => {
  for (const url of ['https://wa.me/525512345678?text=Hola', 'https://api.whatsapp.com/send?phone=525512345678&text=Hola', 'https://web.whatsapp.com/send?phone=525512345678&text=Hola']) {
    assert.deepEqual(parse(url), { phone: '525512345678', message: 'Hola' });
  }
  for (const url of ['https://example.com/form', 'https://wa.me.evil.test/525512345678', 'javascript:alert(1)', 'https://wa.me/message/abc']) assert.equal(parse(url), null);
});

function fields(value) {
  const changes = [];
  const mod = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync('components/dashboard/InvitationWhatsAppFields.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'react') return { useState: initial => [initial, () => {}] };
    if (name === '@/lib/invitation-whatsapp') return f.load('lib/invitation-whatsapp.ts');
    return require(name);
  }, mod, mod.exports);
  const view = mod.exports.InvitationWhatsAppFields({ section: value, onChange: update => changes.push(update) });
  function find(node, id) {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) return node.map(child => find(child, id)).find(Boolean);
    return node.props?.id === id ? node : find(node.props?.children, id);
  }
  return { get: id => find(view, `rsvp-${id}`), changes };
}

test('controlled phone and message fields update the saved link and restore existing values', () => {
  const initial = fields(section);
  initial.get('phone').props.onChange({ target: { value: '+52 55 1234 5678' } });
  const withPhone = { ...section, ...initial.changes[0] };
  const next = fields(withPhone);
  next.get('whatsapp-message').props.onChange({ target: { value: '¡Confirmo! & gracias' } });
  assert.equal(new URL(next.changes[0].link).searchParams.get('text'), '¡Confirmo! & gracias');
  const legacy = fields({ ...section, link: link('525512345678', 'Hola') });
  assert.equal(legacy.get('country-code').props.value, '+52');
  assert.equal(legacy.get('phone').props.value, '5512345678');
  assert.equal(legacy.get('whatsapp-message').props.value, 'Hola');
  const external = fields({ ...section, link: 'https://example.com/form' });
  assert.equal(external.get('link').props.value, 'https://example.com/form');
  const invalid = fields({ ...section, whatsappPhone: '123', whatsappMessage: 'Hola' });
  assert.equal(invalid.get('phone').props['aria-invalid'], true);
  assert.equal(invalid.get('whatsapp-message').props.value, 'Hola');
});

test('the numeric national input separates the prefix and prevents incomplete Mexican links', () => {
  const initial = fields(section);
  assert.equal(initial.get('country-code').props.value, '+52');
  assert.equal(initial.get('phone').props.inputMode, 'numeric');
  initial.get('phone').props.onChange({ target: { value: '55 ab 1234-5678' } });
  assert.equal(initial.changes[0].whatsappPhone, '+52 5512345678');
  assert.equal(initial.changes[0].link, 'https://wa.me/525512345678');
  const saved = fields({ ...section, ...initial.changes[0] });
  assert.equal(saved.get('phone').props.value, '5512345678');
  saved.get('phone').props.onChange({ target: { value: '551234567' } });
  assert.equal(saved.changes[0].link, '');
  saved.get('country-code').props.onChange({ target: { value: '+1' } });
  assert.equal(saved.changes[1].whatsappPhone, '+1 5512345678');
  initial.get('phone').props.onChange({ target: { value: '+52 55 1234 5678' } });
  assert.equal(initial.changes[1].link, 'https://wa.me/525512345678');
});

test('phone, message and long encoded URLs survive saving; incomplete drafts remain editable', async () => {
  const fixture = createFixture();
  const message = '🎉'.repeat(100);
  const value = { ...section, whatsappPhone: '+52 55 1234 5678', whatsappMessage: message, link: link('525512345678', message) };
  assert.ok(value.link.length > 500);
  assert.equal((await fixture.actions.updateEvent('event', fixture.saveForm('', [value]))).ok, true);
  assert.deepEqual(fixture.state.events.get('event').sections[0].whatsappMessage, message);
  assert.equal(parse(fixture.state.events.get('event').sections[0].link).message, message);
  const draft = { ...section, whatsappPhone: '52', whatsappMessage: 'Hola' };
  assert.equal((await fixture.actions.updateEvent('event', fixture.saveForm('', [draft]))).ok, true);
  assert.equal(fixture.state.events.get('event').sections[0].whatsappPhone, '52');
  for (const invalid of [{ whatsappPhone: 123 }, { whatsappMessage: 'a'.repeat(201) }]) {
    assert.equal((await fixture.actions.updateEvent('event', fixture.saveForm('', [{ ...section, ...invalid }]))).code, 'validation');
  }
});
