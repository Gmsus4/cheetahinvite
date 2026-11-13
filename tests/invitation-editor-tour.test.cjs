/* eslint-disable @typescript-eslint/no-require-imports -- Exercise tour lifecycle against controlled DOM, Driver and device storage. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
const { invitationEditorTourSteps } = createFixture().load('lib/invitation-editor-tour.ts');
const defaults = { published: false, example: false, returnsToCreation: true, allIncluded: false };

function fixture({ storageBlocked = false, mobile = false, missingPhoto = false } = {}) {
  const slots = [], effects = [], cleanups = [], records = new Map(), calls = [];
  let cursor = 0, effectCursor = 0, driverConfig, focused = 0, loadingFailure = false;
  const listeners = new Map();
  const root = { dataset: {}, querySelector: selector => missingPhoto && (selector.includes('cover-photo') || selector.includes('block-photo')) ? null : ({ selector }) };
  const trigger = { closest: () => root, focus: () => focused++ };
  const window = {
    scrollY: 130, innerHeight: 640, scrollTo: position => calls.push(['restore', position]), scrollBy: position => calls.push(['scroll', position]),
    matchMedia: query => ({ matches: query === '(prefers-reduced-motion: reduce)' || (mobile && query === '(max-width: 600px)') }),
    localStorage: { getItem: key => { if (storageBlocked) throw Error('blocked'); return records.get(key) ?? null; }, setItem: (key, value) => { if (storageBlocked) throw Error('blocked'); records.set(key, value); } },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name), dispatchEvent: event => listeners.get(event.type)?.(),
  };
  const document = { body: {}, querySelector: () => ({ getBoundingClientRect: () => ({ top: 350 }) }) };
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useCallback: fn => fn,
    useSyncExternalStore: (_, snapshot) => snapshot(),
    useEffect(fn, deps) { const i = effectCursor++; if (!effects[i] || deps.some((d, index) => effects[i].deps[index] !== d)) { effects[i] = { deps, fn }; cleanups[i]?.(); cleanups[i] = fn(); } },
  };
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('components/dashboard/InvitationEditorTour.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', 'window', 'document', 'Event', source)(name => {
    if (name === 'react') return react;
    if (name === 'react-dom') return { createPortal: node => node };
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react-icons/fi') return { FiHelpCircle: () => null, FiX: () => null };
    if (name === '@/lib/invitation-editor-tour') return { invitationEditorTourSteps };
    if (name.endsWith('.css')) return {};
    if (name === 'driver.js') {
      if (loadingFailure) throw Error('chunk unavailable');
      return { driver(config) { driverConfig = config; calls.push(['driver']); return { drive: () => calls.push(['drive']), destroy: () => config.onDestroyed() }; } };
    }
    throw Error('Unexpected import');
  }, mod, mod.exports, window, document, class { constructor(type) { this.type = type; } });
  function nodes(node) { return Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : []; }
  let props = { ...defaults, ownerId: 'owner', enabled: true };
  function render(changes = {}) {
    props = { ...props, ...changes }; cursor = 0; effectCursor = 0;
    const tree = nodes(mod.exports.InvitationEditorTour(props));
    const help = tree.find(n => n.type === 'button' && n.props.title === 'Ayuda: recorrido guiado');
    help.props.ref.current = trigger;
    return { tree, help, welcome: tree.find(n => n.type === 'aside') };
  }
  return { render, calls, records, root, window, get config() { return driverConfig; }, get focused() { return focused; }, failImport() { loadingFailure = true; }, cleanup() { cleanups.forEach(fn => fn?.()); } };
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

test('tour targets each block icon, location and help and distinguishes saving from publication', () => {
  const steps = invitationEditorTourSteps(defaults);
  assert.equal(steps.length, 13);
  assert.equal(new Set(steps.map(step => step.element)).size, 13);
  assert.equal(steps[0].element, '.wa-cover-heading');
  assert.match(steps[0].popover.description, /formada por bloques/);
  const message = (steps, anchor) => steps.find(step => step.element === `[data-tour="${anchor}"]`).popover.description;
  assert.deepEqual(steps.slice(1,5).map(step => step.element), ['block-edit','block-style','block-alignment','block-visibility'].map(anchor => `[data-tour="${anchor}"]`));
  assert.match(message(steps, 'block-visibility'), /Conservaremos su contenido/);
  assert.match(message(steps, 'block-style'), /Automático/);
  assert.match(message(steps, 'location'), /Google Maps/);
  assert.match(message(steps, 'help'), /repetir este recorrido/);
  assert.match(message(steps, 'save'), /todavía no publica/);
  assert.match(message(steps, 'back'), /cerrar esta pestaña/);
  const published = invitationEditorTourSteps({ ...defaults, published: true, returnsToCreation: false });
  assert.match(message(published, 'save'), /actualiza lo que ven tus invitados/);
  assert.doesNotMatch(message(published, 'back'), /cerrar esta pestaña/);
  assert.match(message(invitationEditorTourSteps({ ...defaults, example: true }), 'save'), /Administración/);
  assert.match(message(invitationEditorTourSteps({ ...defaults, allIncluded: true }), 'add'), /Ya incluiste todos/);
  const dashboard=invitationEditorTourSteps({...defaults,returnsToCreation:false,returnsToDashboard:true});
  assert.match(message(dashboard,'back'),/volver al dashboard/);
  assert.doesNotMatch(message(dashboard,'back'),/continuar al pago/);
});

test('welcome appears once per account, manual help replays the tour, and closing restores focus and scroll', async t => {
  const f = fixture(); t.after(() => f.cleanup());
  assert.ok(f.render().welcome);
  f.render().help.props.onClick(); await flush();
  assert.equal(f.config.steps.length, 13);
  assert.equal(f.config.disableActiveInteraction, true);
  assert.equal(f.config.animate, false);
  assert.equal(f.config.closeBtnLabel, 'Salir del recorrido');
  assert.equal(f.root.dataset.editorTourActive, 'true');
  assert.equal(f.render().welcome, undefined);
  f.config.onDestroyed();
  assert.equal(f.root.dataset.editorTourActive, undefined);
  assert.equal(f.focused, 1);
  assert.deepEqual(f.calls.at(-1), ['restore', { top: 130, behavior: 'instant' }]);
  assert.equal(f.render().welcome, undefined);
  assert.ok(f.render({ ownerId: 'another-owner' }).welcome);
  f.render().help.props.onClick(); await flush();
  assert.equal(f.calls.filter(([call]) => call === 'drive').length, 2);
});

test('mobile keeps the target above the bottom card and skips missing targets', async t => {
  const f = fixture({ mobile: true, missingPhoto: true }); t.after(() => f.cleanup());
  f.render().help.props.onClick(); await flush();
  assert.equal(f.config.steps.length, 10);
  assert.ok(f.config.steps.some(step=>step.element?.selector==='[data-tour="block-more"]'));
  assert.ok(!f.config.steps.some(step=>/block-style|block-alignment|block-visibility/.test(step.element?.selector)));
  f.config.onHighlighted({ closest: () => null, getBoundingClientRect: () => ({ top: 300, bottom: 380 }) });
  assert.deepEqual(f.calls.at(-1), ['scroll', { top: 46, behavior: 'instant' }]);
  let scrolled = false;
  f.config.onHighlighted({ closest: () => ({}), getBoundingClientRect: () => ({ top: 300, bottom: 344 }), scrollIntoView: () => { scrolled = true; } });
  assert.equal(scrolled, true);
});

test('help works with blocked storage and a failed lazy load can be retried without affecting invitation data', async t => {
  const f = fixture({ storageBlocked: true }); t.after(() => f.cleanup());
  assert.equal(f.render().welcome, undefined);
  f.failImport(); f.render().help.props.onClick(); await flush();
  const ui = f.render();
  assert.ok(ui.tree.find(n => n.props.role === 'alert'));
  assert.equal(ui.help.props.disabled, false);
  assert.equal(f.root.dataset.editorTourActive, undefined);
  assert.equal(f.calls.length, 0);
});

test('help stays disabled while a modal or a save is active', async t => {
  const f = fixture(); t.after(() => f.cleanup());
  const ui = f.render({ enabled: false });
  assert.equal(ui.help.props.disabled, true);
  ui.help.props.onClick(); await flush();
  assert.equal(f.calls.length, 0);
  assert.equal(ui.welcome, undefined);
});
