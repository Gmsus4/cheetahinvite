/* eslint-disable @typescript-eslint/no-require-imports -- Load TypeScript through the isolated fixture. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { invitationCalendarUrl } = createFixture().load('lib/invitation-calendar.ts');
const event = { date: '2027-01-01', time: '23:30', name: 'Cumpleaños de Sofía & Leo + amigos', venue: 'Jardín #2', address: 'Calle 1, México' };

test('calendar preserves event data and matches the countdown time across date boundaries', () => {
  const url = new URL(invitationCalendarUrl(event));
  assert.equal(url.origin, 'https://calendar.google.com');
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('text'), event.name);
  assert.equal(url.searchParams.get('location'), `${event.venue}, ${event.address}`);
  assert.equal(url.searchParams.get('dates'), '20270102T053000Z/20270102T053000Z');
  const changed = new URL(invitationCalendarUrl({ ...event, name: 'Otro evento', time: '12:00', venue: 'Salón' }));
  assert.equal(changed.searchParams.get('text'), 'Otro evento');
  assert.equal(changed.searchParams.get('dates'), '20270101T180000Z/20270101T180000Z');
  assert.equal(changed.searchParams.get('location'), `Salón, ${event.address}`);
});

test('untimed dates create an all-day event and invalid dates never produce a calendar link', () => {
  const url = new URL(invitationCalendarUrl({ ...event, date: '2028-02-29', time: '', venue: '', address: '' }));
  assert.equal(url.searchParams.get('dates'), '20280229/20280301');
  assert.equal(url.searchParams.get('location'), '');
  for (const changes of [{ date: '' }, { date: '2027-02-29' }, { time: '24:00' }]) assert.equal(invitationCalendarUrl({ ...event, ...changes }), null);
});

test('calendar prefers the first complete timed itinerary activity, including legacy AM/PM', () => {
  const dates = content => new URL(invitationCalendarUrl({ ...event, sections: [{ type: 'program', enabled: true, content }] })).searchParams.get('dates');
  assert.equal(dates('Bienvenida\n17:00 — Llegada\n19:00 — Cena'), '20270101T230000Z/20270102T010000Z');
  assert.equal(dates('11:30 p. m. — Fiesta\n00:30 — Pastel'), '20270102T053000Z/20270102T063000Z');
  assert.equal(dates('16:00 — \n18:00 — Recepción'), '20270102T000000Z/20270102T000000Z');
});

test('calendar ends at the last timed activity after midnight, including year boundaries', () => {
  const sections = [{ type: 'program', enabled: true, content: '22:00 — Llegada\n00:30 — Pastel\n02:00 — Despedida\nGracias por venir' }];
  const url = new URL(invitationCalendarUrl({ ...event, date: '2027-12-31', sections }));
  assert.equal(url.searchParams.get('dates'), '20280101T040000Z/20280101T080000Z');
  sections[0].content = '18:00 — Llegada\n20:00 — Cena\n23:00 — ';
  assert.equal(new URL(invitationCalendarUrl({ ...event, sections })).searchParams.get('dates'), '20270102T000000Z/20270102T020000Z');
});

test('empty, untimed, invalid or disabled itinerary falls back to the initial event time', () => {
  const original = new URL(invitationCalendarUrl(event)).searchParams.get('dates');
  for (const content of ['', 'Bienvenida\nCena', '99:00 — Llegada', '15:00 — ']) {
    const url = new URL(invitationCalendarUrl({ ...event, sections: [{ type: 'program', enabled: true, content }] }));
    assert.equal(url.searchParams.get('dates'), original);
  }
  const url = new URL(invitationCalendarUrl({ ...event, sections: [{ type: 'program', enabled: false, content: '15:00 — Llegada' }] }));
  assert.equal(url.searchParams.get('dates'), original);
});
