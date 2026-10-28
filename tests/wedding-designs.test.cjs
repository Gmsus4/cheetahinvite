/* eslint-disable @typescript-eslint/no-require-imports -- Exercise curated designs and real server actions with an isolated store. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function setup() {
  const f = createFixture();
  return { f, ...f.load('lib/wedding-designs.ts') };
}

function contrast(first, second) {
  const luminance = hex => {
    const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

test('expanded wedding catalog uses published artwork from all six collections and readable approved palettes', () => {
  const { weddingDesigns, weddingArtwork } = setup();
  assert.equal(weddingDesigns.length, 8);
  assert.equal(new Set(weddingDesigns.map(design => design.id)).size, weddingDesigns.length);
  assert.deepEqual(new Set(weddingDesigns.map(design => design.artwork).filter(Boolean)), new Set(['plantilla1', 'plantilla2', 'plantilla3', 'plantilla4', 'plantilla5', 'plantilla6']));
  for (const design of weddingDesigns) {
    assert.equal(design.palettes.length, 6);
    assert.equal(new Set(design.palettes.map(palette => palette.accent.toLowerCase())).size, 6);
    const art = weddingArtwork(design);
    if (design.artwork) for (const slot of ['topLeft', 'bottomRight', 'flower', 'decoration']) {
      assert.ok(art[slot], `${design.label}: missing ${slot}`);
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', art[slot])));
      assert.ok(art[slot].includes(`/${design.artwork}/`));
    }
    for (const palette of design.palettes) {
      for (const color of ['accent', 'paper', 'panel', 'ink', 'muted', 'dark']) assert.match(palette[color], /^#[\da-f]{6}$/i);
      for (const background of ['paper', 'panel']) for (const foreground of ['ink', 'muted']) {
        assert.ok(contrast(palette[foreground], palette[background]) >= 4.5, `${design.label} / ${palette.label}: ${foreground} on ${background}`);
      }
      assert.ok(contrast('#ffffff', palette.accent) >= 4.5, `${design.label} / ${palette.label}: button text`);
    }
  }
});

test('olive and linen publishes all five supplied assets unchanged, including the linen texture', () => {
  const { getWeddingDesign, weddingArtwork } = setup();
  const design = getWeddingDesign('wedding-olive-v1');
  assert.equal(design.label, 'Olivo y lino');
  assert.equal(design.artwork, 'plantilla6');
  const art = weddingArtwork(design);
  for (const [slot, source] of Object.entries({ topLeft: 'Superior_izquierdo.png', bottomRight: 'Inferior_derecho.png', flower: 'flor.png', decoration: 'decorate.png', texture: 'textura.jpg' })) {
    assert.ok(art[slot]);
    assert.deepEqual(fs.readFileSync(path.join(__dirname, '..', 'public', art[slot])), fs.readFileSync(path.join(__dirname, '..', 'recursos-plantillas', 'boda', 'plantilla6', source)));
  }
  assert.equal(art.texture, '/plantillas/boda/plantilla6/texture.jpg');
});

test('all new and existing wedding palettes survive server saving without falling back to the default', async () => {
  const { f, weddingDesigns } = setup();
  for (const design of weddingDesigns) for (const palette of design.palettes) {
    const form = f.saveForm(); form.set('templateId', design.id); form.set('accent', palette.accent);
    const result = await f.actions.updateEvent('event', form);
    assert.equal(result.ok, true, `${design.label} / ${palette.label}`);
    const stored = f.state.events.get('event');
    assert.equal(stored.templateId, design.id);
    assert.equal(stored.accent, palette.accent);
    assert.equal(stored.typography, design.typography);
  }
});

test('switching between wedding designs preserves personal content and applies complete approved identities', () => {
  const { weddingDesigns, weddingSections, applyWeddingDesign, weddingPalette } = setup();
  const input = { name: 'Nuestra celebración', hostNames: 'Andrea y Alex', message: 'Un texto propio', imageUrl: 'https://example.invalid/photo.jpg', eventDate: '2027-10-12', sections: weddingSections().reverse(), customSlug: 'nuestra-boda', accent: '#ff00ff' };
  for (const design of weddingDesigns) {
    const result = applyWeddingDesign(input, design.id, '#ff00ff');
    for (const key of ['name', 'hostNames', 'message', 'imageUrl', 'eventDate', 'customSlug']) assert.equal(result[key], input[key]);
    assert.equal(result.typography, design.typography);
    assert.equal(result.bodyTypography, design.bodyTypography);
    assert.deepEqual(result.buttonAppearance, design.buttons);
    assert.equal(result.accent, design.palettes[0].accent);
    assert.equal(weddingPalette(design, design.palettes[1].accent.toLowerCase()), design.palettes[1]);
    assert.deepEqual(result.sections.map(s => s.type), weddingSections().map(s => s.type));
  }
});

test('new wedding defaults contain no fictional event facts, and optional sections do not block publication', () => {
  const { weddingSections, weddingPublicationIssues } = setup();
  const sections = weddingSections();
  assert.equal(sections.filter(s => s.enabled).length, 1);
  assert.equal(sections.find(s => s.enabled).rsvpMode, 'integrated');
  assert.ok(sections.every(s => !s.content && !s.detail && !s.link && !s.imageUrl));
  const values = { hostNames: 'Andrea y Alex', eventDate: '2027-10-12', eventTime: '17:00', venue: 'Lugar real', address: 'Dirección real', sections };
  assert.deepEqual(weddingPublicationIssues(values), []);
  const ceremony = sections.find(s => s.type === 'ceremony'); ceremony.enabled = true; ceremony.content = 'Templo';
  assert.equal(weddingPublicationIssues(values).length, 1);
  ceremony.detail = '16:00'; ceremony.link = 'Dirección de ceremonia';
  assert.deepEqual(weddingPublicationIssues(values), []);
  const rsvp = sections.find(s => s.type === 'rsvp'); rsvp.rsvpMode = 'external';
  assert.equal(weddingPublicationIssues(values).length, 1);
  rsvp.link = 'https://wa.me/5215555555555';
  assert.deepEqual(weddingPublicationIssues(values), []);
});

test('server saves a curated identity and fixed section order while preserving legacy freedom', async () => {
  const { f, weddingDesigns, weddingSections } = setup();
  const form = f.saveForm(); const design = weddingDesigns[0];
  form.set('templateId', design.id); form.set('accent', '#ff00ff'); form.set('typography', 'inter');
  form.set('sections', JSON.stringify(weddingSections().reverse()));
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  const stored = f.state.events.get('event');
  assert.equal(stored.templateId, design.id);
  assert.equal(stored.accent, design.palettes[0].accent);
  assert.equal(stored.typography, design.typography);
  assert.deepEqual(stored.sections.map(s => s.type), weddingSections().map(s => s.type));
  const legacy = f.saveForm(); legacy.set('contentVersion', '1'); legacy.set('accent', '#ff00ff'); legacy.set('templateId', 'plantilla3');
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').accent, '#ff00ff');
});

test('new wedding drafts survive preparation with their versioned design and require real facts to publish', async () => {
  const { f, weddingDesigns, weddingSections } = setup();
  const form = f.saveForm(); const key = randomUUID();
  form.set('creationKey', key); form.set('templateId', weddingDesigns[2].id);
  assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok, true);
  assert.equal(f.state.events.get(key).templateId, weddingDesigns[2].id);
  const event = f.state.events.get('event');
  Object.assign(event, { eventType: 'wedding', templateId: weddingDesigns[2].id, sections: weddingSections() });
  assert.equal((await f.actions.publishEvent('event', 0)).code, 'validation');
  assert.equal(event.status, 'DRAFT');
  Object.assign(event, { hostNames: 'Andrea y Alex', eventDate: new Date('2027-10-12T12:00:00Z'), eventTime: '17:00', venue: 'Lugar real', address: 'Dirección real' });
  assert.equal((await f.actions.publishEvent('event', 0)).ok, true);
  assert.equal(f.state.events.get('event').status, 'PENDING_PAYMENT');
});

test('wedding completeness checks apply only to new identities and cannot be bypassed through checkout', async () => {
  const { weddingEventPublicationIssues, weddingDesigns } = setup();
  assert.deepEqual(weddingEventPublicationIssues({ eventType: 'wedding', templateId: 'plantilla1' }), []);
  assert.deepEqual(weddingEventPublicationIssues({ eventType: 'birthday', templateId: 'none' }), []);
  const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');
  const f = createPaymentFixture();
  f.events.set('incomplete-wedding', { id: 'incomplete-wedding', ownerId: f.ownerId, eventType: 'wedding', templateId: weddingDesigns[0].id, paidAt: null });
  await assert.rejects(() => f.checkout.prepareInvitationCheckout('incomplete-wedding', f.ownerId), /Complete the invitation/);
  assert.equal(f.calls.length, 0);
  assert.equal(f.payments.size, 0);
});
