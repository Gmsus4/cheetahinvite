/* eslint-disable @typescript-eslint/no-require-imports -- Load TypeScript through the isolated test fixture. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { invitationTimestamp, celebrationExceedsTerm, invitationToday, invitationDateIssue } = createFixture().load('lib/invitation-date.ts');

test('minimum event date follows midnight in UTC-6 rather than UTC or the browser timezone', () => {
  assert.equal(invitationToday(new Date('2026-11-18T05:59:59Z')), '2026-11-17');
  assert.equal(invitationToday(new Date('2026-11-18T06:00:00Z')), '2026-11-18');
  assert.equal(invitationToday(new Date('2027-01-01T05:59:59Z')), '2026-12-31');
});

test('date validation allows today, future days and empty drafts but rejects past or impossible dates', () => {
  const now = new Date('2026-11-18T05:59:59Z');
  for (const date of ['', '2026-11-17', '2026-11-18', '2028-02-29']) assert.equal(invitationDateIssue(date, now), null);
  for (const date of ['2026-11-16', '2025-12-31', '2027-02-29', '2026-11-31', 'invalid']) assert.equal(typeof invitationDateIssue(date, now), 'string');
  assert.equal(typeof invitationDateIssue('2026-11-17', new Date('2026-11-18T06:00:00Z')), 'string');
});

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
