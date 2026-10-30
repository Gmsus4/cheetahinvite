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
  const filename = path.resolve('components/invitation/BirthdayCowboyInvitation.tsx');
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
    if (name === '@/lib/invitation-links') return fixture.load('lib/invitation-links.ts');
    if (name === './RsvpForm') return { RsvpForm: ({ eventId }) => React.createElement('form', { 'data-event-id': eventId }) };
    if (name === './CountdownTimer') return { CountdownTimer: ({ date, time }) => React.createElement('time', { dateTime: `${date}T${time}` }) };
    return require(name);
  };
  new Function('require', 'exports', source)(load, exported);
  return (props) => renderToStaticMarkup(React.createElement(exported.BirthdayCowboyInvitation, props));
}

test('Cowboy remains a birthday design through selection, preparation and saving', async () => {
  const f = createFixture();
  const { birthdayCowboyId, birthdayCowboyAssets } = f.load('lib/birthday-cowboy.ts');
  const { isInvitationTemplate } = f.load('lib/invitation-templates.ts');
  const { applyGuidedDesign } = f.load('lib/guided-invitation.ts');
  assert.equal(isInvitationTemplate('birthday', birthdayCowboyId), true);
  assert.equal(isInvitationTemplate('wedding', birthdayCowboyId), false);
  assert.equal(birthdayCowboyAssets.length, 15);
  for (const asset of birthdayCowboyAssets) assert.ok(fs.existsSync(path.join('public/birthday/cowboy', `${asset}.webp`)));
  const original = { eventType: 'birthday', name: 'Mi fiesta', hostNames: 'Nombre propio', eventDate: '2027-04-12', imageUrl: 'https://example.com/my-photo.jpg', message: 'Mensaje propio', sections: [{ id: 'mine', type: 'custom', title: 'Mi título', content: 'Mis datos', enabled: true }] };
  const selected = applyGuidedDesign(original, birthdayCowboyId);
  for (const field of ['name', 'hostNames', 'eventDate', 'imageUrl', 'message', 'sections']) assert.deepEqual(selected[field], original[field]);
  assert.equal(selected.typography, 'rye');
  assert.equal(selected.bodyTypography, 'nunito');
  assert.equal(f.load('lib/invitation-fonts.ts').isInvitationFont('rye'), true);
  const key = randomUUID();
  const form = f.saveForm();
  form.set('eventType', 'birthday'); form.set('templateId', birthdayCowboyId); form.set('creationKey', key);
  form.set('typography', selected.typography); form.set('bodyTypography', selected.bodyTypography);
  assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok, true);
  assert.equal(f.state.events.get(key).templateId, birthdayCowboyId);
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  assert.equal(f.state.events.get('event').templateId, birthdayCowboyId);
  assert.equal(f.state.events.get('event').typography, 'rye');
});

test('Cowboy distributes all supplied resources and connects the shared RSVP form', () => {
  const f = createFixture();
  const { birthdayCowboyExample, birthdayCowboyAssets } = f.load('lib/birthday-cowboy.ts');
  const html = renderer(f)({ ...birthdayCowboyExample, publicEventId: 'public-event-id' });
  // The landscape, leather and horse paper are CSS backgrounds; the twelve illustrations are images.
  for (const asset of birthdayCowboyAssets.filter(asset => !['desert-hero', 'leather', 'horse-paper'].includes(asset))) assert.ok(html.includes(`/birthday/cowboy/${asset}.webp`), asset);
  for (const asset of ['desert-hero', 'leather', 'horse-paper']) assert.ok(fs.readFileSync('app/birthday-cowboy.css', 'utf8').includes(`/birthday/cowboy/${asset}.webp`));
  assert.match(html, /data-event-id="public-event-id"/);
  assert.match(html, /18:30/);
  assert.match(html, /https:\/\/open.spotify.com\//);
});

test('Cowboy gallery preserves unique photographs and personal text without decorative characters', () => {
  const f = createFixture();
  const { birthdayCowboyExample } = f.load('lib/birthday-cowboy.ts');
  const gallery = { id: 'gallery', type: 'gallery', title: 'Mis recuerdos', content: 'Fotos de mi familia', detail: 'Un texto propio', link: '', imageUrl: 'https://example.com/a.jpg', imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'], enabled: true };
  const html = renderer(f)({ ...birthdayCowboyExample, sections: [gallery] });
  const section = html.match(/<section class="cowboy-section cowboy-section-gallery">([\s\S]*?)<\/section>/)[1];
  assert.equal((section.match(/<img /g) || []).length, 2);
  assert.match(section, /Mis recuerdos/);
  assert.match(section, /Fotos de mi familia/);
  assert.match(section, /Un texto propio/);
  assert.doesNotMatch(section, /cowboy-art|cowboy-kicker|\/birthday\/cowboy\//);
});

test('Cowboy respects disabled sections, external confirmations and unsafe links', () => {
  const f = createFixture();
  const { birthdayCowboyExample } = f.load('lib/birthday-cowboy.ts');
  const rsvp = birthdayCowboyExample.sections.find(section => section.type === 'rsvp');
  const render = renderer(f);
  const html = render({ ...birthdayCowboyExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'https://example.com/rsvp' }, { ...rsvp, id: 'disabled', title: 'Should be hidden', enabled: false }] });
  assert.match(html, /href="https:\/\/example.com\/rsvp"/);
  assert.doesNotMatch(html, /<form|Should be hidden/);
  const unsafe = render({ ...birthdayCowboyExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'javascript:alert(1)' }] });
  assert.doesNotMatch(unsafe, /javascript:|<form/);
});
