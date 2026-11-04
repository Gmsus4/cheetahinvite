/* eslint-disable @typescript-eslint/no-require-imports -- Render the real preview action with its publication and URL helpers. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

const fixture = createFixture();
const compiled = ts.transpileModule(fs.readFileSync('components/dashboard/InvitationPublicLink.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exported = {};
new Function('require', 'exports', compiled)(name => name.startsWith('@/') ? fixture.load(name.slice(2) + '.ts') : require(name), exported);
const { InvitationPublicLink } = exported;

const publishedEvent = {
  ownerId: 'owner', customSlug: 'nuestra-boda', slug: 'published-token', status: 'PUBLISHED',
  paidAt: new Date(Date.now() - 86400000), expiresAt: new Date(Date.now() + 86400000),
};
const render = (event, dirty = false) => renderToStaticMarkup(React.createElement(InvitationPublicLink, { event, dirty }));

test('preview action never exposes an unpaid, unavailable or expired public link', () => {
  const cases = [
    { status: 'DRAFT', paidAt: null },
    { status: 'PENDING_PAYMENT', paidAt: null },
    { paidAt: null },
    { status: 'SUSPENDED' },
    { status: 'REFUNDED' },
    { status: 'ARCHIVED' },
    { status: 'EXPIRED' },
    { expiresAt: new Date(Date.now() - 1000) },
    { expiresAt: null },
    { slug: null },
  ];
  for (const changes of cases) {
    const html = render({ ...publishedEvent, ...changes });
    assert.match(html, /<button[^>]*disabled/);
    assert.doesNotMatch(html, /\bhref=/);
  }
  assert.match(render({ ...publishedEvent, paidAt: null }), /confirmar el pago/);
});

test('confirmed publication opens the canonical saved URL in a new tab', () => {
  const custom = render(publishedEvent);
  assert.match(custom, /href="\/invitacion\/owner\/nuestra-boda"/);
  assert.match(custom, /target="_blank"/);
  assert.match(custom, /rel="noopener noreferrer"/);
  assert.match(render({ ...publishedEvent, customSlug: null }), /href="\/invitacion\/published-token"/);
});

test('pending edits explain that the public link uses the last saved version', () => {
  const html = render(publishedEvent, true);
  assert.match(html, /href="\/invitacion\/owner\/nuestra-boda"/);
  assert.match(html, /última versión guardada/);
});
