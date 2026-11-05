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
  const filename = path.resolve('components/invitation/BirthdayElegantInvitation.tsx');
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
  return (props) => renderToStaticMarkup(React.createElement(exported.BirthdayElegantInvitation, props));
}

test('Elegant retains legacy data while new drafts use the shared presentation', async () => {
  const f = createFixture();
  const { birthdayElegantId, birthdayElegantAssets } = f.load('lib/birthday-elegant.ts');
  const { isInvitationTemplate } = f.load('lib/invitation-templates.ts');
  const { applyGuidedDesign } = f.load('lib/guided-invitation.ts');
  assert.equal(isInvitationTemplate('birthday', birthdayElegantId), true);
  assert.equal(isInvitationTemplate('wedding', birthdayElegantId), false);
  assert.equal(birthdayElegantAssets.length, 11);
  for (const asset of birthdayElegantAssets) assert.ok(fs.existsSync(path.join('public/birthday/elegant', `${asset}.webp`)));
  const original = { eventType: 'birthday', name: 'Mi fiesta', hostNames: 'Nombre propio', eventDate: '2027-04-12', imageUrl: 'https://example.com/my-photo.jpg', message: 'Mensaje propio', sections: [{ id: 'mine', type: 'custom', title: 'Mi título', content: 'Mis datos', enabled: true }] };
  const selected = applyGuidedDesign(original, birthdayElegantId);
  for (const field of ['name', 'hostNames', 'eventDate', 'imageUrl', 'message', 'sections']) assert.deepEqual(selected[field], original[field]);
  assert.equal(selected.typography, 'cormorant-garamond');
  assert.equal(selected.bodyTypography, 'dm-sans');
  assert.equal(f.load('lib/invitation-fonts.ts').isInvitationFont('cormorant-garamond'), true);
  const key = randomUUID();
  const form = f.saveForm();
  form.set('eventType', 'birthday'); form.set('templateId', birthdayElegantId); form.set('creationKey', key);
  form.set('typography', selected.typography); form.set('bodyTypography', selected.bodyTypography);
  assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok, true);
  assert.equal(f.state.events.get(key).templateId, "celebration-v1");
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  assert.equal(f.state.events.get('event').templateId, birthdayElegantId);
  assert.equal(f.state.events.get('event').typography, f.load('lib/shared-invitation.ts').sharedInvitationDesign.typography);
});

test('Elegant serves the selected artwork and connects the shared RSVP form', () => {
  const f = createFixture();
  const { birthdayElegantExample, birthdayElegantAssets } = f.load('lib/birthday-elegant.ts');
  const html = renderer(f)({ ...birthdayElegantExample, publicEventId: 'public-event-id' });
  // The three textures are CSS backgrounds; the complete collage remains available as a reference asset.
  for (const asset of birthdayElegantAssets.filter(asset => !['marble', 'silk', 'onyx-pattern', 'party-collection'].includes(asset))) assert.ok(html.includes(`/birthday/elegant/${asset}.webp`), asset);
  for (const asset of ['marble', 'silk', 'onyx-pattern']) assert.ok(fs.readFileSync('app/birthday-elegant.css', 'utf8').includes(`/birthday/elegant/${asset}.webp`));
  assert.match(html, /data-event-id="public-event-id"/);
  assert.match(html, /20:45/);
  assert.match(html, /https:\/\/open.spotify.com\//);
});

test('Elegant gallery preserves unique photographs and personal text with a themed interactive gallery', () => {
  const f = createFixture();
  const { birthdayElegantExample } = f.load('lib/birthday-elegant.ts');
  const gallery = { id: 'gallery', type: 'gallery', title: 'Mis recuerdos', content: 'Fotos de mi familia', detail: 'Un texto propio', link: '', imageUrl: 'https://example.com/a.jpg', imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'], enabled: true };
  const html = renderer(f)({ ...birthdayElegantExample, sections: [gallery] });
  const section = html.match(/<section class="elegant-section elegant-section-gallery"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.equal((section.match(/<img /g) || []).length, 2);
  assert.match(section, /Mis recuerdos/);
  assert.match(section, /Fotos de mi familia/);
  assert.match(section, /Un texto propio/);
  assert.doesNotMatch(section, /elegant-art|elegant-eyebrow/);
});

test('Elegant respects disabled sections, external confirmations and unsafe links', () => {
  const f = createFixture();
  const { birthdayElegantExample } = f.load('lib/birthday-elegant.ts');
  const rsvp = birthdayElegantExample.sections.find(section => section.type === 'rsvp');
  const render = renderer(f);
  const html = render({ ...birthdayElegantExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'https://example.com/rsvp' }, { ...rsvp, id: 'disabled', title: 'Should be hidden', enabled: false }] });
  assert.match(html, /href="https:\/\/example.com\/rsvp"/);
  assert.doesNotMatch(html, /<form|Should be hidden/);
  const unsafe = render({ ...birthdayElegantExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'javascript:alert(1)' }] });
  assert.doesNotMatch(unsafe, /javascript:|<form/);
});


test('Elegant respects personal ages and chooses readable action text for light and dark accents', () => {
  const f=createFixture();
  const { birthdayElegantExample }=f.load('lib/birthday-elegant.ts');
  const render=renderer(f);
  const personal={...birthdayElegantExample,name:'Mis 50',hostNames:'José',message:'Un mensaje personal',sections:[]};
  const light=render({...personal,accent:'#D4B77A'});
  assert.match(light,/Mis 50/);assert.match(light,/José/);assert.match(light,/Un mensaje personal/);
  assert.doesNotMatch(light,/cuarenta|Valeria/);
  assert.match(light,/--elegant-action-ink:#000000/);
  assert.match(render({...personal,accent:'#123456'}),/--elegant-action-ink:#ffffff/);
  assert.match(render({...personal,accent:'url(bad)'}),/--elegant-accent:#D4B77A/);
});
