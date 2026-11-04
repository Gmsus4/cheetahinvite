/* eslint-disable @typescript-eslint/no-require-imports -- Render the real TSX components in Node without a browser or production database. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadComponents() {
  const cache = new Map();
  function load(file) {
    const full = path.resolve(file);
    if (cache.has(full)) return cache.get(full).exports;
    const mod = { exports: {} }; cache.set(full, mod);
    const output = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    function localRequire(name) {
      if (!name.startsWith('@/') && !name.startsWith('.')) return require(name);
      const base = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(full), name);
      const resolved = ['.tsx', '.ts', '.js'].map(ext => base + ext).find(fs.existsSync);
      assert.ok(resolved, `Resolve ${name}`);
      return load(resolved);
    }
    new Function('require', 'module', 'exports', output)(localRequire, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

test('all twelve alternate wedding designs preserve real invitation content and confirmation', () => {
  const load = loadComponents();
  const { WeddingInvitation } = load('components/invitation/WeddingInvitation.tsx');
  const { weddingDesigns } = load('lib/wedding-designs.ts');
  const { weddingExample } = load('lib/wedding-design-examples.ts');
  for (const design of weddingDesigns) {
    const html = renderToStaticMarkup(React.createElement(WeddingInvitation, {
      ...weddingExample, templateId: design.id, accent: design.palettes[0].accent,
    }));
    assert.equal((html.match(/<article\b/g) || []).length, 1, design.label);
    assert.match(html, /Sofía/); assert.match(html, /Mateo/);
    assert.match(html, /Hacienda Las Nubes/); assert.match(html, /Camino del Jardín/);
    assert.match(html, /12 de octubre de 2027/); assert.match(html, /17:00/);
    assert.match(html, /Confirmar asistencia/); assert.match(html, /Guardar confirmación/);
    assert.match(html, /Nuestra historia/); assert.match(html, /Días que se quedan/);
    assert.match(html, /www\.google\.com\/maps\/search/);
    assert.match(html, /class="wedding-atmosphere"/);
    assert.match(html, /wa-backdrop/);
    assert.match(html, /wa-column/);
    if (design.artwork) assert.ok(html.includes(`/plantillas/boda/${design.artwork}/`), `${design.label} uses the supplied template illustrations`);
    assert.doesNotMatch(html, /\/wedding-collection\/art\//);
  }
});

test('new compositions remain complete without a portrait and omit disabled details', () => {
  const load = loadComponents();
  const { WeddingInvitation } = load('components/invitation/WeddingInvitation.tsx');
  const { weddingDesigns } = load('lib/wedding-designs.ts');
  const { weddingExample } = load('lib/wedding-design-examples.ts');
  for (const design of weddingDesigns) {
    const html = renderToStaticMarkup(React.createElement(WeddingInvitation, {
      ...weddingExample, templateId: design.id, accent: design.palettes[0].accent,
      hostNames: 'María Fernanda y José Alejandro', imageUrl: '',
      sections: weddingExample.sections.map(s => s.type === 'gallery' ? { ...s, enabled: false } : s),
    }));
    assert.match(html, /María Fernanda/); assert.match(html, /José Alejandro/);
    assert.doesNotMatch(html, /class="wa-portrait/);
    assert.doesNotMatch(html, /class="wa-backdrop-photos/);
    assert.doesNotMatch(html, /Días que se quedan/);
    assert.match(html, /Guardar confirmación/);
  }
});

test('every palette uses the alternate renderer while legacy weddings retain their original renderer', () => {
  const load = loadComponents();
  const { WeddingInvitation } = load('components/invitation/WeddingInvitation.tsx');
  const { weddingDesigns, legacyWeddingDesigns } = load('lib/wedding-designs.ts');
  const { weddingExample } = load('lib/wedding-design-examples.ts');
  for (const design of weddingDesigns) for (const palette of design.palettes) {
    const html = renderToStaticMarkup(React.createElement(WeddingInvitation, { ...weddingExample, templateId: design.id, accent: palette.accent }));
    assert.ok(html.includes(`--wa-base:${palette.dark}`), `${design.label}: ${palette.label}`);
    assert.match(html, /Guardar confirmación/);
  }
  for (const design of legacyWeddingDesigns) {
    const html = renderToStaticMarkup(React.createElement(WeddingInvitation, { ...weddingExample, templateId: design.id, accent: design.palettes[0].accent }));
    assert.match(html, /class="wedding-invitation"/);
    assert.doesNotMatch(html, /wedding-atmosphere/);
  }
});

test('disabled photos and empty sections are omitted, optional music and custom details survive, and links stay safe', () => {
  const load = loadComponents();
  const { WeddingInvitation } = load('components/invitation/WeddingInvitation.tsx');
  const { weddingExample } = load('lib/wedding-design-examples.ts');
  const base = { id: 'extra', title: 'Playlist especial', type: 'music', content: 'Nuestra música', detail: '', imageUrl: '', enabled: true, link: 'https://open.spotify.com/playlist/example' };
  const html = renderToStaticMarkup(React.createElement(WeddingInvitation, {
    ...weddingExample, templateId: 'wedding-minimal-v2', accent: '#736048', eventTime: '', sections: [
      ...weddingExample.sections.map(section => section.type === 'gallery' ? { ...section, enabled: false, imageUrls: ['/private-disabled-photo.webp'] } : section),
      base, { ...base, id: 'custom', title: 'Un detalle especial', type: 'custom', link: 'javascript:alert(1)' },
      { ...base, id: 'empty', title: 'Sección vacía', type: 'custom', link: '', content: '' },
    ],
  }));
  assert.doesNotMatch(html, /private-disabled-photo|javascript:|Sección vacía|Invalid Date/);
  assert.match(html, /Escuchar playlist/);
  assert.match(html, /Un detalle especial/);
  assert.match(html, /Guardar confirmación/);
});
