/* eslint-disable @typescript-eslint/no-require-imports -- Load TypeScript helpers in Node tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { invitationExternalUrl, invitationLinkLabel, invitationMapUrl } = require('../lib/invitation-links.ts');
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
