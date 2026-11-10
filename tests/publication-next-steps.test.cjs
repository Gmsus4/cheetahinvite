/* eslint-disable @typescript-eslint/no-require-imports -- Verify response routing and private publication copy. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const helpers = createFixture().load('lib/publication-next-steps.ts');
test('confirmation routing respects enabled blocks and legacy external links', () => {
  const section = { type: 'rsvp', enabled: true };
  assert.equal(helpers.publicationResponses(null), 'off');
  assert.equal(helpers.publicationResponses([{ ...section, enabled: false, rsvpMode: 'integrated' }]), 'off');
  assert.equal(helpers.publicationResponses([{ ...section, rsvpMode: 'integrated' }]), 'integrated');
  assert.equal(helpers.publicationResponses([{ ...section, whatsappPhone: '521234567890' }]), 'whatsapp');
  assert.equal(helpers.publicationResponses([{ ...section, link: 'https://wa.me/521234567890' }]), 'whatsapp');
  assert.equal(helpers.publicationResponses([{ ...section, link: 'https://example.com/form' }]), 'external');
});
test('the prepared message includes the canonical URL and never adds a PIN', () => {
  const message = helpers.invitationShareMessage('Nuestra boda', 'https://example.com/event/boda');
  assert.match(message, /Nuestra boda/); assert.match(message, /https:\/\/example.com\/event\/boda/);
  assert.equal(message.includes('PIN'), false);
});
function loadComponent() {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('components/dashboard/PublicationReady.tsx','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require','module','exports',code)(name => {
    if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a',props,children) };
    if (name.endsWith('.css')) return { __esModule: true, default: {} };
    if (name === '@/lib/publication-next-steps') return helpers;
    return require(name);
  },mod,mod.exports);
  return mod.exports.PublicationReady;
}
test('published next steps offer responses only for integrated confirmation and explain private access', () => {
  const Component = loadComponent();
  const base = { eventId:'event',name:'Boda',path:'/event/boda',privateInvitation:true,responses:'integrated' };
  const html = renderToStaticMarkup(React.createElement(Component,base));
  assert.match(html,/Copiar enlace/); assert.match(html,/Enviar por WhatsApp/); assert.match(html,/Ver invitación/);
  assert.match(html,/Recuerda compartir el PIN/); assert.match(html,/\/eventos\/event\/asistencias/);
  for (const responses of ['external','whatsapp','off']) {
    const external = renderToStaticMarkup(React.createElement(Component,{...base,responses,privateInvitation:false}));
    assert.equal(external.includes('/asistencias'),false); assert.equal(external.includes('Recuerda compartir el PIN'),false);
  }
});
