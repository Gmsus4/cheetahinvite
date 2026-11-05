/* eslint-disable @typescript-eslint/no-require-imports -- Verify coherent examples and optional manual resources. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

test('each occasion has one complete fictional example documented with its own image folder', () => {
  const { landingEventExamples } = createFixture().load('lib/landing-invitation-example.ts');
  assert.equal(landingEventExamples.length, 6);
  assert.equal(new Set(landingEventExamples.map(e => e.slug)).size, 6);
  const instructions = fs.readFileSync('readme.me', 'utf8');
  for (const type of ['wedding', 'birthday', 'graduation', 'baby_shower', 'anniversary', 'other']) {
    const examples = landingEventExamples.filter(e => e.invitation.eventType === type);
    assert.equal(examples.length, 1);
    assert.equal(new Set(examples.map(e => e.invitation.hostNames)).size, 1);
    for (const example of examples) {
      const data = example.invitation;
      assert.ok(Number.isFinite(Date.parse(data.eventDateKey)));
      assert.ok(data.hostNames && data.venue && data.address && data.message);
      assert.ok(instructions.includes('public' + example.imageFolder));
      assert.ok(instructions.includes('/ejemplo-invitacion/' + example.slug));
      assert.ok(data.sections.find(s => s.type === 'story').content.length > 80);
      assert.ok(data.sections.find(s => s.type === 'program').content.startsWith(data.eventTime));
      assert.equal(data.sections.find(s => s.type === 'rsvp').rsvpMode, 'integrated');
    }
  }
});

test('manual photos override only their example and missing photos retain safe fallbacks', t => {
  const f = createFixture();
  const { landingEventExamples } = f.load('lib/landing-invitation-example.ts');
  const { exampleWithImages } = f.load('lib/invitation-example-images.ts');
  const example = landingEventExamples[1];
  t.mock.method(fs, 'existsSync', file => String(file).replaceAll('\\', '/').endsWith(example.imageFolder + '/fondo.jpg')
    || String(file).replaceAll('\\', '/').endsWith(example.imageFolder + '/galeria-1.webp'));
  const filled = exampleWithImages(example);
  assert.equal(filled.backgroundImageUrl, example.imageFolder + '/fondo.jpg');
  assert.equal(filled.imageUrl, example.invitation.imageUrl);
  assert.deepEqual(filled.sections.find(s => s.type === 'gallery').imageUrls, [example.imageFolder + '/galeria-1.webp']);
  assert.equal(filled.sections.find(s => s.type === 'gallery').enabled, true);
  assert.equal(exampleWithImages(landingEventExamples[2]).backgroundImageUrl, '');
  assert.notDeepEqual(example.invitation.sections.find(s => s.type === 'gallery').imageUrls, filled.sections.find(s => s.type === 'gallery').imageUrls);
});
