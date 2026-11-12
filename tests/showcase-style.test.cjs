/* eslint-disable @typescript-eslint/no-require-imports -- Exercise style adoption with the real actions and controlled persistence. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

async function navigation(promise) {
  try { await promise; assert.fail('Expected redirect'); }
  catch (error) { if (!error.url) throw error; return error.url; }
}

function setup() {
  const f = createFixture();
  const example = f.load('lib/landing-invitation-example.ts').landingEventExamples.find(item => item.invitation.eventType === 'graduation');
  const content = {
    ...structuredClone(example.invitation), coverLayout: 'overlay', panelStyle: 'glass',
    blurIntensity: 72, backgroundBlurIntensity: 21, backgroundDimIntensity: 35,
    glassBorder: false, sectionCorners: 'soft', showSectionIcons: false,
  };
  f.state.examples.set('example', { id: 'example', eventId: 'admin-event', slug: 'selected-style', publishedAt: new Date(), publishedContent: content });
  f.content = content;
  f.apply = f.load('app/ejemplo-invitacion/[style]/utilizar/actions.ts').useExampleStyle;
  f.newForm = (key = randomUUID()) => { const form = new FormData(); form.set('eventId', 'new'); form.set('creationKey', key); return form; };
  f.existingForm = (id = 'event', version = 0) => { const form = new FormData(); form.set('eventId', id); form.set('contentVersion', String(version)); return form; };
  return f;
}

test('a new invitation copies the public design and content, remains private to its owner as a draft, and retries consume one slot', async () => {
  const f = setup();
  Object.assign(f.content, { ownerId: 'admin', isExample: true, privacy: 'PRIVATE', pinHash: 'secret', paidAt: new Date(), slug: 'reserved', contentVersion: 91 });
  const original = structuredClone(f.content);
  const key = randomUUID();
  const form = f.newForm(key);
  const results = await Promise.all([navigation(f.apply('selected-style', form)), navigation(f.apply('selected-style', form))]);
  assert.deepEqual(results, [`/crear?resume=${key}`, `/crear?resume=${key}`]);
  const event = f.state.events.get(key);
  for (const field of ['name', 'eventType', 'hostNames', 'accent', 'typography', 'bodyTypography', 'coverLayout', 'panelStyle', 'blurIntensity', 'backgroundBlurIntensity', 'backgroundDimIntensity', 'glassBorder', 'sectionCorners', 'showSectionIcons', 'imageUrl']) assert.equal(event[field], f.content[field], field);
  assert.equal(event.ownerId, 'owner');
  assert.equal(event.isExample, false);
  assert.equal(event.status, 'DRAFT');
  assert.equal(event.privacy, 'UNSET');
  assert.equal(event.pinHash, null);
  assert.equal(event.paidAt, null);
  assert.equal(event.contentVersion, 0);
  assert.equal(event.slug, undefined);
  assert.equal(f.state.users.get('owner').invitationCount, 2);
  assert.deepEqual(f.content, original);
});

test('existing invitations keep identity, personal content, contacts, photos, extra blocks, access, and payment settings', async () => {
  const f = setup();
  const source = f.content.sections.find(section => section.type === 'story');
  source.textAlign = 'right'; source.panelStyle = 'blur';
  const personal = { ...structuredClone(source), id: 'my-story', title: 'Mi historia', content: 'Mi texto personal', detail: 'Mi detalle', imageUrl: 'https://example.com/my-photo.jpg', textAlign: 'left', panelStyle: 'color' };
  const extra = { ...structuredClone(source), id: 'style-0', type: 'custom', title: 'Mi bloque extra' };
  const event = f.state.events.get('event');
  Object.assign(event, { name: 'Mi celebración', hostNames: 'Mi nombre', eventType: 'birthday', venue: 'Mi lugar', eventDate: new Date('2030-02-20T12:00:00Z'), imageUrl: 'https://example.com/my-cover.jpg', backgroundImageUrl: 'https://example.com/my-background.jpg', privacy: 'PRIVATE', pinHash: 'my-pin', privacyVersion: 7, customSlug: 'my-link', sections: [personal, extra] });
  const before = structuredClone(event);
  assert.equal(await navigation(f.apply('selected-style', f.existingForm())), '/dashboard/eventos/event/show?from=dashboard');
  const after = f.state.events.get('event');
  for (const field of ['name', 'hostNames', 'eventType', 'venue', 'imageUrl', 'backgroundImageUrl', 'privacy', 'pinHash', 'privacyVersion', 'customSlug', 'paidAt', 'status']) assert.deepEqual(after[field], before[field], field);
  assert.deepEqual(after.eventDate, before.eventDate);
  const story = after.sections.find(section => section.id === 'my-story');
  assert.equal(story.content, personal.content);
  assert.equal(story.imageUrl, personal.imageUrl);
  assert.equal(story.textAlign, 'right');
  assert.equal(story.panelStyle, 'blur');
  assert.ok(after.sections.some(section => section.title === 'Mi bloque extra'));
  assert.equal(new Set(after.sections.map(section => section.id)).size, after.sections.length);
  assert.equal(after.contentVersion, 1);
  assert.equal(after.coverLayout, 'overlay');
  assert.equal(f.state.users.get('owner').invitationCount, 1);
});

test('anonymous visitors return through sign-in and cannot apply a style', async () => {
  const f = setup(); f.owner = null;
  const before = structuredClone(f.state);
  const url = await navigation(f.apply('selected-style', f.newForm()));
  assert.equal(new URL(url, 'https://example.com').searchParams.get('callbackUrl'), '/ejemplo-invitacion/selected-style/utilizar');
  assert.deepEqual(f.state, before);
});

test('another owner, examples, expired events, stale versions, invalid submissions and unpublished styles cannot be changed', async () => {
  for (const patch of [{ ownerId: 'other' }, { isExample: true }, { status: 'EXPIRED' }, { contentVersion: 1 }]) {
    const f = setup(); Object.assign(f.state.events.get('event'), patch);
    const before = structuredClone(f.state);
    assert.match(await navigation(f.apply('selected-style', f.existingForm())), /error=(unavailable|conflict)/);
    assert.deepEqual(f.state, before);
  }
  const f = setup();
  const before = structuredClone(f.state);
  assert.match(await navigation(f.apply('selected-style', f.newForm('invalid'))), /error=invalid/);
  f.state.examples.get('example').publishedAt = null;
  assert.match(await navigation(f.apply('selected-style', f.newForm())), /error=unavailable/);
  assert.deepEqual(f.state.events, before.events);
});

test('account limits and block overflow roll back without losing personal blocks', async () => {
  const f = setup();
  f.state.users.get('owner').invitationCount = 3;
  assert.match(await navigation(f.apply('selected-style', f.newForm())), /error=limit/);
  assert.equal(f.state.events.size, 1);
  assert.equal(f.state.users.get('owner').invitationCount, 3);
  const source = f.content.sections[0];
  f.state.events.get('event').sections = Array.from({ length: 16 }, (_, i) => ({ ...source, id: `custom-${i}`, type: 'custom', content: `Personal ${i}` }));
  const before = structuredClone(f.state.events.get('event'));
  assert.match(await navigation(f.apply('selected-style', f.existingForm())), /error=blocks/);
  assert.deepEqual(f.state.events.get('event'), before);
});

test('copied local and shared Cloudinary images remain editable and save through the normal editor', async () => {
  for (const cloudinary of [false, true]) {
    const f = setup();
    if (cloudinary) {
      f.content.imageUrl = f.url('cheetahinvite/admin/example/shared-photo');
      f.content.backgroundImageUrl = f.url('cheetahinvite/admin/example/shared-background');
    }
    const key = randomUUID();
    await navigation(f.apply('selected-style', f.newForm(key)));
    const event = f.state.events.get(key);
    const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
    const { editorFormData } = f.load('lib/invitation-editor.ts');
    const values = initialGuidedValues(event);
    values.hostNames = 'Mi nombre';
    const result = await f.actions.updateEvent(key, editorFormData(JSON.stringify(values), 0));
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(f.state.events.get(key).hostNames, 'Mi nombre');
    assert.equal(f.state.events.get(key).imageUrl, event.imageUrl);
    assert.equal(f.state.events.get(key).coverLayout, 'overlay');
  }
});

test('unapproved local paths are still rejected when saving images', async () => {
  const f = setup(); const key = randomUUID();
  await navigation(f.apply('selected-style', f.newForm(key)));
  const values = f.load('lib/guided-invitation.ts').initialGuidedValues(f.state.events.get(key));
  for (const imageUrl of ['/api/private-photo', '//outside.example/photo.png', '/demo/../api/private']) {
    values.imageUrl = imageUrl;
    const result = await f.actions.updateEvent(key, f.load('lib/invitation-editor.ts').editorFormData(JSON.stringify(values), 0));
    assert.equal(result.ok, false);
    assert.equal(f.state.events.get(key).contentVersion, 0);
  }
});

test('adopting an example copies its full image palette and removes an old palette when choosing a basic style',async()=>{
 const palette={light:'#F2E7C4',dark:'#593203',accents:['#F28A2E','#F26E22','#F2B950']};
 const f=setup();f.content.imagePalette=palette;f.content.accent=palette.light;
 assert.equal(await navigation(f.apply('selected-style',f.existingForm())),'/dashboard/eventos/event/show?from=dashboard');
 assert.deepEqual(f.state.events.get('event').imagePalette,palette);
 delete f.content.imagePalette;
 assert.equal(await navigation(f.apply('selected-style',f.existingForm('event',1))),'/dashboard/eventos/event/show?from=dashboard');
 assert.equal(f.state.events.get('event').imagePalette,null);
});
