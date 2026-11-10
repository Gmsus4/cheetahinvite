/* eslint-disable @typescript-eslint/no-require-imports -- Validate the private /show handoff against untrusted device storage. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
class MemoryStorage {
  data = new Map();
  get length() { return this.data.size; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
  removeItem(key) { this.data.delete(key); }
}
function setup() {
  const fixture = createFixture();
  const { initialGuidedValues } = fixture.load('lib/guided-invitation.ts');
  const values = initialGuidedValues({ ...fixture.state.events.get('event'), eventType: 'wedding', typography: 'default', bodyTypography: 'inter', accent: '#E9560A' });
  const record = { ownerId: 'owner', eventId: 'event', creationKey: randomUUID(), version: 3, privacyVersion: 2,
    snapshot: JSON.stringify({ ...values, privacy: 'PRIVATE', pin: '001234', pinPending: true }) };
  return { ...fixture.load('lib/invitation-preview.ts'), storage: new MemoryStorage(), record, now: Date.now(), token: randomUUID() };
}
test('/show transfers current content and revisions without storing privacy edits or PINs', () => {
  const f = setup();
  f.storeInvitationPreview(f.storage, f.record, f.token, f.now);
  const raw = f.storage.getItem(f.invitationPreviewKey('owner', 'event', f.token));
  const parsed = f.parseInvitationPreview(raw, 'owner', 'event', f.now);
  assert.equal(parsed.version, 3); assert.equal(parsed.privacyVersion, 2);
  assert.equal(JSON.parse(parsed.snapshot).name, JSON.parse(f.record.snapshot).name);
  assert.equal(JSON.parse(parsed.snapshot).privacy, undefined);
  assert.equal(JSON.parse(parsed.snapshot).pin, undefined);
  assert.equal(raw.includes('001234'), false);
});
test('/show rejects mismatched accounts, events, expired, corrupt and secret-bearing handoffs', () => {
  const f = setup(); f.storeInvitationPreview(f.storage, f.record, f.token, f.now);
  const raw = f.storage.getItem(f.invitationPreviewKey('owner', 'event', f.token));
  assert.equal(f.parseInvitationPreview(raw, 'another-owner', 'event', f.now), null);
  assert.equal(f.parseInvitationPreview(raw, 'owner', 'another-event', f.now), null);
  assert.equal(f.parseInvitationPreview(raw, 'owner', 'event', f.now + 30 * 60 * 1000 + 1), null);
  assert.equal(f.parseInvitationPreview('invalid', 'owner', 'event', f.now), null);
  assert.equal(f.parseInvitationPreview(JSON.stringify({ ...JSON.parse(raw), snapshot: f.record.snapshot }), 'owner', 'event', f.now), null);
});
test('separate previews cannot replace each other and an explicit save refreshes only its own handoff', () => {
  const f = setup(), other = randomUUID();
  f.storeInvitationPreview(f.storage, f.record, f.token, f.now);
  f.storeInvitationPreview(f.storage, f.record, other, f.now);
  const otherKey = f.invitationPreviewKey('owner', 'event', other), otherRaw = f.storage.getItem(otherKey);
  f.storeInvitationPreview(f.storage, { ...f.record, version: 4, saved: true }, f.token, f.now + 1);
  assert.equal(f.parseInvitationPreview(f.storage.getItem(f.invitationPreviewKey('owner', 'event', f.token)), 'owner', 'event', f.now + 1).version, 4);
  assert.equal(f.storage.getItem(otherKey), otherRaw);
  assert.equal(f.parseInvitationPreview(f.storage.getItem(f.invitationPreviewKey('owner', 'event', f.token)), 'owner', 'event', f.now + 1).saved, true);
});

test('creation handoffs preserve their return mode through saves and reject malformed modes', () => {
  const f = setup();
  f.storeInvitationPreview(f.storage, { ...f.record, creationFlow: true }, f.token, f.now);
  const key = f.invitationPreviewKey('owner', 'event', f.token);
  const record = f.parseInvitationPreview(f.storage.getItem(key), 'owner', 'event', f.now);
  assert.equal(record.creationFlow, true);
  f.storeInvitationPreview(f.storage, { ...record, saved: true, version: 4 }, f.token, f.now);
  const saved = f.parseInvitationPreview(f.storage.getItem(key), 'owner', 'event', f.now);
  assert.equal(saved.creationFlow, true);
  assert.equal(saved.saved, true);
  assert.equal(f.parseInvitationPreview(JSON.stringify({ ...saved, creationFlow: 'yes' }), 'owner', 'event', f.now), null);
  f.storeInvitationPreview(f.storage, { ...f.record, editorFlow: true, creationFlow: false }, f.token, f.now);
  const editing = f.parseInvitationPreview(f.storage.getItem(key), 'owner', 'event', f.now);
  assert.equal(editing.editorFlow, true);
  assert.equal(editing.creationFlow, false);
  assert.equal(f.parseInvitationPreview(JSON.stringify({ ...editing, editorFlow: 'yes' }), 'owner', 'event', f.now), null);
});
