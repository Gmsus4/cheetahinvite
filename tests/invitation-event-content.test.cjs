/* eslint-disable @typescript-eslint/no-require-imports -- Match the project's Node test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const { invitationEventTypes, getInvitationEventContent, makeEventExampleSection, eventExampleSections } = require('../lib/invitation-event-content.ts');

test('every supported occasion has distinct welcome, story and program copy', () => {
  assert.deepEqual(invitationEventTypes, ['wedding', 'birthday', 'graduation', 'baby_shower', 'anniversary', 'other']);
  const content = invitationEventTypes.map(getInvitationEventContent);
  for (const field of ['heroKicker', 'heroIntro', 'message', 'welcomeTitle']) {
    assert.equal(new Set(content.map((item) => item[field])).size, 6, field);
  }
  for (const type of ['story', 'reception', 'program', 'parents', 'dress_code', 'gifts', 'rsvp', 'gallery', 'music', 'custom', 'ceremony']) {
    assert.equal(new Set(content.map((item) => item.sections[type].content)).size, 6, type);
    for (const occasion of invitationEventTypes) {
      const section = makeEventExampleSection(type, occasion);
      assert.ok(section.title.trim());
      assert.ok(section.content.trim());
      assert.ok(section.content.length <= 2000);
      assert.ok(section.title.length <= 100);
      assert.ok(section.detail.length <= 240);
      assert.equal(section.link, '', 'examples must not include fake external destinations');
    }
  }
});

test('recommended details have unique ids and fit the editor limit', () => {
  for (const type of invitationEventTypes) {
    const sections = eventExampleSections(type);
    assert.ok(sections.length > 0 && sections.length <= 12);
    assert.equal(new Set(sections.map((section) => section.id)).size, sections.length);
    assert.equal(sections[0].id, 'default-story');
    assert.ok(sections.some((section) => section.type === 'rsvp'));
    assert.ok(getInvitationEventContent(type).message.length <= 1200);
  }
});

test('editing a suggestion cannot mutate future suggestions', () => {
  const first = eventExampleSections('birthday');
  first[0].content = 'Mi historia personalizada';
  first[0].imageUrls.push('/my-photo.webp');
  const next = eventExampleSections('birthday');
  assert.notEqual(next[0].content, first[0].content);
  assert.deepEqual(next[0].imageUrls, []);
  assert.equal(makeEventExampleSection('music', 'graduation', 'custom-id').id, 'custom-id');
});

test('unknown event types safely use general celebration content', () => {
  for (const type of ['unknown', '', 'toString', '__proto__']) {
    assert.equal(getInvitationEventContent(type), getInvitationEventContent('other'));
  }
});
