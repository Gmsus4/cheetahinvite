/* eslint-disable @typescript-eslint/no-require-imports -- Load TypeScript through the isolated test fixture. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { invitationTimestamp, celebrationExceedsTerm } = createFixture().load('lib/invitation-date.ts');

test('event wall time uses UTC-6 and rejects invalid dates and hours', () => {
  assert.equal(new Date(invitationTimestamp('2027-01-01', '23:30')).toISOString(), '2027-01-02T05:30:00.000Z');
  assert.equal(new Date(invitationTimestamp('2027-01-01')).toISOString(), '2027-01-01T06:00:00.000Z');
  for (const [date, time] of [['2027-02-29','12:00'], ['2027-01-01','24:00'], ['', '12:00']]) assert.ok(Number.isNaN(invitationTimestamp(date, time)));
});
test('warning uses calendar months and the exact expiry including time', () => {
  const now = new Date('2024-02-29T18:00:00Z');
  assert.equal(celebrationExceedsTerm('2025-02-28', '11:59', null, now), false);
  assert.equal(celebrationExceedsTerm('2025-02-28', '12:00', null, now), true);
  assert.equal(celebrationExceedsTerm('2025-03-01', '', null, now), true);
  assert.equal(celebrationExceedsTerm('2025-02-28', '12:00', '2025-03-01T00:00:00Z', now), false);
  assert.equal(celebrationExceedsTerm('', '', null, now), false);
});
