/* eslint-disable @typescript-eslint/no-require-imports -- Load TypeScript helpers with Node's test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText.replaceAll('@/lib/invitation-url', './invitation-url'), filename);
const { invitationMetadata } = require('../lib/invitation-metadata.ts');
const event = {
  ownerId: 'owner', slug: 'legacy', customSlug: null, name: 'Nuestra boda',
  message: '  Ven a celebrar\ncon nosotros.  ', eventDate: new Date('2026-12-20T00:00:00Z'),
  venue: 'El jardín', imageUrl: 'https://images.example/cover.jpg',
};

test('shares the cover and event message across Open Graph and Twitter', () => {
  const metadata = invitationMetadata(event, 'https://invite.example');
  assert.equal(metadata.openGraph.title, 'Nuestra boda | Cheetah Invite');
  assert.equal(metadata.description, 'Ven a celebrar con nosotros.');
  assert.equal(metadata.openGraph.images[0].url, event.imageUrl);
  assert.equal(metadata.twitter.images[0].url, event.imageUrl);
  assert.equal(metadata.twitter.card, 'summary_large_image');
  assert.equal(metadata.openGraph.url, 'https://invite.example/event/legacy');
});

test('uses the canonical custom link and resolves relative image URLs', () => {
  const metadata = invitationMetadata({ ...event, customSlug: 'nuestra-boda', imageUrl: '/cover.jpg' }, 'https://invite.example');
  assert.equal(metadata.alternates.canonical, 'https://invite.example/event/nuestra-boda');
  assert.equal(metadata.openGraph.images[0].url, 'https://invite.example/cover.jpg');
});

test('falls back to date, venue and brand image for incomplete content', () => {
  const metadata = invitationMetadata({ ...event, message: ' ', imageUrl: null }, 'https://invite.example');
  assert.match(metadata.description, /20 de diciembre de 2026/);
  assert.match(metadata.description, /El jardín/);
  assert.equal(metadata.openGraph.images[0].url, 'https://invite.example/Logo.webp');
  const minimal = invitationMetadata({ ...event, message: null, eventDate: null, venue: null }, 'https://invite.example');
  assert.equal(minimal.description, 'Estás invitado a celebrar un momento especial.');
});
