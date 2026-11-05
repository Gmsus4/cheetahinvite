/* eslint-disable @typescript-eslint/no-require-imports -- Exercise compatibility through actual server actions. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { createPaymentFixture } = require('./helpers/payment-fixture.cjs');

const birthdayIds = ['confetti', 'pastel', 'neon', 'disco', 'dinosaur', 'space', 'gamer', 'cowboy', 'elegant', 'cinema'].map(kind => `birthday-${kind}-v1`);
const weddingIds = ['floral','editorial','minimal','garden','blossom','bougainvillea','sunlight','olive','mediterranean','art-deco','love-letter','starlight'].flatMap(kind => [`wedding-${kind}-v1`, `wedding-${kind}-v2`]);

test('all occasions accept the shared presentation and only their own retired identities', () => {
  const f = createFixture();
  const { isInvitationTemplate } = f.load('lib/invitation-templates.ts');
  for (const type of ['wedding', 'birthday', 'graduation', 'baby_shower', 'anniversary', 'other']) {
    for (const id of ['none', 'celebration-v1']) assert.equal(isInvitationTemplate(type, id), true);
    for (const id of birthdayIds) assert.equal(isInvitationTemplate(type, id), type === 'birthday', id);
    for (const id of weddingIds) assert.equal(isInvitationTemplate(type, id), type === 'wedding', id);
    for (const id of ['../plantilla1', 'birthday-unknown-v1', 'wedding-unknown-v1', 'plantilla9']) assert.equal(isInvitationTemplate(type, id), false);
  }
  assert.equal(isInvitationTemplate('unknown', 'celebration-v1'), false);
});

test('saving every retired identity adopts the shared presentation without losing content or fonts', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  const section = { id: 'own', type: 'custom', title: 'Mi apartado', content: 'Mis palabras', detail: '', link: '', imageUrl: '', enabled: true };
  for (const [eventType, ids] of [['wedding', [...weddingIds, ...Array.from({ length: 8 }, (_, i) => 'plantilla' + (i + 1))]], ['birthday', birthdayIds]]) {
    for (const templateId of ids) {
      const form = f.saveForm('', [section]);
      for (const [key, value] of Object.entries({ eventType, templateId, texture: 'linen', hostNames: 'Alex', typography: 'fredoka', bodyTypography: 'manrope', accent: '#123456' })) form.set(key, value);
      assert.equal((await f.actions.updateEvent('event', form)).ok, true, templateId);
      const saved = f.state.events.get('event');
      const opened = initialGuidedValues(saved);
      for (const value of [saved, opened]) {
        assert.equal(value.templateId, 'celebration-v1'); assert.equal(value.texture, 'none');
        assert.equal(value.hostNames, 'Alex'); assert.equal(value.typography, 'fredoka'); assert.equal(value.bodyTypography, 'manrope');
        assert.equal(value.accent, '#123456'); assert.equal(value.sections.find(s => s.id === 'own').content, 'Mis palabras');
      }
    }
  }
});

test('legacy weddings must supply event facts before publication or checkout', async () => {
  const f = createFixture();
  const { eventPublicationIssues } = f.load('lib/guided-invitation.ts');
  const event = f.state.events.get('event');
  Object.assign(event, { eventType: 'wedding', templateId: 'wedding-floral-v1' });
  assert.equal(eventPublicationIssues(event).length, 5);
  assert.equal((await f.actions.publishEvent('event', 0)).code, 'validation');
  Object.assign(event, { hostNames: 'Alex y Sam', eventDate: new Date('2027-01-15T12:00:00Z'), eventTime: '18:00', venue: 'Mi salón', address: 'Mi dirección' });
  assert.deepEqual(eventPublicationIssues(event), []);
  assert.equal((await f.actions.publishEvent('event', 0)).ok, true);
  const payment = createPaymentFixture();
  payment.addPurchase();
  Object.assign(payment.events.get('event-fixture'), { templateId: 'wedding-floral-v1', hostNames: '' });
  await assert.rejects(payment.checkout.prepareInvitationCheckout('event-fixture', payment.ownerId), /Complete the invitation/);
  assert.equal(payment.calls.some(call => call[0] === 'create'), false);
});
