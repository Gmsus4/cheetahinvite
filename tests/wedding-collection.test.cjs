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

test('ten new compositions preserve real invitation content and the two approved designs keep their renderer', () => {
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
    if (['olive', 'love-letter'].includes(design.kind)) {
      assert.match(html, /class="wedding-invitation wedding-identity"/);
      assert.doesNotMatch(html, /class="wedding-collection"/);
      if (design.kind === 'love-letter') assert.match(html, /love-envelope/);
      else assert.match(html, /wedding-olive-butterfly/);
    } else {
      assert.match(html, /class="wedding-collection"/);
      assert.doesNotMatch(html, /identity-chapter-number/);
      if (design.artwork) assert.ok(html.includes(`/plantillas/boda/${design.artwork}/`), `${design.label} uses the supplied template illustrations`);
      assert.doesNotMatch(html, /\/wedding-collection\/art\//);
    }
  }
});

test('new compositions remain complete without a portrait and omit disabled details', () => {
  const load = loadComponents();
  const { WeddingInvitation } = load('components/invitation/WeddingInvitation.tsx');
  const { weddingDesigns } = load('lib/wedding-designs.ts');
  const { weddingExample } = load('lib/wedding-design-examples.ts');
  for (const design of weddingDesigns.filter(d => !['olive', 'love-letter'].includes(d.kind))) {
    const html = renderToStaticMarkup(React.createElement(WeddingInvitation, {
      ...weddingExample, templateId: design.id, accent: design.palettes[0].accent,
      hostNames: 'María Fernanda y José Alejandro', imageUrl: '',
      sections: weddingExample.sections.map(s => s.type === 'gallery' ? { ...s, enabled: false } : s),
    }));
    assert.match(html, /María Fernanda/); assert.match(html, /José Alejandro/);
    assert.doesNotMatch(html, /class="wc-cover-photo/);
    assert.doesNotMatch(html, /Días que se quedan/);
    assert.match(html, /Guardar confirmación/);
  }
});
