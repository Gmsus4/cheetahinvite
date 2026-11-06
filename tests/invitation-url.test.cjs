/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner loads the TypeScript URL helpers. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { normalizeInvitationSlug, isValidInvitationSlug, invitationPath } = require('../lib/invitation-url.ts');

test('normalizes accented names, whitespace and punctuation', () => {
  assert.equal(normalizeInvitationSlug('  Camila y Andrés!  '), 'camila-y-andres');
  assert.equal(normalizeInvitationSlug('Nuestra Boda / 2026'), 'nuestra-boda-2026');
});

test('rejects malformed, traversal and oversized path segments', () => {
  for (const value of ['', 'a', '../boda', 'camila/andres', '-boda', 'boda-', 'boda--2026', 'a'.repeat(81)]) assert.equal(isValidInvitationSlug(value), false);
  for (const value of ['mi-boda', 'boda-2026', 'a'.repeat(80)]) assert.equal(isValidInvitationSlug(value), true);
});

test('custom names and fallback slugs use the public event route', () => {
  assert.equal(invitationPath({ ownerId: 'user-1', customSlug: 'mi-boda', slug: 'legacy' }), '/event/mi-boda');
  assert.equal(invitationPath({ ownerId: 'user-2', customSlug: 'mi-boda', slug: 'legacy' }), '/event/mi-boda');
  assert.equal(invitationPath({ ownerId: 'user-1', customSlug: null, slug: 'legacy' }), '/event/legacy');
  assert.equal(invitationPath({ ownerId: 'user-1', customSlug: null, slug: null }), null);
});
