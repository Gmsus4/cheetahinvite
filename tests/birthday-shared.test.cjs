/* eslint-disable @typescript-eslint/no-require-imports -- Test actual TSX renderers and interaction handlers. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { loadBirthdayComponent } = require('./helpers/birthday-renderer.cjs');

const designs = ['Confetti','Pastel','Neon','Disco','Dinosaur','Gamer','Cowboy','Elegant','Cinema'];
const section = type => ({ id: type, type, title: `Apartado ${type}`, content: 'Contenido propio', detail: '', link: '',
  imageUrl: '', enabled: true, ...(type === 'gallery' ? { imageUrls: ['https://example.com/a.jpg','https://example.com/b.jpg'] } : {}) });
const props = { templateId: '', accent: '#7450cc', name: 'Cumpleaños', hostNames: 'Alex', date: 'Una fecha especial',
  eventDateKey: '2027-10-30', eventTime: '18:00', venue: '', address: '', message: 'Mensaje propio', imageUrl: '' };

for (const design of designs) {
  test(`${design}: backgrounds alternate after filtering, removing location and reordering`, () => {
    const { [`Birthday${design}Invitation`]: Component } = loadBirthdayComponent(`Birthday${design}Invitation`, createFixture());
    const types = ['story','gallery','music','rsvp','custom'];
    for (const location of [{}, { venue: 'Salón' }, { address: 'Dirección' }]) {
      for (let mask = 0; mask < 2 ** types.length; mask++) {
        const sections = types.map((type,index) => ({ ...section(type), enabled: Boolean(mask & (1 << index)) })).reverse();
        const html = renderToStaticMarkup(React.createElement(Component, { ...props, ...location, sections }));
        const bands = [...html.matchAll(/<section[^>]+data-birthday-band="(base|tinted)"/g)].map(match => match[1]);
        const fixed = ['Disco','Dinosaur'].includes(design) ? 1 : 0;
        assert.equal(bands.length, 2 + fixed + Number(Boolean(location.venue || location.address)) + sections.filter(s => s.enabled).length);
        assert.equal(bands[0], 'base');
        for (let index = 1; index < bands.length; index++) assert.notEqual(bands[index], bands[index - 1], `mask=${mask}, section=${index}`);
        assert.equal((html.match(/class="birthday-photo-grid"/g) || []).length, mask & 2 ? 1 : 0);
      }
    }
    const html = renderToStaticMarkup(React.createElement(Component, { ...props, venue: 'Salón', sections:
      ['story','ceremony','reception','program','parents','dress_code','gifts','gallery','music','rsvp','custom'].map(section) }));
    assert.equal((html.match(/class="birthday-photo-tile"/g) || []).length, 2);
    assert.match(html, /aria-label="Fotos de Apartado gallery"/);
    assert.match(html, /aria-label="Foto anterior"/);
    assert.match(html, /aria-label="Foto siguiente"/);
  });
}

test('Every birthday gallery preserves its palette and photos without decorative artwork', () => {
  const { BirthdayGallery, galleryThemes } = loadBirthdayComponent('BirthdayGallery', createFixture());
  for (const theme of Object.keys(galleryThemes)) {
    const html = renderToStaticMarkup(React.createElement(BirthdayGallery, { theme, title: 'Fotos', images: ['https://example.com/a.jpg'] }));
    assert.equal((html.match(/<img /g) || []).length, 1);
    assert.match(html, /aria-haspopup="dialog"/);
    assert.match(html, /--photo-paper:/);
    assert.doesNotMatch(html, /photo-decoration|\/birthday\//);
    assert.doesNotMatch(html, /class="birthday-photo-expanded"|aria-label="Foto siguiente"/);
  }
});

test('Confetti keeps its cover and gives optional sections distinct supplied animal illustrations', () => {
  const { BirthdayConfettiInvitation } = loadBirthdayComponent('BirthdayConfettiInvitation', createFixture());
  const assignments = { story: 'painter-bear', ceremony: 'cake-duck', reception: 'hot-air-balloon',
    program: 'seal-balloon', parents: 'bear-bird', dress_code: 'party-turtle', gifts: 'dino-gift',
    rsvp: 'penguin-balloons', music: 'party-shark', custom: 'penguin' };
  const render = sections => renderToStaticMarkup(React.createElement(BirthdayConfettiInvitation, { ...props, sections }));
  const html = render([...Object.keys(assignments), 'gallery'].map(section));
  assert.match(html, /birthday-cover-scene[\s\S]*?\/birthday\/confetti\/bear.webp/);
  assert.match(html, /birthday-closing[\s\S]*?\/birthday\/confetti\/bear-balloons.webp/);
  for (const [type, art] of Object.entries(assignments)) {
    const block = html.match(new RegExp(`<section class="birthday-section birthday-section-${type}"[^>]*>([\\s\\S]*?)<\\/section>`))[1];
    assert.ok(block.includes(`/birthday/confetti/${art}.webp`), type);
    assert.ok(fs.existsSync(`public/birthday/confetti/${art}.webp`));
  }
  assert.ok(html.includes('/birthday/confetti/cloud.webp'));
  const gallery = html.match(/<section class="birthday-section birthday-section-gallery"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.doesNotMatch(gallery, /\/birthday\/confetti\//);
  const reduced = render([section('custom'), { ...section('program'), enabled: false }, section('music')]);
  assert.ok(!reduced.includes('/birthday/confetti/seal-balloon.webp'));
  assert.ok(reduced.includes('/birthday/confetti/penguin.webp'));
  assert.ok(reduced.includes('/birthday/confetti/party-shark.webp'));
});

test('Neon distributes the new artwork and keeps textures outside the gallery', () => {
  const { BirthdayNeonInvitation } = loadBirthdayComponent('BirthdayNeonInvitation', createFixture());
  const html = renderToStaticMarkup(React.createElement(BirthdayNeonInvitation, { ...props, venue: 'Salón',
    sections: ['program','story','parents','gallery'].map(section) }));
  const assignments = { program: 'pixel-dinosaur', story: 'butterfly', parents: 'koi' };
  for(const [type,art] of Object.entries(assignments)) {
    const block = html.match(new RegExp(`<section class="neon-section neon-section-${type}"[^>]*>([\\s\\S]*?)<\\/section>`))[1];
    assert.ok(block.includes(`/birthday/neon/${art}.webp`));
  }
  assert.match(html, /neon-location[\s\S]*?\/birthday\/neon\/map-pin.webp/);
  const gallery = html.match(/<section class="neon-section neon-section-gallery"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.doesNotMatch(gallery, /\/birthday\/neon\//);
  for(const asset of ['map-pin','pixel-dinosaur','butterfly','koi','iridescent-space','pexels-postiglioni-421129']) assert.ok(fs.existsSync(`public/birthday/neon/${asset}.webp`));
  assert.ok(fs.readFileSync('app/birthday-neon.css','utf8').includes('/birthday/neon/iridescent-space.webp'));
  assert.ok(fs.readFileSync('app/birthday-shared.css','utf8').includes('/birthday/neon/pexels-postiglioni-421129.webp'));
  for(const name of ['pexels-ian-panelo-8537029','pexels-lucasandrade-13985297','pexels-kathrinepnw-12506704','pexels-ricardo-olvera-225422504-14044350']) {
    assert.ok(fs.existsSync(`public/birthday/neon/${name}.webp`));
    assert.ok(fs.readFileSync('app/birthday-shared.css','utf8').includes(`/birthday/neon/${name}.webp`));
  }
});

test('Shared viewer opens the selected photo, wraps navigation, closes and retains orientation after reordering', () => {
  const state = [];
  let cursor = 0;
  const modal = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
  const { BirthdayGallery } = loadBirthdayComponent('BirthdayGallery', createFixture(), {
    useRef: () => ({ current: modal }),
    useState: initial => {
      const slot = cursor++;
      state[slot] ??= initial;
      return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next; }];
    },
  });
  const images = ['wide.jpg','tall.jpg','square.jpg'];
  const render = (photos = images) => { cursor = 0; return BirthdayGallery({ images: photos, title: 'Fotos', theme: 'pastel' }).props.children; };
  let [grid, dialog] = render();
  [[1600,900],[800,1200],[600,600]].forEach(([naturalWidth,naturalHeight], index) => {
    grid.props.children[index].props.children[0].props.onLoad({ currentTarget: { naturalWidth, naturalHeight } });
  });
  [grid] = render([...images].reverse());
  assert.deepEqual(grid.props.children.map(tile => tile.props['data-orientation']), ['square','vertical','horizontal']);
  [grid] = render();
  grid.props.children[1].props.onClick();
  assert.equal(modal.open, true);
  [,dialog] = render();
  assert.equal(dialog.props.children.props.children[1].props.src, 'tall.jpg');
  const arrow = key => { dialog.props.onKeyDown({ key, preventDefault() {} }); [,dialog] = render(); };
  arrow('ArrowRight'); arrow('ArrowRight');
  assert.equal(dialog.props.children.props.children[1].props.src, 'wide.jpg');
  arrow('ArrowLeft');
  assert.equal(dialog.props.children.props.children[1].props.src, 'square.jpg');
  dialog.props.children.props.children[0].props.onClick();
  assert.equal(modal.open, false);
  dialog.props.onClose();
  [,dialog] = render();
  assert.equal(dialog.props.children.props.children[1], false);
});
