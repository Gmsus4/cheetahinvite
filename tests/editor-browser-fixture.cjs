/* eslint-disable @typescript-eslint/no-require-imports -- Creates/removes only an isolated browser-QA account. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { prisma } = require('./helpers/postgres-loader.cjs')('');
const { hashPassword } = require('../lib/password.ts');
const file = path.resolve('node_modules/.cache/editor-browser-fixture.json');
(async () => {
  try {
    if (['create', 'create-payments', 'create-rsvp'].includes(process.argv[2])) {
      assert.equal(fs.existsSync(file), false, 'Clean up the previous fixture first');
      const ownerId = `__editor_browser_${randomUUID()}`;
      const password = `Editor-${randomBytes(20).toString('hex')}`;
      const email = `editor-${randomUUID()}@example.invalid`;
      await prisma.user.create({ data: { id: ownerId, name: 'Prueba del editor', email, passwordHash: await hashPassword(password), invitationCount: 2 } });
      const draft = await prisma.event.create({ data: { ownerId, name: 'Prueba de autoguardado', eventType: 'wedding', sections: [] } });
      const published = await prisma.event.create({ data: { ownerId, name: 'Prueba publicada', eventType: 'wedding', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000), status: 'PUBLISHED', slug: `editor-fixture-${randomUUID()}`, sections: [] } });
      if (process.argv[2] === 'create-payments') {
        const originalExpiry = new Date(Date.now() + 86400000);
        const paymentData = { ownerId, amount: 49900, currency: 'mxn', livemode: false, status: 'PAID', paidAt: new Date(), expiresAt: originalExpiry, checkoutExpiresAt: new Date(), lastSyncedAt: new Date() };
        await prisma.invitationPayment.create({ data: { ...paymentData, eventId: published.id, eventName: 'Boda · reembolso parcial', refundedAmount: 10000 } });
        await prisma.invitationPayment.create({ data: { ...paymentData, eventId: draft.id, eventName: 'Cumpleaños · disputa en curso', disputeStatus: 'under_review' } });
        await prisma.event.update({ where: { id: draft.id }, data: { paidAt: new Date(), status: 'SUSPENDED', expiresAt: originalExpiry } });
        await prisma.invitationPayment.create({ data: { ...paymentData, eventId: `__deleted_fixture_${randomUUID()}`, eventName: 'Invitación eliminada · reembolso total', refundedAmount: 49900 } });
      }
      if (process.argv[2] === 'create-rsvp') {
        const confirmation = { id: 'confirmation', type: 'rsvp', title: 'Confirma tu asistencia', content: 'Nos encantará contar contigo.', detail: '', link: '', imageUrl: '', enabled: true, rsvpMode: 'integrated' };
        await prisma.event.update({ where: { id: published.id }, data: { sections: [confirmation], customSlug: 'rsvp-fixture' } });
        await prisma.event.update({ where: { id: draft.id }, data: { sections: [{ ...confirmation, rsvpMode: 'external' }] } });
      }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ ownerId, email, password, draftId: draft.id, publishedId: published.id, publishedSlug: published.slug, publicPath: process.argv[2] === 'create-rsvp' ? `/invitacion/${ownerId}/rsvp-fixture` : `/invitacion/${published.slug}` }));
      console.log('Browser fixture created; temporary credentials stored locally.');
    } else if (process.argv[2] === 'cleanup') {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert.ok(data.ownerId.startsWith('__editor_browser_'));
      assert.equal(await prisma.cloudinaryAsset.count({ where: { ownerId: data.ownerId } }), 0, 'Do not discard image cleanup records');
      await prisma.imageUploadBudget.deleteMany({ where: { ownerId: data.ownerId } });
      await prisma.invitationPayment.deleteMany({ where: { ownerId: data.ownerId } });
      await prisma.user.deleteMany({ where: { id: data.ownerId } });
      fs.unlinkSync(file);
      console.log('Browser fixture removed.');
    } else throw Error('Use create or cleanup');
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error(error.name); process.exitCode = 1; });
