/* eslint-disable @typescript-eslint/no-require-imports -- Node runner loads the TypeScript template catalog. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { invitationTemplates, getInvitationTemplate, isInvitationTemplate, sectionDecoration } = require('../lib/invitation-templates.ts');

test('all event types have three numbered slots and support no decoration', () => {
  for (const eventType of ['wedding', 'birthday', 'graduation', 'baby_shower', 'anniversary']) {
    assert.deepEqual(invitationTemplates.filter((t) => t.eventType === eventType).map((t) => t.id), ['plantilla1', 'plantilla2', 'plantilla3']);
    assert.equal(isInvitationTemplate(eventType, 'none'), true);
  }
});

test('Bugambilias distributes numbered decorations and older templates retain their fallback', () => {
  const template = getInvitationTemplate('wedding', 'plantilla3');
  assert.equal(template.label, 'Bugambilias');
  for (const [index, type] of ['program', 'music', 'story', 'dress_code'].entries()) {
    assert.equal(sectionDecoration(template, type), `/plantillas/boda/plantilla3/decoration${index + 1}.png`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', sectionDecoration(template, type))));
  }
  const original = getInvitationTemplate('wedding', 'plantilla1');
  assert.equal(sectionDecoration(original, 'program'), sectionDecoration(original, 'music'));
  assert.equal(sectionDecoration(original, 'story'), undefined);
  assert.equal(sectionDecoration(null, 'music'), undefined);
});
test('every available decoration has a published resource; empty templates cannot be selected', () => {
  for (const template of invitationTemplates) {
    assert.equal(isInvitationTemplate(template.eventType, template.id), template.available);
    for (const resource of Object.values(template.assets)) assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', resource)));
  }
  assert.equal(getInvitationTemplate('wedding', '../plantilla1'), null);
  assert.equal(getInvitationTemplate('other', 'plantilla1'), null);
  assert.equal(getInvitationTemplate('wedding', 'plantilla1').assets.topLeft, '/plantillas/boda/plantilla1/topLeft.png');
});

test('wedding template 2 resolves source filenames with spaces and its own palette', () => {
  const template = getInvitationTemplate('wedding', 'plantilla2');
  assert.ok(template);
  assert.equal(template.accent, '#A83D68');
  for (const slot of ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'flower', 'decoration']) {
    assert.ok(template.assets[slot], `Missing ${slot}`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', template.assets[slot])));
  }
});
