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
      if (name.endsWith('.css')) return {};
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

test('editor location placeholders are available before typing and stay out of public and hero invitations', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const values = { name: 'Mi invitación', hostNames: 'Alex', date: '', venue: '', address: '', message: '', imageUrl: '', sections: [], accent: '#58664E' };
  const render = options => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...values, ...options }));
  const editor = render({ preview: true, showPlaceholders: true });
  assert.match(editor, /data-invitation-field="w-venue">Nos vemos aquí/);
  assert.match(editor, /data-invitation-field="w-address">Dirección por definir/);
  assert.doesNotMatch(editor, /Cómo llegar/);
  for (const options of [{}, { preview: true }]) assert.doesNotMatch(render(options), /wa-location|Dirección por definir/);
});

test('primary location respects its own selection alongside the optional ceremony', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const base = { id: 'main', type: 'location', title: 'Nos vemos aquí', content: '', detail: '', link: '', imageUrl: '', enabled: true, panelStyle: 'glass' };
  const values = { name: 'Celebración', hostNames: 'Alex', date: '', venue: 'Jardín principal', address: 'Calle principal', message: '', imageUrl: '', accent: '#58664E' };
  const render = sections => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...values, sections, onEdit() {} }));
  const visible = render([base]);
  const exactLocation = render([{ ...base, link: 'https://maps.app.goo.gl/ExactPin' }]);
  assert.match(exactLocation, /href="https:\/\/maps.app.goo.gl\/ExactPin"/);
  assert.match(exactLocation, /data-invitation-field="w-address">Calle principal/);
  assert.doesNotMatch(exactLocation, /<p[^>]*>https:\/\/maps/);
  assert.match(visible, /wa-location[^>]*data-surface="glass"/);
  assert.match(visible, /id="invitation-location-title"[^>]*>Nos vemos aquí/);
  assert.match(visible, /data-invitation-field="section:main"/);
  assert.match(visible, /Editar estilo del lugar principal/);
  const customTitle = render([{ ...base, title: 'La celebración', titleCustomized: true }]);
  assert.match(customTitle, /id="invitation-location-title"[^>]*>La celebración/);
  assert.match(render([{ ...base, title: 'La celebración' }]), /id="invitation-location-title"[^>]*>Lugar del evento/);
  assert.equal((visible.match(/https:\/\/www.google.com\/maps/g) || []).length, 1);
  assert.doesNotMatch(render([{ ...base, enabled: false }]), /wa-location|Jardín principal/);
  for (const types of [['ceremony']]) {
    const sections = types.map(type => ({ ...base, id: type, type, title: type, content: 'Otra sede', link: `Calle ${type}` }));
    const html = render([base, ...sections]);
    assert.match(html, /wa-location/);
    assert.match(render(sections), /wa-location/);
    assert.doesNotMatch(render([{ ...base, enabled: false }, ...sections]), /wa-location|Jardín principal/);
    assert.equal((html.match(/https:\/\/www.google.com\/maps/g) || []).length, types.length + 1);
    assert.match(render([base, ...sections.map(section => ({ ...section, enabled: false }))]), /wa-location/);
  }
});

test('cover compositions preserve one photo, names, countdown visibility and public layout settings', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const { PublicInvitationContent } = load('components/invitation/PublicInvitationContent.tsx');
  const base = { name: 'Nuestra celebración', hostNames: 'Alejandra Martínez y Santiago García', date: '20 de noviembre', eventDateKey: '2027-11-20', venue: '', address: '', message: '', accent: '#58664E', imageUrl: '/cover.webp', sections: [] };
  for (const coverLayout of ['split', 'split-reverse', 'stacked', 'overlay']) {
    for (const countdown of [true, false]) {
      const sections = [{ id: 'countdown', type: 'countdown', title: 'Cuenta regresiva', content: '', detail: '', link: '', imageUrl: '', enabled: countdown }];
      const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...base, coverLayout, sections }));
      assert.ok(html.includes('data-cover-layout="' + coverLayout + '"'));
      assert.equal((html.match(/src="\/cover.webp"/g) || []).length, 1);
      assert.match(html, /aria-label="Alejandra Martínez y Santiago García"/);
      assert.equal(html.includes('class="wa-panel wa-countdown"'), countdown);
    }
    const publicHtml = renderToStaticMarkup(React.createElement(PublicInvitationContent, { event: { ...base, coverLayout, eventDate: new Date('2027-11-20T12:00:00Z') } }));
    assert.ok(publicHtml.includes('data-cover-layout="' + coverLayout + '"'));
  }
  const render = changes => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...base, ...changes }));
  assert.match(render({ coverLayout: 'overlay', imageUrl: '' }), /data-cover-layout="stacked"/);
  assert.match(render({}), /data-cover-layout="split"/);
  assert.match(render({ coverLayout: 'invalid' }), /data-cover-layout="split"/);
});

test('cover layout picker exposes four compositions and invokes the selected option', () => {
  const { InvitationCoverLayoutPicker } = loadComponents()('components/dashboard/InvitationCoverLayoutPicker.tsx');
  const render = props => renderToStaticMarkup(React.createElement(InvitationCoverLayoutPicker, { onChange() {}, ...props }));
  const html = render({ value: 'stacked', imageUrl: '/cover.webp' });
  assert.equal((html.match(/aria-pressed=/g) || []).length, 4);
  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
  for (const label of ['Foto a la derecha', 'Foto a la izquierda', 'Portada centrada', 'Texto sobre la foto']) assert.ok(html.includes(label));
  assert.match(render({ value: 'overlay' }), /Agrega una foto de portada/);
  assert.doesNotMatch(render({ value: 'overlay', imageUrl: '/cover.webp' }), /Agrega una foto de portada/);
  let selected;
  const picker = InvitationCoverLayoutPicker({ onChange: value => { selected = value; } });
  const buttons = picker.props.children.find(child => child?.props?.role === 'group').props.children;
  buttons[1].props.onClick();
  assert.equal(selected, 'split-reverse');
});

test('cover finish is independent and venue photos belong to the second block', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const section = { content: '', detail: '', link: '', imageUrl: '', enabled: true };
  const values = { name: 'Nuestra invitación', hostNames: 'Alex y Sam', date: '15 de enero', eventDateKey: '2027-01-15', venue: 'El jardín', address: 'La dirección', message: 'Bienvenidos', imageUrl: '/cover.webp', accent: '#58664E', panelStyle: 'auto', sections: [
    { ...section, id: 'cover', type: 'cover', title: 'Portada', panelStyle: 'glass' },
    { ...section, id: 'countdown', type: 'countdown', title: 'Cuenta regresiva', panelStyle: 'blur-color' },
    { ...section, id: 'venue', type: 'location', title: 'Lugar del evento', panelStyle: 'color', imageUrl: '/venue.webp' },
  ] };
  const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, values));
  assert.match(html, /data-cover-style="glass"/);
  assert.match(html, /class="wa-intro"[^>]*data-surface="glass"/);
  assert.match(html, /wa-countdown[^>]*data-surface="blur-color"/);
  assert.match(html, /<\/header>\s*<section class="wa-panel wa-countdown"/);
  assert.ok(html.indexOf('class="wa-panel wa-countdown"') < html.indexOf('data-section-type="location"'));
  const disabledCountdown = renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...values, sections: values.sections.map(section => section.type === 'countdown' ? { ...section, enabled: false } : section) }));
  assert.doesNotMatch(disabledCountdown, /class="wa-panel wa-countdown"/);
  assert.match(html, /wa-location[^>]*data-surface="color"/);
  const venue = html.slice(html.indexOf('data-section-type="location"'), html.indexOf('class="wa-footer"'));
  assert.match(venue, /El jardín/);
  assert.match(venue, /src="\/venue.webp"/);
  assert.doesNotMatch(venue, /src="\/cover.webp"/);
  assert.equal((html.match(/data-section-type="location"/g) || []).length, 1);
  const editable = renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...values, onEdit() {} }));
  assert.match(editable, /aria-label="Acciones de la portada"/);
  assert.match(editable, /aria-label="Editar estilo de portada"/);
  assert.match(editable, /aria-label="Editar estilo de la cuenta regresiva"/);
});

test('event location and ceremony are the only location blocks even in legacy invitations', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const base={content:'Sede',detail:'17:00',link:'Calle principal',imageUrl:'',enabled:true};
  const html=renderToStaticMarkup(React.createElement(CelebrationInvitation, { name:'Boda',hostNames:'Alex y Sam',date:'',venue:'Jardín',address:'Calle del Jardín',message:'',imageUrl:'',accent:'#58664E',sections:[
    {...base,id:'location',type:'location',title:'Lugar del evento'},
    {...base,id:'ceremony',type:'ceremony',title:'Ceremonia'},
    {...base,id:'reception',type:'reception',title:'Celebración en otra sede'},
  ] }));
  assert.equal((html.match(/https:\/\/www.google.com\/maps/g)||[]).length,2);
  assert.match(html,/data-section-type="location"/);
  assert.match(html,/data-section-type="ceremony"/);
  assert.doesNotMatch(html,/data-section-type="reception"|Celebración en otra sede/);
});

test('editor targets distinguish invitation name, hosts and individual detail fields', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, {
    name: 'Nuestra celebración', hostNames: 'Alex y Sam', date: '', venue: '', address: '', message: 'Bienvenidos', imageUrl: '', accent: '#58664E',
    sections: [{ id: 'ceremony', type: 'ceremony', title: 'Ceremonia', content: 'El jardín', detail: '17:00', link: 'Calle principal', imageUrl: '', enabled: true },
      { id: 'hidden', type: 'custom', title: 'Oculto', content: 'Texto', detail: '', link: '', imageUrl: '', enabled: false }],
  }));
  assert.match(html, /data-invitation-field="w-name">Nuestra celebración/);
  assert.match(html, /<h1 aria-label="Alex y Sam" data-invitation-field="w-hosts">/);
  assert.doesNotMatch(html, /wa-welcome|data-invitation-field="w-message"/);
  assert.match(html, /data-invitation-field="ceremony-title">Ceremonia/);
  assert.match(html, /data-invitation-field="ceremony-content">El jardín/);
  assert.match(html, /data-invitation-field="ceremony-time">17:00/);
  assert.match(html, /data-invitation-field="ceremony-link ceremony-map ceremony-mode"/);
  assert.doesNotMatch(html, /section:hidden|data-preview-active/);
});

test('contextual edit controls require an owner callback and cover visible sections and their photos', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const values = {
    eventType: 'wedding', name: 'La celebración', hostNames: 'Alex y Sam', date: '15 de enero', eventDateKey: '2027-01-15',
    venue: 'El jardín', address: 'La dirección', message: 'Bienvenidos', imageUrl: '/cover.webp', accent: '#58664E',
    sections: [
      { id: 'story', type: 'story', title: 'Nuestra historia', content: 'Así empezó', detail: '', link: '', imageUrl: '/story.webp', enabled: true },
      { id: 'gallery', type: 'gallery', title: 'Recuerdos', content: '', detail: '', link: '', imageUrl: '', imageUrls: ['/gallery.webp'], enabled: true },
      { id: 'hidden', type: 'custom', title: 'Oculto', content: 'Texto', detail: '', link: '', imageUrl: '', enabled: false },
    ],
  };
  const render = options => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...values, ...options }));
  for (const options of [{}, { preview: true }]) assert.doesNotMatch(render(options), /wa-edit-button|data-editable|aria-haspopup="dialog"/);
  const editable = render({ onEdit() {} });
  for (const label of ['portada', 'foto de portada', 'fecha y hora', 'lugar', 'Nuestra historia', 'foto de Nuestra historia', 'Recuerdos', 'fotos de Recuerdos']) {
    assert.ok(editable.includes(`aria-label="Editar ${label}"`), label);
  }
  assert.doesNotMatch(editable, /Editar Oculto/);
  const withoutCover = render({ imageUrl: '', onEdit() {} });
  assert.match(withoutCover, /class="wa-no-photo" data-editable="true"/);
  assert.doesNotMatch(withoutCover, /class="wa-no-photo" aria-hidden="true"/);
});

test('shared gallery fields edit the heading and preserve legacy photos until explicitly changed', () => {
  const { SectionFields } = loadComponents()('components/dashboard/InvitationSectionFields.tsx');
  const html = renderToStaticMarkup(React.createElement(SectionFields, {
    section: { id: 'gallery', type: 'gallery', title: 'Recuerdos', content: '', detail: '', link: '', imageUrl: '/legacy.webp', enabled: true },
    onChange() {}, uploadProps: { eventId: 'event', onBusyChange() {} }, allowSectionPhoto: true,
  }));
  assert.match(html, /Título de la sección/);
  assert.match(html, /value="Recuerdos"/);
  assert.match(html, /src="\/legacy.webp"/);
});

test('owner preview offers photo uploads for every active detail, including an empty gallery', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const types = ['story', 'ceremony', 'program', 'parents', 'dress_code', 'gifts', 'gallery', 'rsvp', 'music', 'custom'];
  const values = {
    eventType: 'wedding', name: 'Nuestra celebración', hostNames: 'Alex y Sam', date: '', venue: '', address: '', message: '', imageUrl: '', accent: '#58664E',
    sections: types.map(type => ({ id: type, type, title: `Detalle ${type}`, content: type === 'gallery' ? '' : 'Nuestro contenido', detail: '', link: '', imageUrl: '', enabled: true })),
  };
  const render = options => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...values, ...options }));
  const editable = render({ onEdit() {} });
  for (const type of types) assert.ok(editable.includes(`aria-label="Agregar foto${type === 'gallery' ? 's' : ''} a Detalle ${type}"`), type);
  assert.match(editable, /data-invitation-field="section:gallery"/);
  assert.doesNotMatch(render({}), /Agregar foto|section:gallery|Agrega contenido|Agrega fotos/);
  assert.doesNotMatch(render({ preview: true }), /Agregar foto|section:gallery|Agrega contenido|Agrega fotos/);
  assert.doesNotMatch(render({ onEdit() {}, sections: values.sections.map(section => ({ ...section, enabled: false })) }), /Agregar foto a Detalle|Agregar fotos a Detalle/);
});

test('shared section photo fields add, replace and remove photos with the same controls in both editors', () => {
  const { SectionPhotoFields } = loadComponents()('components/dashboard/InvitationSectionFields.tsx');
  const section = { id: 'story', type: 'story', title: 'Historia', content: 'Texto', detail: '', link: '', imageUrl: '', enabled: true };
  let changes;
  const uploadProps = { eventId: 'event', onBusyChange() {} };
  const render = current => SectionPhotoFields({ section: current, uploadProps, onChange: next => { changes = next; } });
  function findUpload(node) {
    if (!node || typeof node !== 'object') return undefined;
    if (node.type?.name === 'CloudinaryImageUpload') return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const result = findUpload(child);
      if (result) return result;
    }
  }
  const empty = findUpload(render(section));
  assert.equal(empty.props.eventId, 'event');
  assert.equal(empty.props.multiple, false);
  assert.deepEqual(empty.props.images, []);
  empty.props.onChange(['/first.webp']);
  assert.deepEqual(changes, { imageUrl: '/first.webp', imagePosition: 'after' });
  const existing = { ...section, imageUrl: '/first.webp', imageUrls: ['/first.webp', '/extra.webp'], imagePosition: 'before' };
  const upload = findUpload(render(existing));
  upload.props.onChange(['/replacement.webp']);
  assert.deepEqual(changes, { imageUrl: '/replacement.webp', imageUrls: ['/replacement.webp', '/extra.webp'], imagePosition: 'before' });
  upload.props.onChange([]);
  assert.deepEqual(changes, { imageUrl: '', imageUrls: ['/extra.webp'], imagePosition: 'before' });
  const html = renderToStaticMarkup(React.createElement(SectionPhotoFields, { section: existing, uploadProps, onChange() {} }));
  assert.match(html, /Antes de esta sección/);
  assert.match(html, /Después de esta sección/);
  const gallery = findUpload(render({ ...section, type: 'gallery', imageUrl: '/legacy.webp' }));
  assert.equal(gallery.props.multiple, true);
  assert.deepEqual(gallery.props.images, ['/legacy.webp']);
  gallery.props.onChange(['/legacy.webp', '/new.webp']);
  assert.deepEqual(changes, { imageUrl: '/legacy.webp', imageUrls: ['/legacy.webp', '/new.webp'] });
});

test('every occasion uses the same texture-free presentation with its own default copy', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const { sharedInvitationDesign } = load('lib/shared-invitation.ts');
  const { invitationEventTypes, getInvitationEventContent, invitationPresentation } = load('lib/invitation-event-content.ts');
  for(const eventType of invitationEventTypes) {
    const content = getInvitationEventContent(eventType), copy = invitationPresentation(eventType);
    const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, {
      eventType,templateId:'celebration-v1',accent:sharedInvitationDesign.palettes[0].accent,
      name:content.defaultName,hostNames:'Alex',date:'',venue:'',address:'',message:'',imageUrl:'',sections:[],
    }));
    assert.match(html,/class="celebration-invitation"/);
    assert.ok(html.includes(`data-event-type="${eventType}"`));
    assert.ok(html.includes(content.defaultName));assert.ok(html.includes(copy.caption));assert.ok(html.includes(copy.closingMessage));
    assert.doesNotMatch(html,/wa-backdrop-texture|--wa-texture|\/textures\/|\/birthday\/|\/plantillas\//);
    if(eventType !== 'wedding') assert.doesNotMatch(html,/Nuestra boda|La pareja:|nuestro siempre/);
  }
});

test('retired birthday identities show the shared layout and preserve customer content and photos',()=>{
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, {
    eventType:'birthday',templateId:'birthday-neon-v1',accent:'#F46BDE',name:'Mi fiesta',hostNames:'Alex',
    date:'Mi fecha',venue:'Mi lugar',address:'Mi dirección',message:'Mis palabras',imageUrl:'/my-cover.webp',backgroundImageUrl:'/my-background.webp',
    sections:[{id:'own',type:'custom',title:'Mi apartado',content:'Mi información',detail:'',link:'',imageUrl:'/my-section.webp',enabled:true}],
  }));
  for(const text of ['Mi fiesta','Alex','Mi lugar','Mi dirección','Mi apartado','Mi información','/my-cover.webp','/my-background.webp','/my-section.webp'])assert.ok(html.includes(text),text);
  assert.doesNotMatch(html,/birthday-neon|\/birthday\/|textures|Astronauta|Nuestra boda/);
});

test('background is one independent photo and never uses the cover or gallery as a collage', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const weddingExample = { ...load('lib/landing-invitation-example.ts').landingEventExamples[0].invitation, date: '12 de octubre de 2027' };
  const render = backgroundImageUrl => renderToStaticMarkup(React.createElement(CelebrationInvitation,{...weddingExample,templateId:'wedding-minimal-v2',accent:'#736048',backgroundImageUrl}));
  const html = render('/independent-background.webp');
  const backdrop = html.slice(html.indexOf('class="wa-backdrop"'),html.indexOf('class="wa-column"'));
  assert.equal((backdrop.match(/<img\b/g)||[]).length,1);
  assert.match(backdrop,/independent-background.webp/);
  assert.doesNotMatch(backdrop,/sofia-mateo|ramo.webp|wa-backdrop-photos/);
  assert.doesNotMatch(render(''),/wa-backdrop-image/);
  assert.match(render(''),/wa-portrait/);
});

test('section surfaces alternate over visible panels and allow explicit overrides', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const weddingExample = { ...load('lib/landing-invitation-example.ts').landingEventExamples[0].invitation, date: '12 de octubre de 2027' };
  const base = { id: 'story', type: 'story', title: 'Historia', content: 'Texto', detail: '', link: '', imageUrl: '', enabled: true };
  const render = sections => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...weddingExample, templateId: 'wedding-minimal-v2', accent: '#736048', sections }));
  const html = render([base, { ...base, id: 'hidden', enabled: false }, { ...base, id: 'two' }, { ...base, id: 'three' }]);
  assert.deepEqual([...html.matchAll(/data-surface="([^"]+)"/g)].map(match => match[1]), ['blur','blur-color','color','blur','blur-color','color']);
  for (const panelStyle of ['blur','blur-color','color','glass','none']) {
    assert.ok(render([{ ...base, panelStyle }]).includes(`wa-story" data-surface="${panelStyle}"`));
  }
});

test('photo carousel cycles, selects indicators, handles keyboard and swipes, and follows photos after reordering', () => {
  const state = [];
  let cursor = 0;
  const touch = { current: null };
  const load = loadComponents({ useId: () => 'photo-test', useRef: () => touch, useState: initial => {
    const slot = cursor++;
    if (!(slot in state)) state[slot] = initial;
    return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next; }];
  } });
  const { InvitationPhotoCarousel } = load('components/invitation/InvitationPhotoCarousel.tsx');
  const images = ['/portrait.webp', '/landscape.webp', '/square.webp', '/portrait.webp'];
  const render = (photos = images) => { cursor = 0; return InvitationPhotoCarousel({ images: photos, title: 'Nuestros momentos' }); };
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    let match = null;
    React.Children.forEach(node.props?.children, child => { match ||= find(child, predicate); });
    return match;
  }
  const control = label => find(render(), node => node.type === 'button' && node.props['aria-label'] === label);
  const current = (tree = render()) => find(tree, node => node.type === 'figure' && node.props['aria-hidden'] === false).props.children.props.src;
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

test('photo carousel renders each unique photo, handles one or no photos, and keeps inactive slides out of accessibility navigation', () => {
  const load = loadComponents();
  const { InvitationPhotoCarousel } = load('components/invitation/InvitationPhotoCarousel.tsx');
  const render = images => renderToStaticMarkup(React.createElement(InvitationPhotoCarousel, { images, title: 'Nuestros momentos' }));
  const html = render(['/portrait.webp', '/landscape.webp', '/portrait.webp', '']);
  assert.equal((html.match(/aria-roledescription="diapositiva"/g) || []).length, 2);
  assert.equal((html.match(/aria-hidden="true"><img/g) || []).length, 1);
  assert.match(html, /Ver fotografía 2/);
  assert.doesNotMatch(html, /<a\b|wa-carousel-expand/);
  const single = render(['/single.webp']);
  assert.match(single, /single.webp/);
  assert.doesNotMatch(single, /Fotografía siguiente|Fotografía anterior|Elegir fotografía/);
  assert.equal(render([]), '');
});

test('section photos appear outside their panel in the chosen position, without duplicates or disabled photos', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const weddingExample = { ...load('lib/landing-invitation-example.ts').landingEventExamples[0].invitation, date: '12 de octubre de 2027' };
  const section = { id: 'photo-section', type: 'story', title: 'Una historia propia', content: 'Nuestro texto', detail: '', link: '', imageUrl: '/personal-section.webp', imageUrls: ['/personal-section.webp'], enabled: true };
  const render = changes => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...weddingExample, templateId: 'wedding-minimal-v2', accent: '#736048', sections: [{ ...section, ...changes }] }));
  for (const position of ['before', 'after']) {
    const html = render({ imagePosition: position });
    const figure = html.indexOf('<figure class="wa-section-photo"');
    const panel = html.indexOf('<section class="wa-panel wa-section wa-story"');
    assert.ok(figure > 0 && panel > 0);
    assert.equal(figure < panel, position === 'before');
    assert.equal((html.match(/src="\/personal-section.webp"/g) || []).length, 1);
    assert.doesNotMatch(html, /href="\/personal-section.webp"/);
    assert.ok(html.includes(`data-photo-position="${position}"`));
  }
  assert.doesNotMatch(render({ enabled: false, imagePosition: 'before' }), /personal-section.webp|Una historia propia/);
  assert.doesNotMatch(render({ imageUrl: '', imageUrls: [] }), /wa-section-photo/);
});

test('the shared presentation remains complete without a portrait and omit disabled details', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const { sharedInvitationDesign } = load('lib/shared-invitation.ts');
  const weddingExample = { ...load('lib/landing-invitation-example.ts').landingEventExamples[0].invitation, date: '12 de octubre de 2027' };
  for (const design of [sharedInvitationDesign]) {
    const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, {
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

test('disabled photos and empty sections are omitted, optional music and custom details survive, and links stay safe', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const weddingExample = { ...load('lib/landing-invitation-example.ts').landingEventExamples[0].invitation, date: '12 de octubre de 2027' };
  const base = { id: 'extra', title: 'Playlist especial', type: 'music', content: 'Nuestra música', detail: '', imageUrl: '', enabled: true, link: 'https://open.spotify.com/playlist/example' };
  const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, {
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

test('shared invitation rendering applies independent heading and body font choices',()=>{
 const load=loadComponents();const {CelebrationInvitation}=load('components/invitation/CelebrationInvitation.tsx');
 const html=renderToStaticMarkup(React.createElement(CelebrationInvitation,{
  eventType:'birthday',templateId:'celebration-v1',accent:'#58664e',typography:'fredoka',bodyTypography:'nunito',
  name:'Mi cumpleaños',hostNames:'Alex',date:'',venue:'',address:'',message:'Mi mensaje',imageUrl:'',sections:[],
 }));
 assert.ok(html.includes("--wa-heading:&#x27;Fredoka Variable&#x27;"));
 assert.ok(html.includes("--wa-body:&#x27;Nunito Variable&#x27;"));
});

test('catalog displays six occasions and the hero selects their single example without variant arrows', () => {
  const examples = loadComponents()('lib/landing-invitation-example.ts').landingEventExamples.map(({ slug, label, typeLabel, invitation }) => ({ slug, label, typeLabel, eventType: invitation.eventType, available: true }));
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    let found = null;
    React.Children.forEach(node.props?.children, child => { found ||= find(child, predicate); });
    return found;
  }
  const Catalog = loadComponents()('components/landing/DesignCatalog.tsx').DesignCatalog;
  const tree = Catalog({ events: examples });
  const grid = find(tree, node => node.props?.id === 'home-design-catalog');
  assert.equal(React.Children.count(grid.props.children), 6);
  let selected = examples[0].slug;
  const Hero = loadComponents({ useState: () => [selected, value => { selected = value; }] })('components/landing/HeroInvitationExamples.tsx').HeroInvitationExamples;
  const render = () => Hero({ examples });
  for (const example of examples) {
    find(render(), node => node.type === 'button' && node.props.children === example.typeLabel).props.onClick();
    assert.equal(find(render(), node => node.props?.styleSlug).props.styleSlug, example.slug);
    assert.equal(find(render(), node => node.props?.['aria-label'] === 'Ejemplo siguiente'), null);
    assert.equal(find(render(), node => node.props?.['aria-label'] === 'Ejemplo anterior'), null);
  }
});


test('hero offers every design within one occasion and handles an empty custom collection', () => {
  const examples = ['primero', 'segundo'].map((slug, index) => ({ slug, label: `Diseño ${index + 1}`, eventType: 'wedding', typeLabel: 'Boda', available: true }));
  let selected = examples[0].slug;
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    let result = null;
    React.Children.forEach(node.props?.children, child => { result ||= find(child, predicate); });
    return result;
  }
  const Hero = loadComponents({ useState: () => [selected, value => { selected = value; }] })('components/landing/HeroInvitationExamples.tsx').HeroInvitationExamples;
  const tree = Hero({ examples });
  const selector = find(tree, node => node.type === 'select');
  assert.equal(React.Children.count(selector.props.children), 2);
  selector.props.onChange({ target: { value: 'segundo' } });
  assert.equal(find(Hero({ examples }), node => node.props?.styleSlug).props.styleSlug, 'segundo');
  assert.equal(find(Hero({ examples: [] }), node => node.props?.styleSlug), null);
});

test('global finishes cover every panel and switching back restores the original mix without mutating sections', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const example = { ...load('lib/landing-invitation-example.ts').landingEventExamples[0].invitation, date: '12 de octubre de 2027', eventDateKey: '2027-10-12' };
  const sections = example.sections.map((section, index) => ({ ...section, panelStyle: index % 2 ? 'color' : 'blur-color' }));
  const original = structuredClone(sections);
  const render = panelStyle => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...example, sections, panelStyle }));
  const baseline = render('auto');
  for (const style of ['blur', 'blur-color', 'color', 'glass', 'none']) {
    const html = render(style);
    const finishes = [...html.matchAll(/data-surface="([^"]+)"/g)].map(match => match[1]);
    assert.ok(finishes.length >= 5);
    assert.ok(finishes.every(finish => finish === style), style);
    assert.equal(render('auto'), baseline);
    assert.deepEqual(sections, original);
  }
});


test('the content-only finish is selectable globally and per section and hides irrelevant controls', () => {
  const load = loadComponents();
  const { InvitationStyleJourney } = load('components/dashboard/InvitationStyleJourney.tsx');
  const { InvitationSurfacePicker } = load('components/dashboard/InvitationSurfacePicker.tsx');
  const { SectionSurfaceFields } = load('components/dashboard/InvitationSectionFields.tsx');
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const values = load('lib/guided-invitation.ts').initialGuidedValues({ id: '', eventType: 'wedding', name: 'Nuestra boda', hostNames: 'Alex y Sam', accent: '#58664E', typography: 'default', bodyTypography: 'inter', sections: [] });
  const props = { ...values, panelStyle: 'none' };
  const guided = renderToStaticMarkup(React.createElement(InvitationStyleJourney, { values: props, step: 2, onStepChange() {}, onChange() {} }));
  const surface = renderToStaticMarkup(React.createElement(InvitationSurfacePicker, { values: props, onChange() {}, onBlurChange() {}, onGlassBorderChange() {} }));
  for (const html of [guided, surface]) {
    assert.match(html, /aria-pressed="true">(?:<[^>]+>)*Sin fondo|aria-pressed="true"[\s\S]*Sin fondo/);
    assert.match(html, /data-surface="none"/);
    assert.doesNotMatch(html, /Intensidad del desenfoque|Intensidad del blur|Mostrar borde del cristal/);
  }
  const section = { id: 'story', type: 'story', title: 'Nuestra historia', content: 'Un recuerdo', detail: '', link: '', imageUrl: '/photo.webp', enabled: true, panelStyle: 'none' };
  const fields = renderToStaticMarkup(React.createElement(SectionSurfaceFields, { section, onChange() {} }));
  assert.match(fields, /aria-pressed="true">Sin fondo/);
  const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...values, panelStyle: 'auto', date: '', sections: [section] }));
  assert.match(html, /wa-story" data-surface="none"/);
  assert.match(html, /Un recuerdo/);
  assert.match(html, /src="\/photo.webp"/);
  assert.doesNotMatch(html, /data-panel-style="none"/);
});

test('glass border switch updates both editors and removes edges without changing transparency', () => {
  const load = loadComponents();
  const { InvitationStyleJourney } = load('components/dashboard/InvitationStyleJourney.tsx');
  const { InvitationSurfacePicker } = load('components/dashboard/InvitationSurfacePicker.tsx');
  const { InvitationGlassBorderToggle } = load('components/dashboard/InvitationGlassBorderToggle.tsx');
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const { atmosphereStyle } = load('lib/invitation-atmosphere.ts');
  const values = load('lib/guided-invitation.ts').initialGuidedValues({ id: '', eventType: 'wedding', name: 'Fiesta', hostNames: 'Alex', accent: '#58664E', typography: 'default', bodyTypography: 'inter', sections: [] });
  for (const glassBorder of [undefined, true, false]) {
    const props = { ...values, panelStyle: 'glass', glassBorder };
    const guided = renderToStaticMarkup(React.createElement(InvitationStyleJourney, { values: props, step: 2, onStepChange() {}, onChange() {} }));
    const surface = renderToStaticMarkup(React.createElement(InvitationSurfacePicker, { values: props, onChange() {}, onBlurChange() {}, onGlassBorderChange() {} }));
    for (const html of [guided, surface]) {
      assert.match(html, /Mostrar borde del cristal/);
      assert.match(html, /type="checkbox" role="switch"/);
      assert.equal(/type="checkbox" role="switch"[^>]*checked/.test(html), glassBorder !== false);
    }
    const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...props, date: '' }));
    assert.ok(html.includes('--wa-glass-border-width:' + (glassBorder === false ? '0px' : '1px')));
    const style = atmosphereStyle(values.accent, props);
    assert.equal(style['--wa-glass-shadow'].includes('inset'), glassBorder !== false);
    assert.equal(style['--wa-glass-background'], atmosphereStyle(values.accent)['--wa-glass-background']);
    assert.equal(style['--wa-glass-filter'], atmosphereStyle(values.accent)['--wa-glass-filter']);
  }
  // Exercise the switch callback with the event value in both directions.
  const callbacks = loadComponents({ useId: () => 'glass-border' });
  const Toggle = callbacks('components/dashboard/InvitationGlassBorderToggle.tsx').InvitationGlassBorderToggle;
  let selected = true;
  const input = Toggle({ onChange: value => { selected = value; } }).props.children[1];
  input.props.onChange({ target: { checked: false } });
  assert.equal(selected, false);
  input.props.onChange({ target: { checked: true } });
  assert.equal(selected, true);
  assert.ok(InvitationGlassBorderToggle);
});

test('page background blur reaches public invitations and remains independent of section finishes', () => {
  const load = loadComponents();
  const { atmosphereStyle } = load('lib/invitation-atmosphere.ts');
  const { PublicInvitationContent } = load('components/invitation/PublicInvitationContent.tsx');
  const { InvitationStyleJourney } = load('components/dashboard/InvitationStyleJourney.tsx');
  const values = load('lib/guided-invitation.ts').initialGuidedValues({ id: '', eventType: 'wedding', name: 'Nuestra boda', hostNames: 'Alex y Sam', accent: '#58664E', typography: 'default', bodyTypography: 'inter', sections: [] });
  for (const backgroundBlurIntensity of [undefined, 0, 25, 50, 100]) {
    const style = atmosphereStyle(values.accent, { backgroundBlurIntensity, blurIntensity: 50 });
    assert.equal(style['--wa-background-blur'], ((backgroundBlurIntensity ?? 0) * 0.24) + 'px');
    assert.equal(style['--wa-blur'], '16px');
    assert.equal(style['--wa-glass-blur'], '8px');
    const html = renderToStaticMarkup(React.createElement(PublicInvitationContent, { event: { ...values, eventDate: null, backgroundBlurIntensity } }));
    assert.ok(html.includes('--wa-background-blur:' + style['--wa-background-blur']));
  }
  for (const panelStyle of ['none', 'color', 'glass']) {
    const html = renderToStaticMarkup(React.createElement(InvitationStyleJourney, { values: { ...values, panelStyle, backgroundBlurIntensity: 75 }, step: 2, onStepChange() {}, onChange() {} }));
    assert.match(html, /Desenfoque del fondo de la invitación/);
    assert.match(html, /75% de desenfoque del fondo/);
  }
  for (const backgroundBlurIntensity of [NaN, -1, 101, '50']) assert.equal(atmosphereStyle(values.accent, { backgroundBlurIntensity })['--wa-background-blur'], '0px');
  const hooks = loadComponents({ useId: () => 'background-blur' });
  const { InvitationBackgroundBlurControl } = hooks('components/dashboard/InvitationBackgroundBlurControl.tsx');
  let selected = 0;
  const input = InvitationBackgroundBlurControl({ onChange: value => { selected = value; } }).props.children.find(child => child.type === 'input');
  input.props.onChange({ target: { value: '75' } });
  assert.equal(selected, 75);
  input.props.onChange({ target: { value: '0' } });
  assert.equal(selected, 0);
});

test('page background dimming reaches public invitations and both previews independently of blur', () => {
  const load = loadComponents();
  const { atmosphereStyle } = load('lib/invitation-atmosphere.ts');
  const { PublicInvitationContent } = load('components/invitation/PublicInvitationContent.tsx');
  const { InvitationStyleJourney } = load('components/dashboard/InvitationStyleJourney.tsx');
  const { InvitationSurfacePicker } = load('components/dashboard/InvitationSurfacePicker.tsx');
  const values = load('lib/guided-invitation.ts').initialGuidedValues({ id: '', eventType: 'wedding', name: 'Nuestra boda', hostNames: 'Alex y Sam', accent: '#58664E', typography: 'default', bodyTypography: 'inter', sections: [] });
  for (const backgroundDimIntensity of [undefined, 0, 30, 100]) {
    const style = atmosphereStyle(values.accent, { backgroundDimIntensity, backgroundBlurIntensity: 50, blurIntensity: 50 });
    assert.equal(style['--wa-background-dim'], (backgroundDimIntensity ?? 0) / 100);
    assert.equal(style['--wa-background-blur'], '12px');
    assert.equal(style['--wa-blur'], '16px');
    for (const backgroundImageUrl of ['', '/background.webp']) {
      const html = renderToStaticMarkup(React.createElement(PublicInvitationContent, { event: { ...values, eventDate: null, backgroundDimIntensity, backgroundImageUrl } }));
      assert.ok(html.includes('--wa-background-dim:' + style['--wa-background-dim']));
      const background = html.slice(html.indexOf('class="wa-backdrop"'), html.indexOf('class="wa-column"'));
      assert.match(background, /class="wa-backdrop-dim"/);
      assert.equal(background.includes('wa-backdrop-image'), Boolean(backgroundImageUrl));
    }
  }
  for (const panelStyle of ['none', 'color', 'glass']) {
    const props = { ...values, panelStyle, backgroundDimIntensity: 30 };
    const guided = renderToStaticMarkup(React.createElement(InvitationStyleJourney, { values: props, step: 2, onStepChange() {}, onChange() {} }));
    assert.match(guided, /Oscurecer el fondo de la invitación/);
    assert.match(guided, /30% de oscurecimiento del fondo/);
    const surface = renderToStaticMarkup(React.createElement(InvitationSurfacePicker, { values: props, onChange() {}, onBlurChange() {}, onGlassBorderChange() {} }));
    assert.match(surface, /--wa-background-dim:0.3/);
  }
  for (const backgroundDimIntensity of [NaN, -1, 101, '50']) assert.equal(atmosphereStyle(values.accent, { backgroundDimIntensity })['--wa-background-dim'], 0);
  const hooks = loadComponents({ useId: () => 'background-dim' });
  const { InvitationBackgroundDimControl } = hooks('components/dashboard/InvitationBackgroundDimControl.tsx');
  let selected = 0;
  const input = InvitationBackgroundDimControl({ onChange: value => { selected = value; } }).props.children.find(child => child.type === 'input');
  input.props.onChange({ target: { value: '30' } });
  assert.equal(selected, 30);
  input.props.onChange({ target: { value: '0' } });
  assert.equal(selected, 0);
});

test('blur intensity controls all blur layers while preserving the original default strengths', () => {
  const load = loadComponents();
  const { atmosphereStyle } = load('lib/invitation-atmosphere.ts');
  const defaults = atmosphereStyle('#58664E');
  assert.equal(defaults['--wa-blur'], '16px');
  assert.equal(defaults['--wa-blur-color'], '24px');
  assert.equal(defaults['--wa-blur-cover'], '20px');
  for (const blurIntensity of [0, 25, 50, 100]) {
    const style = atmosphereStyle('#58664E', { blurIntensity });
    for (const [variable, radius] of [['--wa-blur', 16], ['--wa-blur-color', 24], ['--wa-blur-cover', 20], ['--wa-blur-panel', 18]]) assert.equal(style[variable], (radius * blurIntensity / 50) + 'px');
  }
  assert.equal(atmosphereStyle('#58664E', { blurIntensity: NaN })['--wa-blur'], '16px');
});


test('text alignment is independent for cover, countdown and sections with or without photos', () => {
  const { CelebrationInvitation } = loadComponents()('components/invitation/CelebrationInvitation.tsx');
  const section = {id:'story',type:'story',title:'Historia',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true};
  for (const textAlign of [undefined,'auto','left','center','right']) {
    for (const imageUrl of ['', '/photo.webp']) {
      const sections = [{...section,type:'cover',id:'cover',textAlign},{...section,type:'countdown',id:'countdown',textAlign},{...section,textAlign,imageUrl}];
      const html = renderToStaticMarkup(React.createElement(CelebrationInvitation,{name:'Fiesta',hostNames:'Alex',date:'20 de noviembre',eventDateKey:'2027-11-20',venue:'',address:'',message:'',imageUrl:'/cover.webp',sections,accent:'#58664E'}));
      assert.equal((html.match(/data-text-align=/g)||[]).length, textAlign ? 3 : 0);
      if(textAlign) assert.equal((html.match(new RegExp('data-text-align="'+textAlign+'"','g'))||[]).length,3);
      assert.equal(html.includes('src="/photo.webp"'),Boolean(imageUrl));
      assert.ok(html.indexOf('wa-cover-heading') < html.indexOf('wa-portrait'));
    }
  }
});


test('program editing preserves legacy activities, optional times, midnight order and blank rows', () => {
  const {parseInvitationProgram,serializeInvitationProgram}=loadComponents()('lib/invitation-program.ts');
  const original='16:30 — Llegada de invitados\n17:00 - Ceremonia religiosa\n19:00 – Cóctel — bienvenida\n01:00 — Despedida\nUn momento sin hora';
  const items=parseInvitationProgram(original);
  assert.deepEqual(items.map(item=>item.time),['16:30','17:00','19:00','01:00','']);
  assert.equal(items[2].activity,'Cóctel — bienvenida');
  assert.deepEqual(parseInvitationProgram(serializeInvitationProgram(items)),items);
  const blanks=[{time:'',activity:''},{time:'00:00',activity:''},{time:'',activity:''}];
  assert.deepEqual(parseInvitationProgram(serializeInvitationProgram(blanks)),blanks);
  assert.equal(parseInvitationProgram('5:30 p. m. — Brindis')[0].time,'17:30');
  assert.equal(parseInvitationProgram('12:00 a.m. — Despedida')[0].time,'00:00');
  for(const activity of ['99:00 — Una nota','24:00 — Una nota','12:99 — Una nota','Un texto - con guion']) assert.deepEqual(parseInvitationProgram(activity),[{time:'',activity}]);
});

test('program preview keeps descriptions intact and omits empty editing rows',()=>{
 const {CelebrationInvitation}=loadComponents()('components/invitation/CelebrationInvitation.tsx');
 const html=renderToStaticMarkup(React.createElement(CelebrationInvitation,{name:'Fiesta',hostNames:'Alex',date:'',venue:'',address:'',message:'',imageUrl:'',accent:'#58664E',sections:[{id:'program',type:'program',title:'Itinerario',content:'19:00 — Cóctel — bienvenida\n\nSin horario - actividad\n01:00 — Despedida',detail:'',link:'',imageUrl:'',enabled:true}]}));
 const timeline=html.slice(html.indexOf('<ol class="wa-timeline"'),html.indexOf('</ol>'));
 assert.equal((timeline.match(/<li>/g)||[]).length,3);
 assert.match(timeline,/Cóctel — bienvenida/);
 assert.match(timeline,/<span>Sin horario - actividad<\/span>/);
 assert.ok(timeline.indexOf('19:00')<timeline.indexOf('01:00'));
});


test('global corner options reach the shared invitation style for every block and media surface',()=>{
 const load=loadComponents();const {CelebrationInvitation}=load('components/invitation/CelebrationInvitation.tsx');
 const base={name:'Fiesta',hostNames:'Alex',date:'',venue:'',address:'',message:'',imageUrl:'',accent:'#58664E',sections:[]};
 for(const [sectionCorners,radius] of [['square',0],['soft',8],['rounded',18],[undefined,18]]) {
  const html=renderToStaticMarkup(React.createElement(CelebrationInvitation,{...base,sectionCorners}));
  assert.ok(html.includes('--wa-section-radius:'+radius+'px'));
 }
});


test('alignment shortcuts belong to each editable block and stay out of public invitations',()=>{
 const {CelebrationInvitation}=loadComponents()('components/invitation/CelebrationInvitation.tsx');
 const blank={title:'',content:'',detail:'',link:'',imageUrl:'',enabled:true};
 const sections=[{...blank,id:'cover',type:'cover',title:'Portada'},{...blank,id:'countdown',type:'countdown',title:'Cuenta regresiva'},{...blank,id:'location',type:'location',title:'Lugar del evento'},{...blank,id:'story',type:'story',title:'Nuestra historia',content:'Una historia'}];
 const props={name:'Fiesta',hostNames:'Alex',date:'20 de noviembre',eventDateKey:'2027-11-20',venue:'Jardín',address:'',message:'',imageUrl:'',accent:'#58664E',sections};
 const owner=renderToStaticMarkup(React.createElement(CelebrationInvitation,{...props,onEdit:()=>{}}));
 for(const section of sections)assert.ok(owner.includes('aria-label="Editar alineación del texto de '+section.title+'"'));
 assert.equal((owner.match(/wa-edit-alignment/g)||[]).length,4);
 assert.doesNotMatch(renderToStaticMarkup(React.createElement(CelebrationInvitation,props)),/wa-edit-alignment/);
});


test('content dialogs omit surface and alignment controls while the guided editor keeps them',()=>{
 const {SectionFields}=loadComponents()('components/dashboard/InvitationSectionFields.tsx');
 for(const type of ['story','program','location','gallery']) {
  const section={id:type,type,title:'Mi sección',content:'',detail:'',link:'',imageUrl:'',enabled:true};
  const props={section,onChange:()=>{},uploadProps:{eventId:'event',onBusyChange:()=>{}},allowSectionPhoto:true};
  const render=extra=>renderToStaticMarkup(React.createElement(SectionFields,{...props,...extra}));
  const dialog=render({showStyleControls:false});
  assert.doesNotMatch(dialog,/Alineación del texto|Estilo de esta sección/);
  const guided=render({});
  assert.match(guided,/Alineación del texto/);
  assert.match(guided,/Estilo de esta sección/);
 }
});


test('section icons default to visible and can be hidden independently without an empty icon element',()=>{
 const load=loadComponents();const {CelebrationInvitation}=load('components/invitation/CelebrationInvitation.tsx');
 const blank={detail:'',link:'',imageUrl:'',enabled:true};
 const story={...blank,id:'story',type:'story',title:'Historia',content:'Un recuerdo'};
 const program={...blank,id:'program',type:'program',title:'Itinerario',content:'17:00 — Llegada'};
 const props={name:'Fiesta',hostNames:'Alex',date:'',venue:'',address:'',message:'',imageUrl:'',accent:'#58664E'};
 for(const onEdit of [undefined,()=>{}]) {
  const render=sections=>renderToStaticMarkup(React.createElement(CelebrationInvitation,{...props,sections,onEdit}));
  assert.equal((render([story,program]).match(/class="wa-section-icon"/g)||[]).length,2);
  const html=render([{...story,showIcon:false},program]);
  assert.equal((html.match(/class="wa-section-icon"/g)||[]).length,1);
  assert.match(html,/Historia/);
  assert.equal((render([{...story,showIcon:false},{...program,showIcon:false}]).match(/class="wa-section-icon"/g)||[]).length,0);
 }
 const {SectionSurfaceFields}=load('components/dashboard/InvitationSectionFields.tsx');
 const controls=renderToStaticMarkup(React.createElement(SectionSurfaceFields,{section:story,onChange:()=>{},globalPanelStyle:'color'}));
 assert.match(controls,/Mostrar icono/);
 assert.match(controls,/role="switch" checked=""/);
 assert.doesNotMatch(controls,/<input[^>]*disabled/);
});


test('global icon switch hides all section icons and restores individual preferences without changing them',()=>{
 const load=loadComponents();const {CelebrationInvitation}=load('components/invitation/CelebrationInvitation.tsx');
 const blank={detail:'',link:'',imageUrl:'',enabled:true};
 const sections=[{...blank,id:'story',type:'story',title:'Historia',content:'Un recuerdo',showIcon:false},{...blank,id:'program',type:'program',title:'Itinerario',content:'17:00 — Llegada'}];
 const before=structuredClone(sections);
 const props={name:'Fiesta',hostNames:'Alex',date:'',venue:'Jardín',address:'',message:'',imageUrl:'',accent:'#58664E',sections};
 for(const onEdit of [undefined,()=>{}]) {
  const render=showSectionIcons=>renderToStaticMarkup(React.createElement(CelebrationInvitation,{...props,onEdit,showSectionIcons}));
  assert.equal((render(undefined).match(/class="wa-section-icon"/g)||[]).length,2);
  assert.doesNotMatch(render(false),/class="wa-section-icon"/);
  assert.equal((render(true).match(/class="wa-section-icon"/g)||[]).length,2);
 }
 assert.deepEqual(sections,before);
 const {SectionSurfaceFields}=load('components/dashboard/InvitationSectionFields.tsx');
 const html=renderToStaticMarkup(React.createElement(SectionSurfaceFields,{section:sections[1],globalShowIcons:false,onChange:()=>{}}));
 assert.match(html,/Activa los iconos en Apariencia/);
 assert.match(html,/<input[^>]*disabled/);
});


test('visibility controls are available for optional blocks, never the cover or public invitation',()=>{
 const load=loadComponents();const {CelebrationInvitation}=load('components/invitation/CelebrationInvitation.tsx');
 const blank={content:'Texto',detail:'',link:'',imageUrl:'',enabled:true};
 const sections=[{...blank,id:'cover',type:'cover',title:'Portada'},{...blank,id:'countdown',type:'countdown',title:'Cuenta regresiva'},{...blank,id:'location',type:'location',title:'Lugar del evento'},{...blank,id:'story',type:'story',title:'Historia'}];
 const props={name:'Fiesta',hostNames:'Alex',date:'20 de noviembre',eventDateKey:'2027-11-20',venue:'Jardín',address:'',message:'',imageUrl:'',accent:'#58664E',sections};
 const owner=renderToStaticMarkup(React.createElement(CelebrationInvitation,{...props,onEdit:()=>{}}));
 for(const title of ['Cuenta regresiva','Lugar del evento','Historia'])assert.ok(owner.includes('aria-label="Cambiar visibilidad de '+title+'"'));
 assert.doesNotMatch(owner,/Cambiar visibilidad de Portada/);
 assert.doesNotMatch(renderToStaticMarkup(React.createElement(CelebrationInvitation,props)),/Cambiar visibilidad/);
});


test('each appearance substep has its own controls and a cumulative example; solid color omits intensity',()=>{
 const load=loadComponents();const {InvitationStyleJourney}=load('components/dashboard/InvitationStyleJourney.tsx');
 const values=load('lib/guided-invitation.ts').initialGuidedValues({id:'',eventType:'wedding',name:'Nuestra boda',hostNames:'Alex y Sam',accent:'#58664E',typography:'default',bodyTypography:'inter',sections:[]});
 const render=(step,changes={})=>renderToStaticMarkup(React.createElement(InvitationStyleJourney,{values:{...values,...changes},step,onStepChange:()=>{},onChange:()=>{}}));
 for(let step=0;step<5;step++) {const html=render(step);assert.match(html,/Ejemplo con tus elecciones/);assert.match(html,/Alex y Sam/);assert.ok(html.includes('Detalle '+(step+1)+' de 5'));}
 assert.match(render(0),/Esquinas de la invitación/);assert.doesNotMatch(render(0),/Mostrar iconos en las secciones/);
 assert.match(render(1),/Mostrar iconos en las secciones/);
 assert.match(render(2),/Intensidad del desenfoque/);assert.doesNotMatch(render(2,{panelStyle:'color'}),/Intensidad del desenfoque/);
 assert.match(render(3),/El color de tu celebración/);assert.match(render(4),/Usar letras recomendadas/);
});


test('compact palettes start with six choices, keep a selected extra color visible and offer the full list',()=>{
 const load=loadComponents();const {InvitationPalettePicker}=load('components/dashboard/InvitationPalettePicker.tsx');const {sharedInvitationDesign}=load('lib/shared-invitation.ts');
 const render=accent=>renderToStaticMarkup(React.createElement(InvitationPalettePicker,{compact:true,palettes:sharedInvitationDesign.palettes,accent,onChange:()=>{}}));
 assert.equal((render(sharedInvitationDesign.palettes[0].accent).match(/type="radio"/g)||[]).length,6);
 assert.match(render(sharedInvitationDesign.palettes[0].accent),/Ver más colores/);
 assert.equal((render(sharedInvitationDesign.palettes.at(-1).accent).match(/type="radio"/g)||[]).length,7);
});





test('section quick actions start closed, keep controls available on demand and omit redundant photo actions',()=>{
 const {SectionQuickActions}=loadComponents()('components/dashboard/SectionQuickActions.tsx');
 const blank={id:'story',type:'story',title:'Historia',content:'',detail:'',link:'',imageUrl:'',enabled:true};
 const render=type=>renderToStaticMarkup(React.createElement(SectionQuickActions,{section:{...blank,type},onChange:()=>{},uploadProps:{eventId:'event',onBusyChange:()=>{}}}));
 const html=render('story');assert.equal((html.match(/aria-expanded="false"/g)||[]).length,3);
 assert.doesNotMatch(html,/Fondo de esta sección|Mostrar icono|Foto junto a esta sección|Alineación del texto/);
 for(const type of ['gallery','countdown']) assert.equal((render(type).match(/aria-expanded="false"/g)||[]).length,2);
});


test('mobile framing reaches the cover, attached photos and carousel without changing section placement', () => {
 const load = loadComponents();
 const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
 const { SectionPhotoFields } = load('components/dashboard/InvitationSectionFields.tsx');
 const { InvitationMobileImageFocus } = load('components/dashboard/InvitationMobileImageFocus.tsx');
 const blank = { title:'Foto', content:'Texto', detail:'', link:'', enabled:true, imageUrl:'https://example.com/photo.jpg', mobileImageFocus:'bottom', desktopImageFocus:'top' };
 const sections = [{...blank,id:'cover',type:'cover',mobileImageFocus:'top',desktopImageFocus:'bottom'}, {...blank,id:'story',type:'story',imagePosition:'before'}, {...blank,id:'gallery',type:'gallery',imageUrls:['https://example.com/photo.jpg']}];
 const props = { name:'Fiesta',eventType:'wedding',hostNames:'Alex',date:'',venue:'',address:'',message:'',imageUrl:'https://example.com/cover.jpg',accent:'#58664E',sections };
 for (const coverLayout of ['split', 'split-reverse', 'stacked', 'overlay']) {
  const html = renderToStaticMarkup(React.createElement(CelebrationInvitation, {...props,coverLayout}));
  assert.match(html, /class="wa-portrait" data-mobile-image-focus="top" data-desktop-image-focus="bottom"/);
  assert.equal((html.match(/class="wa-section-media" data-mobile-image-focus="bottom"/g) || []).length, 2);
  assert.match(html, /data-photo-position="before"/);
  assert.equal((html.match(/data-mobile-image-focus="bottom" data-desktop-image-focus="top"/g) || []).length, 2);
  assert.match(html, /wa-carousel-slide/);
 }
 const changes = [];
 const control = InvitationMobileImageFocus({value:'center',onChange:value=>changes.push(value)});
 const choices = control.props.children[1].props.children;
 assert.equal(choices[4].props['aria-pressed'], true);
 choices.forEach(choice => choice.props.onClick());
 assert.deepEqual(changes, ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right']);
 for (const section of sections.slice(1)) {
  const html = renderToStaticMarkup(React.createElement(SectionPhotoFields, { section, onChange(){}, uploadProps:{eventId:'event',onBusyChange(){}} }));
  assert.match(html, /Encuadre de la foto en móvil/);
  assert.match(html, /Encuadre de la foto en escritorio/);
 }
 const { InvitationImageFocusFields } = load('components/dashboard/InvitationMobileImageFocus.tsx');
 const updates = [];
 const fields = InvitationImageFocusFields({ section:sections[0], onChange:patch=>updates.push(patch) }).props.children;
 fields[0].props.onChange('top-left');
 fields[1].props.onChange('bottom-right');
 assert.deepEqual(updates, [{mobileImageFocus:'top-left'}, {desktopImageFocus:'bottom-right'}]);
});


test('closing block preserves legacy copy and supports editing, hiding and restoring', () => {
  const load = loadComponents();
  const { CelebrationInvitation } = load('components/invitation/CelebrationInvitation.tsx');
  const { guidedSections, completeGuidedSections } = load('lib/guided-invitation.ts');
  const base = { eventType: 'other', name: 'Encuentro', hostNames: 'Alex', date: '', venue: '', address: '', message: '', imageUrl: '', accent: '#58664E', sections: [] };
  const render = sections => renderToStaticMarkup(React.createElement(CelebrationInvitation, { ...base, sections }));
  assert.match(render([]), /Gracias por ser parte de esta celebración/);
  for (const type of ['wedding', 'birthday', 'graduation', 'baby_shower', 'anniversary', 'other']) {
    const closing = guidedSections(type).find(s => s.type === 'closing');
    assert.equal(closing.enabled, true);
    assert.ok(closing.title && closing.content);
    assert.deepEqual(completeGuidedSections(type, []).find(s => s.type === 'closing'), closing);
  }
  const closing = { ...guidedSections('other').find(s => s.type === 'closing'), title: 'Hasta pronto', content: 'Nos vemos en la próxima' };
  const html = render([closing]);
  assert.match(html, /Hasta pronto/);
  assert.match(html, /Nos vemos en la próxima/);
  assert.equal((html.match(/Nos vemos en la próxima/g) || []).length, 1);
  assert.ok(html.includes('<strong>Alex</strong>'));
  assert.doesNotMatch(render([{ ...closing, enabled: false }]), /Hasta pronto|Nos vemos en la próxima/);
  assert.deepEqual(completeGuidedSections('other', [{ ...closing, enabled: false }]).find(s => s.type === 'closing'), { ...closing, enabled: false });
});
