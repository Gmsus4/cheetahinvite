/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in end-to-end privacy verification using disposable accounts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID, randomBytes } = require('node:crypto');
const file = 'node_modules/.cache/invitation-privacy-qa.json';
const cleanup = process.argv.includes('--cleanup');
const saved = cleanup ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const ownerId = saved?.ownerId || `__privacy_test_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { hashPassword } = require('../lib/password.ts');
const { saveInvitationPrivacy } = require('../app/dashboard/eventos/[id]/ajustes/actions.ts');
const { accessCookieName } = require('../lib/invitation-pin.ts');
let retain = false;
const origin = 'http://localhost:3000';
const request = (path, options = {}) => fetch(origin + path, { ...options, signal: AbortSignal.timeout(30000) });

(async () => {
  try {
    if (cleanup) return;
    const suffix = randomUUID(); const slug = `privacy-test-${suffix}`;
    const email = `privacy-${suffix}@example.invalid`; const password = `Privacy-${randomBytes(16).toString('hex')}`;
    await prisma.user.create({ data: { id: ownerId, name: 'Prueba de privacidad', email, passwordHash: await hashPassword(password), invitationCount: 1 } });
    const event = await prisma.event.create({ data: { ownerId, name: `SECRET_NAME_${suffix}`, eventType: 'wedding', address: `SECRET_ADDRESS_${suffix}`, message: `SECRET_MESSAGE_${suffix}`, customSlug: slug, slug: `legacy-${suffix}`, sections: [{ id: 'confirmation', type: 'rsvp', title: 'Confirma tu asistencia', content: '', detail: '', link: '', imageUrl: '', enabled: true, rsvpMode: 'integrated' }] } });
    assert.equal(event.privacy, 'UNSET');
    const legacy = `/invitacion/${ownerId}/previous-${suffix}`;
    await prisma.invitationLink.createMany({ data: [{ path: `/event/${slug}`, eventId: event.id }, { path: legacy, eventId: event.id }, { path: `/invitacion/${event.slug}`, eventId: event.id }] });
    assert.equal((await saveInvitationPrivacy(event.id, 'PRIVATE', '001234', 0)).ok, true);
    await prisma.event.update({ where: { id: event.id }, data: { status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000) } });
    async function page(cookie = '') {
      const response = await request(`/event/${slug}`, { headers: cookie ? { cookie } : {} });
      assert.equal(response.status, 200); return response.text();
    }
    const locked = await page(); assert.match(locked, /Una celebración privada/); assert.doesNotMatch(locked, /SECRET_NAME_|SECRET_ADDRESS_|SECRET_MESSAGE_/);
    for (const path of [legacy, `/invitacion/${event.slug}`]) {
      const response = await request(path); const html = await response.text();
      assert.equal(response.status, 200); assert.doesNotMatch(html, /SECRET_NAME_|SECRET_ADDRESS_|SECRET_MESSAGE_/); assert.ok(html.includes(`/event/${slug}`));
    }
    async function unlock(pin) { return request(`/api/invitations/${event.id}/unlock`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ pin }) }); }
    const wrong = await unlock('999999'); assert.equal(wrong.status, 401, await wrong.text());
    let response = await unlock('001234'); assert.equal(response.status, 200);
    const setCookie = response.headers.get('set-cookie'); assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /SameSite=lax/i);
    const cookie = setCookie.split(';')[0]; assert.ok(cookie.startsWith(accessCookieName(event.id) + '='));
    assert.match(await page(cookie), /SECRET_NAME_/);
    const rsvpPath = `/api/events/${event.id}/rsvp`; const token = 'a'.repeat(64);
    assert.equal((await request(rsvpPath, { headers: { authorization: `Bearer ${token}` } })).status, 403);
    const values = { token, name: 'Invitado de prueba', attending: true, companions: 1 };
    assert.equal((await request(rsvpPath, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(values) })).status, 403);
    assert.equal((await request(rsvpPath, { method: 'POST', headers: { origin, cookie, 'content-type': 'application/json' }, body: JSON.stringify(values) })).status, 200);
    assert.equal((await saveInvitationPrivacy(event.id, 'PRIVATE', '345678', 1)).ok, true);
    assert.doesNotMatch(await page(cookie), /SECRET_NAME_/);
    assert.equal((await request(rsvpPath, { headers: { cookie, authorization: `Bearer ${token}` } })).status, 403);
    assert.equal((await unlock('001234')).status, 401);
    assert.equal((await unlock('345678')).status, 200);
    assert.equal((await saveInvitationPrivacy(event.id, 'PUBLIC', '', 2)).ok, true);
    assert.match(await page(), /SECRET_NAME_/);
    assert.equal((await saveInvitationPrivacy(event.id, 'PRIVATE', '345678', 3)).ok, true);
    assert.doesNotMatch(await page(cookie), /SECRET_NAME_/);
    response = await unlock('345678'); const currentCookie = response.headers.get('set-cookie').split(';')[0];
    await prisma.invitationAccessSession.updateMany({ where: { eventId: event.id }, data: { expiresAt: new Date(0) } });
    assert.doesNotMatch(await page(currentCookie), /SECRET_NAME_/);
    if (process.argv.includes('--keep')) {
      fs.mkdirSync('node_modules/.cache', { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ ownerId, eventId: event.id, slug, email, password, pin: '345678' })); retain = true;
    }
    console.log('Privacy integration passed: locked HTML and metadata, old URLs, wrong/correct PIN, secure cookie, gated RSVP, PIN rotation, public/private toggles and session expiry.');
  } finally {
    if (!retain) {
      assert.ok(ownerId.startsWith('__privacy_test_'));
      await prisma.user.deleteMany({ where: { id: ownerId } });
      if (cleanup) fs.unlinkSync(file);
    }
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
