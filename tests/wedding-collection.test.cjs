/* eslint-disable @typescript-eslint/no-require-imports -- Render the real TSX components in Node without a browser or production database. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadComponents(hooks) {
  const cache = new Map();
  function load(file) {
    const full = path.resolve(file);
    if (cache.has(full)) return cache.get(full).exports;
    const mod = { exports: {} }; cache.set(full, mod);
    const output = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    function localRequire(name) {
      if (name === 'react' && hooks) return { ...React, ...hooks };
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
    assert.match(html, /aria-roledescription="carrusel"/);
    if (design.artwork) assert.ok(html.includes(`/plantillas/boda/${design.artwork}/`), `${design.label} uses the supplied template illustrations`);
    assert.doesNotMatch(html, /\/wedding-collection\/art\//);
  }
});

test('wedding carousel cycles, selects indicators, handles keyboard and swipes, and follows photos after reordering', () => {
  const state = [];
  let cursor = 0;
  const touch = { current: null };
  const load = loadComponents({ useId: () => 'photo-test', useRef: () => touch, useState: initial => {
    const slot = cursor++;
    if (!(slot in state)) state[slot] = initial;
    return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next; }];
  } });
  const { WeddingPhotoCarousel } = load('components/invitation/WeddingPhotoCarousel.tsx');
  const images = ['/portrait.webp', '/landscape.webp', '/square.webp', '/portrait.webp'];
  const render = (photos = images) => { cursor = 0; return WeddingPhotoCarousel({ images: photos, title: 'Nuestros momentos' }); };
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    let match = null;
    React.Children.forEach(node.props?.children, child => { match ||= find(child, predicate); });
    return match;
  }
  const control = label => find(render(), node => node.type === 'button' && node.props['aria-label'] === label);
  const current = (tree = render()) => find(tree, node => node.type === 'a').props.href;
  const viewport = () => find(render(), node => node.props?.className === 'wa-carousel-viewport');
  const next = () => control('Fotografía siguiente').props.onClick();
  assert.equal(current(), images[0]);
  next(); assert.equal(current(), images[1]);
  next(); assert.equal(current(), images[2]);
  next(); assert.equal(current(), images[0]);
  control('Fotografía anterior').props.onClick(); assert.equal(current(), images[2]);
  control('Ver fotografía 2').props.onClick(); assert.equal(current(), images[1]);
  assert.equal(current(render([images[2], images[0], images[1]])), images[1]);
  assert.equal(current(render([images[2]])), images[2]);
  let prevented = false;
  render().props.onKeyDown({ key: 'Home', preventDefault: () => { prevented = true; } });
  assert.ok(prevented); assert.equal(current(), images[0]);
  render().props.onKeyDown({ key: 'End', preventDefault() {} }); assert.equal(current(), images[2]);
  render().props.onKeyDown({ key: 'ArrowRight', preventDefault() {} }); assert.equal(current(), images[0]);
  render().props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} }); assert.equal(current(), images[2]);
  function swipe(start, end) {
    viewport().props.onTouchStart({ touches: [{ clientX: start[0], clientY: start[1] }] });
    viewport().props.onTouchEnd({ changedTouches: [{ clientX: end[0], clientY: end[1] }] });
  }
  swipe([200, 100], [80, 110]); assert.equal(current(), images[0]);
  swipe([80, 100], [200, 110]); assert.equal(current(), images[2]);
  swipe([200, 100], [180, 250]); assert.equal(current(), images[2], 'vertical scrolling must not change the photo');
  viewport().props.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });
  viewport().props.onTouchCancel();
  viewport().props.onTouchEnd({ changedTouches: [{ clientX: 80, clientY: 100 }] });
  assert.equal(current(), images[2], 'canceled gestures must not change the photo');
});

test('wedding carousel renders each unique photo, handles one or no photos, and keeps inactive slides out of accessibility navigation', () => {
  const load = loadComponents();
  const { WeddingPhotoCarousel } = load('components/invitation/WeddingPhotoCarousel.tsx');
  const render = images => renderToStaticMarkup(React.createElement(WeddingPhotoCarousel, { images, title: 'Nuestros momentos' }));
  const html = render(['/portrait.webp', '/landscape.webp', '/portrait.webp', '']);
  assert.equal((html.match(/aria-roledescription="diapositiva"/g) || []).length, 2);
  assert.equal((html.match(/aria-hidden="true"><img/g) || []).length, 1);
  assert.match(html, /Ver fotografía 2/);
  assert.match(html, /href="\/portrait.webp"/);
  const single = render(['/single.webp']);
  assert.match(single, /single.webp/);
  assert.doesNotMatch(single, /Fotografía siguiente|Fotografía anterior|Elegir fotografía/);
  assert.equal(render([]), '');
});

test('section photos appear outside their panel in the chosen position, without duplicates or disabled photos', () => {
  const load = loadComponents();
  const { WeddingInvitation } = load('components/invitation/WeddingInvitation.tsx');
  const { weddingExample } = load('lib/wedding-design-examples.ts');
  const section = { id: 'photo-section', type: 'story', title: 'Una historia propia', content: 'Nuestro texto', detail: '', link: '', imageUrl: '/personal-section.webp', imageUrls: ['/personal-section.webp'], enabled: true };
  const render = changes => renderToStaticMarkup(React.createElement(WeddingInvitation, { ...weddingExample, templateId: 'wedding-minimal-v2', accent: '#736048', sections: [{ ...section, ...changes }] }));
  for (const position of ['before', 'after']) {
    const html = render({ imagePosition: position });
    const figure = html.indexOf('<figure class="wa-section-photo"');
    const panel = html.indexOf('<section class="wa-panel wa-section wa-story"');
    assert.ok(figure > 0 && panel > 0);
    assert.equal(figure < panel, position === 'before');
    assert.equal((html.match(/src="\/personal-section.webp"/g) || []).length, 1);
    assert.ok(html.includes(`data-photo-position="${position}"`));
  }
  assert.doesNotMatch(render({ enabled: false, imagePosition: 'before' }), /personal-section.webp|Una historia propia/);
  assert.doesNotMatch(render({ imageUrl: '', imageUrls: [] }), /wa-section-photo/);
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
