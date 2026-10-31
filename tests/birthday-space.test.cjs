/* eslint-disable @typescript-eslint/no-require-imports -- Render the actual invitation with optional sections. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function renderer(hooks) {
  const fixture = createFixture();
  const source = ts.transpileModule(fs.readFileSync('components/invitation/BirthdaySpaceInvitation.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exported = {};
  const load = name => {
    if (name === 'react' && hooks) return hooks;
    if (name === 'next/image') return { __esModule: true, default: props => {
      const clean = { ...props };
      delete clean.unoptimized;
      return React.createElement('img', clean);
    } };
    if (name === '@/lib/invitation-links') return fixture.load('lib/invitation-links.ts');
    if (name === './RsvpForm') return { RsvpForm: () => React.createElement('form') };
    if (name === './CountdownTimer') return { CountdownTimer: () => React.createElement('time') };
    return require(name);
  };
  new Function('require', 'exports', source + '\nexports.SpaceGallery = SpaceGallery;')(load, exported);
  if (hooks) return exported.SpaceGallery;
  return props => renderToStaticMarkup(React.createElement(exported.BirthdaySpaceInvitation, {
    name: 'Cumpleaños', accent: '#A89BFF', sections: [], ...props,
  }));
}

test('Space alternates visible backgrounds for every combination of optional sections and location', () => {
  const render = renderer();
  const types = ['story', 'program', 'gallery', 'music', 'custom'];
  for (const venue of ['', 'Estación de juegos']) {
    for (let mask = 0; mask < 2 ** types.length; mask++) {
      const sections = types.map((type, index) => ({
        id: type, type, title: type, content: '', detail: '', link: '', imageUrl: '', enabled: Boolean(mask & (1 << index)),
      }));
      const html = render({ venue, sections });
      const bands = [...html.matchAll(/<section class="([^"]*space-band-(?:tinted|base)[^"]*)"/g)].map(match => match[1]);
      assert.equal(bands.length, 1 + Number(Boolean(venue)) + sections.filter(section => section.enabled).length);
      assert.ok(bands[0].includes('space-band-tinted'));
      for (let index = 1; index < bands.length; index++) {
        assert.notEqual(bands[index].includes('space-band-tinted'), bands[index - 1].includes('space-band-tinted'), `venue=${venue}, mask=${mask}, band=${index}`);
      }
    }
  }
});

test('Space gallery uses natural photo orientation regardless of position or reordering', () => {
  const state = [];
  let cursor = 0;
  const Gallery = renderer({
    useRef: () => ({ current: null }),
    useState: initial => {
      const slot = cursor++;
      state[slot] ??= initial;
      return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next; }];
    },
  });
  const tiles = images => {
    cursor = 0;
    return Gallery({ images, title: 'Fotos' }).props.children[0].props.children;
  };
  const images = ['wide.jpg', 'tall.jpg', 'square.jpg'];
  const initial = tiles(images);
  [[1600,900],[800,1200],[600,600]].forEach(([naturalWidth,naturalHeight], index) => {
    initial[index].props.children[0].props.onLoad({ currentTarget: { naturalWidth, naturalHeight } });
  });
  assert.deepEqual(tiles(images).map(tile => tile.props['data-orientation']), ['horizontal','vertical','square']);
  assert.deepEqual(tiles([...images].reverse()).map(tile => tile.props['data-orientation']), ['square','vertical','horizontal']);
});

test('Space counts an address-only location and preserves alternating sides after reordering', () => {
  const render = renderer();
  const sections = ['custom', 'music', 'story'].map(type => ({ id: type, type, title: type, content: '', detail: '', link: '', imageUrl: '', enabled: true }));
  const html = render({ address: 'Dirección', sections });
  const bands = [...html.matchAll(/<section class="(space-section [^"]*)"/g)].map(match => match[1]);
  assert.equal(bands.length, 3);
  assert.ok(bands[0].includes('space-section-custom'));
  assert.ok(!bands[0].includes('space-section-reversed'));
  assert.ok(bands[1].includes('space-section-reversed'));
  assert.ok(!bands[2].includes('space-section-reversed'));
});

test('Space gallery offers enlargement for each unique photo and an accessible viewer', () => {
  const render = renderer();
  const gallery = { id: 'photos', type: 'gallery', title: 'Recuerdos', content: '', detail: '', link: '', enabled: true,
    imageUrl: 'https://example.com/one.jpg', imageUrls: ['https://example.com/one.jpg', 'https://example.com/two.jpg'] };
  const html = render({ sections: [gallery] });
  assert.equal((html.match(/class="space-gallery-tile"/g) || []).length, 2);
  const galleryContent = html.match(/<section class="space-section space-section-gallery[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.doesNotMatch(galleryContent, /space-gallery-mascot|\/birthday\/space\//);
  assert.match(html, /aria-label="Ampliar foto 1 de Recuerdos"/);
  assert.match(html, /<dialog[^>]*aria-label="Fotos de Recuerdos"/);
  assert.match(html, /aria-label="Cerrar foto"/);
  assert.match(html, /aria-label="Foto anterior"/);
  assert.match(html, /aria-label="Foto siguiente"/);
  const single = render({ sections: [{ ...gallery, imageUrls: [] }] });
  assert.equal((single.match(/class="space-gallery-tile"/g) || []).length, 1);
  assert.doesNotMatch(single, /aria-label="Foto (anterior|siguiente)"/);
  const hidden = render({ sections: [{ ...gallery, enabled: false }] });
  assert.doesNotMatch(hidden, /space-gallery-tile|<dialog/);
});
