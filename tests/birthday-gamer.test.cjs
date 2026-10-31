/* eslint-disable @typescript-eslint/no-require-imports -- Validate real draft actions and server-rendered invitation content. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function renderer(fixture) {
  const filename = path.resolve('components/invitation/BirthdayGamerInvitation.tsx');
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const exported = {};
  const load = (name) => {
    if (name === 'next/image') return { __esModule: true, default: (props) => {
      const imageProps = { ...props };
      delete imageProps.unoptimized;
      return React.createElement('img', imageProps);
    } };
    if (name === './BirthdayGallery') return require('./helpers/birthday-renderer.cjs').loadBirthdayComponent('BirthdayGallery', fixture);
    if (name === '@/lib/invitation-links') return fixture.load('lib/invitation-links.ts');
    if (name === './RsvpForm') return { RsvpForm: ({ eventId }) => React.createElement('form', { 'data-event-id': eventId }) };
    if (name === './CountdownTimer') return { CountdownTimer: ({ date, time }) => React.createElement('time', { dateTime: `${date}T${time}` }) };
    return require(name);
  };
  new Function('require', 'exports', source)(load, exported);
  return (props) => renderToStaticMarkup(React.createElement(exported.BirthdayGamerInvitation, props));
}

test('Gamer remains a birthday design through selection, preparation and saving', async () => {
  const f = createFixture();
  const { birthdayGamerId, birthdayGamerAssets } = f.load('lib/birthday-gamer.ts');
  const { isInvitationTemplate } = f.load('lib/invitation-templates.ts');
  const { applyGuidedDesign } = f.load('lib/guided-invitation.ts');
  assert.equal(isInvitationTemplate('birthday', birthdayGamerId), true);
  assert.equal(isInvitationTemplate('wedding', birthdayGamerId), false);
  assert.equal(birthdayGamerAssets.length, 12);
  for (const asset of birthdayGamerAssets) assert.ok(fs.existsSync(path.join('public/birthday/gamer', `${asset}.webp`)));
  const original = { eventType: 'birthday', name: 'Mi fiesta', hostNames: 'Nombre propio', eventDate: '2027-04-12', imageUrl: 'https://example.com/my-photo.jpg', message: 'Mensaje propio', sections: [{ id: 'mine', type: 'custom', title: 'Mi título', content: 'Mis datos', enabled: true }] };
  const selected = applyGuidedDesign(original, birthdayGamerId);
  for (const field of ['name', 'hostNames', 'eventDate', 'imageUrl', 'message', 'sections']) assert.deepEqual(selected[field], original[field]);
  assert.equal(selected.typography, 'outfit');
  assert.equal(selected.bodyTypography, 'nunito');
  const key = randomUUID();
  const form = f.saveForm();
  form.set('eventType', 'birthday'); form.set('templateId', birthdayGamerId); form.set('creationKey', key);
  assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok, true);
  assert.equal(f.state.events.get(key).templateId, birthdayGamerId);
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  assert.equal(f.state.events.get('event').templateId, birthdayGamerId);
});

test('Gamer distributes all supplied resources and connects the shared RSVP form', () => {
  const f = createFixture();
  const { birthdayGamerExample, birthdayGamerAssets } = f.load('lib/birthday-gamer.ts');
  const html = renderer(f)({ ...birthdayGamerExample, publicEventId: 'public-event-id' });
  // The terrain is a CSS background; the eleven transparent characters are actual images.
  for (const asset of birthdayGamerAssets.filter(asset => asset !== 'minecraft-world')) assert.ok(html.includes(`/birthday/gamer/${asset}.webp`), asset);
  assert.ok(fs.readFileSync('app/birthday-gamer.css', 'utf8').includes('/birthday/gamer/minecraft-world.webp'));
  assert.match(html, /data-event-id="public-event-id"/);
  assert.match(html, /16:30/);
  assert.match(html, /https:\/\/open.spotify.com\//);
});

test('Gamer gallery preserves unique photographs and personal text with a themed interactive gallery', () => {
  const f = createFixture();
  const { birthdayGamerExample } = f.load('lib/birthday-gamer.ts');
  const gallery = { id: 'gallery', type: 'gallery', title: 'Mis recuerdos', content: 'Fotos de mi familia', detail: 'Un texto propio', link: '', imageUrl: 'https://example.com/a.jpg', imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'], enabled: true };
  const html = renderer(f)({ ...birthdayGamerExample, sections: [gallery] });
  const section = html.match(/<section class="gamer-section gamer-section-gallery"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.equal((section.match(/<img /g) || []).length, 2);
  assert.match(section, /Mis recuerdos/);
  assert.match(section, /Fotos de mi familia/);
  assert.match(section, /Un texto propio/);
  assert.doesNotMatch(section, /gamer-section-art|gamer-window-bar/);
});

test('Gamer respects disabled sections, external confirmations and unsafe links', () => {
  const f = createFixture();
  const { birthdayGamerExample } = f.load('lib/birthday-gamer.ts');
  const rsvp = birthdayGamerExample.sections.find(section => section.type === 'rsvp');
  const render = renderer(f);
  const html = render({ ...birthdayGamerExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'https://example.com/rsvp' }, { ...rsvp, id: 'disabled', title: 'Should be hidden', enabled: false }] });
  assert.match(html, /href="https:\/\/example.com\/rsvp"/);
  assert.doesNotMatch(html, /<form|Should be hidden/);
  const unsafe = render({ ...birthdayGamerExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'javascript:alert(1)' }] });
  assert.doesNotMatch(unsafe, /javascript:|<form/);
});
