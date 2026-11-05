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
  const filename = path.resolve('components/invitation/BirthdayCinemaInvitation.tsx');
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
  return (props) => renderToStaticMarkup(React.createElement(exported.BirthdayCinemaInvitation, props));
}

test('Cinema retains legacy data while new drafts use the shared presentation', async () => {
  const f = createFixture();
  const { birthdayCinemaId, birthdayCinemaAssets } = f.load('lib/birthday-cinema.ts');
  const { isInvitationTemplate } = f.load('lib/invitation-templates.ts');
  const { applyGuidedDesign } = f.load('lib/guided-invitation.ts');
  assert.equal(isInvitationTemplate('birthday', birthdayCinemaId), true);
  assert.equal(isInvitationTemplate('wedding', birthdayCinemaId), false);
  assert.equal(birthdayCinemaAssets.length, 12);
  for (const asset of birthdayCinemaAssets) assert.ok(fs.existsSync(path.join('public/birthday/cinema', `${asset}.webp`)));
  const original = { eventType: 'birthday', name: 'Mi fiesta', hostNames: 'Nombre propio', eventDate: '2027-04-12', imageUrl: 'https://example.com/my-photo.jpg', message: 'Mensaje propio', sections: [{ id: 'mine', type: 'custom', title: 'Mi título', content: 'Mis datos', enabled: true }] };
  const selected = applyGuidedDesign(original, birthdayCinemaId);
  for (const field of ['name', 'hostNames', 'eventDate', 'imageUrl', 'message', 'sections']) assert.deepEqual(selected[field], original[field]);
  assert.equal(selected.typography, 'cinzel');
  assert.equal(selected.bodyTypography, 'dm-sans');
  assert.equal(f.load('lib/invitation-fonts.ts').isInvitationFont('cinzel'), true);
  const key = randomUUID();
  const form = f.saveForm();
  form.set('eventType', 'birthday'); form.set('templateId', birthdayCinemaId); form.set('creationKey', key);
  form.set('typography', selected.typography); form.set('bodyTypography', selected.bodyTypography);
  assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok, true);
  assert.equal(f.state.events.get(key).templateId, "celebration-v1");
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  assert.equal(f.state.events.get('event').templateId, birthdayCinemaId);
  assert.equal(f.state.events.get('event').typography, selected.typography);
  assert.equal(f.state.events.get('event').bodyTypography, selected.bodyTypography);
});

test('Cinema serves the selected artwork and connects the shared RSVP form', () => {
  const f = createFixture();
  const { birthdayCinemaExample, birthdayCinemaAssets } = f.load('lib/birthday-cinema.ts');
  const html = renderer(f)({ ...birthdayCinemaExample, publicEventId: 'public-event-id' });
  for (const asset of birthdayCinemaAssets.filter(asset => !['curtain', 'deco-pattern', 'red-fabric'].includes(asset))) assert.ok(html.includes('/birthday/cinema/'+asset+'.webp'), asset);
  for (const asset of ['curtain','deco-pattern','red-fabric']) assert.ok(fs.readFileSync('app/birthday-cinema.css','utf8').includes('/birthday/cinema/'+asset+'.webp'));
  assert.match(html, /data-event-id="public-event-id"/);
  assert.match(html, /21:30/);
  assert.match(html, /https:\/\/open.spotify.com\//);
});

test('Cinema gallery preserves unique photographs and personal text with a themed interactive gallery', () => {
  const f = createFixture();
  const { birthdayCinemaExample } = f.load('lib/birthday-cinema.ts');
  const gallery = { id: 'gallery', type: 'gallery', title: 'Mis recuerdos', content: 'Fotos de mi familia', detail: 'Un texto propio', link: '', imageUrl: 'https://example.com/a.jpg', imageUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'], enabled: true };
  const html = renderer(f)({ ...birthdayCinemaExample, sections: [gallery] });
  const section = html.match(/<section class="cinema-section cinema-section-gallery"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.equal((section.match(/<img /g) || []).length, 2);
  assert.match(section, /Mis recuerdos/);
  assert.match(section, /Fotos de mi familia/);
  assert.match(section, /Un texto propio/);
  assert.doesNotMatch(section, /cinema-art|cinema-eyebrow/);
});

test('Cinema respects disabled sections, external confirmations and unsafe links', () => {
  const f = createFixture();
  const { birthdayCinemaExample } = f.load('lib/birthday-cinema.ts');
  const rsvp = birthdayCinemaExample.sections.find(section => section.type === 'rsvp');
  const render = renderer(f);
  const html = render({ ...birthdayCinemaExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'https://example.com/rsvp' }, { ...rsvp, id: 'disabled', title: 'Should be hidden', enabled: false }] });
  assert.match(html, /href="https:\/\/example.com\/rsvp"/);
  assert.doesNotMatch(html, /<form|Should be hidden/);
  const unsafe = render({ ...birthdayCinemaExample, sections: [{ ...rsvp, rsvpMode: 'external', link: 'javascript:alert(1)' }] });
  assert.doesNotMatch(unsafe, /javascript:|<form/);
});


test('Cinema respects personal ages and chooses readable action text for light and dark accents', () => {
  const f=createFixture();
  const { birthdayCinemaExample }=f.load('lib/birthday-cinema.ts');
  const render=renderer(f);
  const personal={...birthdayCinemaExample,name:'Mis 50',hostNames:'José',message:'Un mensaje personal',sections:[]};
  const light=render({...personal,accent:'#D4B77A'});
  assert.match(light,/Mis 50/);assert.match(light,/José/);assert.match(light,/Un mensaje personal/);
  assert.doesNotMatch(light,/cuarenta|Alex/);
  assert.match(light,/--cinema-action-ink:#000000/);
  assert.match(render({...personal,accent:'#123456'}),/--cinema-action-ink:#ffffff/);
  assert.match(render({...personal,accent:'url(bad)'}),/--cinema-accent:#9D2135/);
});

test('Cinema optional scenes retain their own layouts across every enabled combination', () => {
  const f = createFixture();
  const { birthdayCinemaExample } = f.load('lib/birthday-cinema.ts');
  const render = renderer(f);
  const types = ['story', 'ceremony', 'reception', 'parents', 'custom'];
  const layouts = ['cinema-letter', 'cinema-special-scene', 'cinema-next-location', 'cinema-cast', 'cinema-production-note'];
  const sections = types.map((type, i) => ({ id: type, type, title: `Personal heading ${i}`, content: `Personal content ${i}`, detail: `Personal detail ${i}`, imageUrl: `https://example.com/personal-${i}.jpg`, link: `https://example.com/destination-${i}`, enabled: true }));
  for (let mask = 0; mask < 32; mask++) {
    const html = render({ ...birthdayCinemaExample, sections: sections.map((s, i) => ({ ...s, enabled: Boolean(mask & (1 << i)) })) });
    let previous = -1;
    sections.forEach((s, i) => {
      if (mask & (1 << i)) {
        assert.ok(html.includes(`class="${layouts[i]}"`));
        for (const value of [s.title, s.content, s.detail, s.imageUrl, s.link]) assert.ok(html.includes(value), value);
        const position = html.indexOf(s.title);
        assert.ok(position > previous);
        previous = position;
      } else {
        assert.ok(!html.includes(s.title));
      }
    });
    assert.doesNotMatch(html, /class="cinema-note"/);
  }
  const reversed = render({ ...birthdayCinemaExample, sections: [...sections].reverse() });
  assert.ok(reversed.indexOf(sections[4].title) < reversed.indexOf(sections[0].title));
  for (const layout of layouts) assert.ok(reversed.includes(`class="${layout}"`));
});
