/* eslint-disable @typescript-eslint/no-require-imports -- Load TypeScript helpers in Node tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { invitationExternalUrl, invitationLinkLabel, invitationMapUrl, invitationSectionUrl } = require('../lib/invitation-links.ts');

test('map sections accept addresses and preserve shared Maps links', () => {
  for (const type of ['ceremony', 'reception']) {
    const url = new URL(invitationSectionUrl(type, '  Salón & Jardín, Calle #2, Oaxaca  '));
    assert.equal(url.searchParams.get('query'), 'Salón & Jardín, Calle #2, Oaxaca');
    assert.equal(url.searchParams.get('api'), '1');
    assert.equal(invitationSectionUrl(type, 'https://maps.app.goo.gl/example'), 'https://maps.app.goo.gl/example');
    assert.equal(invitationSectionUrl(type, 'maps.app.goo.gl/example'), 'https://maps.app.goo.gl/example');
    for (const invalid of ['', '  ', 'javascript:alert(1)', 'data:text/html,test', '//example.com']) assert.equal(invitationSectionUrl(type, invalid), null);
  }
  assert.equal(invitationSectionUrl('gifts', 'Oaxaca'), null);
});
test('only valid web destinations become invitation links', () => {
  for (const value of ['', 'broken', 'javascript:alert(1)', 'data:text/html,test']) assert.equal(invitationExternalUrl(value), null);
  assert.equal(invitationExternalUrl('https://wa.me/521234'), 'https://wa.me/521234');
});
test('published labels describe the configured destination', () => {
  assert.equal(invitationLinkLabel('rsvp'), 'Confirmar asistencia');
  assert.equal(invitationLinkLabel('ceremony'), 'Abrir mapa');
  assert.equal(invitationLinkLabel('custom'), 'Ver más información');
  for (const type of ['gifts', 'gallery', 'music', 'reception']) assert.ok(!invitationLinkLabel(type).includes('al publicar'));
});
test('location search safely preserves venue and address characters', () => {
  const url = new URL(invitationMapUrl('Salón & Jardín', 'Calle #2, Oaxaca'));
  assert.equal(url.searchParams.get('query'), 'Salón & Jardín, Calle #2, Oaxaca');
});
