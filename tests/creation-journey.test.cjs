/* eslint-disable @typescript-eslint/no-require-imports -- Exercise the real UI handlers with controlled browser and persistence boundaries. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

const hasClass = (node, name) => typeof node.props.className === 'string' && node.props.className.split(/\s+/).includes(name);

function setup(step = 5, { creation = true, published = false, exampleId, exampleCreation = false } = {}) {
  const f = createFixture();
  const { guidedSections, initialGuidedValues } = f.load('lib/guided-invitation.ts');
  const event = { ...f.state.events.get('event'), eventType: 'birthday', name: 'Cumpleaños de Sofía', hostNames: 'Sofía',
    eventDate: new Date('2027-01-15T12:00:00Z'), eventTime: '17:00', venue: 'Salón', address: 'Calle de prueba',
    accent: '#E9560A', typography: 'default', bodyTypography: 'inter', sections: guidedSections('birthday'), ...(published ? { status: 'PUBLISHED', slug: 'prueba-publicada', paidAt: new Date(), expiresAt: new Date('2099-01-01') } : {}) };
  if (exampleId) event.isExample = true;
  const values = { ...initialGuidedValues(event), privacy: 'PUBLIC', pin: '', pinPending: false };
  const storage = new Map(), intervals = [], effects = [], states = [], transitions = [], redirects = [], handlers = new Map();
  let cursor = 0, effectCursor = 0, controller, calls = 0, revision = 0, popupBlocked = false, closes = 0, useStep = true, failure = false;
  const localStorage = { get length() { return storage.size; }, key: i => [...storage.keys()][i] ?? null,
    getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const tab = { closed: false, focus() {}, close() { this.closed = true; }, location: { replace(href) { this.href = href; } } };
  const window = { localStorage, open: () => popupBlocked ? null : tab, scrollTo() {}, matchMedia: () => ({ matches: true }),
    setInterval: fn => { intervals.push(fn); return intervals.length; }, clearInterval() {},
    setTimeout: fn => { transitions.push(Promise.resolve().then(fn)); }, clearTimeout() {},
    addEventListener: (key, fn) => handlers.set(key, fn), removeEventListener() {}, close: () => { closes++; },
    location: { assign: href => redirects.push(href) } };
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = useStep && index === 1 ? step : typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef: value => ({ current: value }),
    useEffect(fn, deps) { const index = effectCursor++; const prior = effects[index]; if (!prior || deps.some((d, i) => d !== prior.deps[i])) effects[index] = { fn, deps, pending: true }; },
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    useTransition: () => [false, fn => transitions.push(fn())],
  };
  const placeholder = new Proxy({}, { get: (_, name) => Object.assign(() => null, { displayName: name }) });
  function load(file) {
    const mod = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const resolve = name => {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'next/navigation') return { useRouter: () => ({ replace: href => redirects.push(href), push: href => redirects.push(href) }) };
      if (name === './useEditorProtection') return { useEditorProtection(options) {
        if (!controller) {
          const { EditorPersistence } = f.load('lib/editor-persistence.ts');
          controller = new EditorPersistence({ ...options, save: async () => { calls++; return failure ? { ok: false, code: 'unavailable', message: 'No se pudo guardar' } : { ok: true, eventId: event.id, version: ++revision, privacyVersion: 0 }; } });
          controller.start({ storage: localStorage, uuid: randomUUID, now: Date.now, online: () => true });
        }
        return { controller, state: controller.getSnapshot(), confirmNavigation() {}, navigation: { destination: null, stay() {}, leave() {} } };
      } };
      if (name.startsWith('@/lib/')) return f.load(name.slice(2) + '.ts');
      if (name.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key });
      return placeholder;
    };
    new Function('require', 'module', 'exports', 'window', 'crypto', code)(resolve, mod, mod.exports, window, { randomUUID });
    return mod.exports;
  }
  const { GuidedInvitationEditor } = load('components/dashboard/GuidedInvitationEditor.tsx');
  function renderRoot(component, props) {
    cursor = 0; effectCursor = 0;
    const root = component(props);
    const nodes = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object' || !node.props) return;
      nodes.push(node); visit(node.props.children);
      if (node.props.ref && typeof node.props.ref === 'object') node.props.ref.current = { focus() {}, querySelector: () => null, reportValidity: () => true };
    }
    visit(root);
    for (const effect of effects) if (effect.pending) { effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.fn(); }
    return { nodes, find: predicate => nodes.find(predicate), submit: () => nodes.find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }) };
  }
  function render() { return renderRoot(GuidedInvitationEditor, { event, creation, exampleId, exampleCreation, saved: false, published, error: '' }); }
  const { InvitationShowEditor } = load('components/dashboard/InvitationShowEditor.tsx');
  const saved = [];
  function renderShow() {
    useStep = false;
    return renderRoot(InvitationShowEditor, { event, returnLink: { href: '/crear', title: 'Volver a crear', label: 'Volver a crear' }, onReturn: () => window.close(), onSaved: (snapshot, version) => saved.push({ snapshot, version }) });
  }
  return { event, values, window, storage, intervals, handlers, tab, load, render, renderShow, states, transitions, redirects, saved,
    get controller() { return controller; }, get calls() { return calls; }, get closes() { return closes; },
    blockPopup() { popupBlocked = true; },
    failSave() { failure = true; },
    async flush() { for (let i = 0; i < 40; i++) await Promise.resolve(); },
    stop() { controller?.stop(); for (const effect of effects) effect.cleanup?.(); },
  };
}

test('design step saves before opening /show and adopts its saved design on return without leaving /crear', async t => {
  const h = setup(); t.after(() => h.stop());
  let ui = h.render();
  assert.ok(ui.find(n => n.props['aria-label'] === 'Editar diseño en una nueva pestaña'));
  assert.equal(ui.find(n => hasClass(n, 'guided-review')), undefined);
  ui.find(n => n.props['aria-label'] === 'Editar diseño en una nueva pestaña').props.onClick(); await h.flush();
  assert.equal(h.calls, 1);
  assert.match(h.tab.location.href, /\/show\?preview=/);
  assert.equal(h.redirects.some(href => href.includes('/show')), false);
  assert.equal(h.states[1], 5);
  h.render();
  const { invitationPreviewKey, parseInvitationPreview, storeInvitationPreview } = createFixture().load('lib/invitation-preview.ts');
  const token = new URL(h.tab.location.href, 'http://localhost').searchParams.get('preview');
  const key = invitationPreviewKey(h.event.ownerId, h.event.id, token);
  const record = parseInvitationPreview(h.window.localStorage.getItem(key), h.event.ownerId, h.event.id);
  assert.equal(record.creationFlow, true);
  storeInvitationPreview(h.window.localStorage, { ...record, saved: true, version: 2, snapshot: JSON.stringify({ ...h.values, name: 'Editada visualmente', accent: '#123456' }) }, token);
  h.tab.closed = true; h.intervals.at(-1)();
  ui = h.render();
  assert.equal(h.states[0].name, 'Editada visualmente');
  assert.equal(h.states[0].accent, '#123456');
  assert.equal(h.states[0].privacy, 'PUBLIC');
  assert.equal(h.controller.getVersion(), 2);
  assert.equal(h.controller.shouldWarn(), false);
  assert.equal(h.states[1], 5);
  assert.equal(ui.find(n => hasClass(n, 'guided-review')), undefined);
  assert.ok(ui.find(n => n.props['aria-label'] === 'Revisar y publicar'));
  ui.submit(); ui = h.render();
  assert.equal(h.states[1], 6);
  assert.ok(ui.find(n => hasClass(n, 'guided-review')));
  assert.equal(ui.find(n => n.props.className === 'reviewTools'), undefined);
  assert.equal(ui.find(n => n.props['aria-label'] === 'Ajustar apariencia'), undefined);
  assert.ok(ui.find(n => n.props['aria-label'] === 'Guardar y continuar al pago'));
});

test('blocked popups do not navigate away from creation or start a save', async t => {
  const h = setup(); t.after(() => h.stop()); h.blockPopup();
  h.render().find(n => n.props['aria-label'] === 'Editar diseño en una nueva pestaña').props.onClick(); await h.flush();
  assert.equal(h.calls, 0);
  assert.equal(h.states[1], 5);
  assert.ok(h.states.some(value => typeof value === 'string' && value.includes('bloqueó')));
  assert.deepEqual(h.redirects, []);
});

test('editing information has four steps and no design card or preview instructions', t => {
  const h=setup(1,{creation:false,published:true});t.after(()=>h.stop());
  h.render().submit();
  let ui=h.render();assert.equal(h.states[1],4);
  assert.equal(ui.nodes.some(n=>n.type?.displayName==='SectionQuickActions'),false);
  h.states[2]='__more';h.render().submit();
  h.states[0]={...h.states[0],name:'Información actualizada'};ui=h.render();
  assert.equal(h.states[1],6);
  assert.ok(ui.find(n=>n.props['aria-label']?.includes('Paso 4 de 4')));
  assert.ok(ui.find(n=>hasClass(n, 'guided-review')));
  assert.ok(ui.find(n=>n.props['aria-label']==='Publicar cambios'));
  assert.equal(ui.find(n=>n.props.className==='reviewTools'),undefined);
  assert.equal(ui.find(n=>n.props['aria-label']==='Editar diseño en una nueva pestaña'),undefined);
  assert.equal(ui.find(n=>n.props['aria-label']==='Ajustar apariencia'),undefined);
  assert.equal(h.calls,0);
});

test('only the creation visual session receives a close-tab return; ordinary previews keep their link', async t => {
  const h = setup(); t.after(() => h.stop());
  const { invitationPreviewKey, parseInvitationPreview, storeInvitationPreview } = createFixture().load('lib/invitation-preview.ts');
  const { InvitationPreviewSession } = h.load('components/dashboard/InvitationPreviewSession.tsx');
  const token = randomUUID();
  const originalReturn = { href: '/dashboard/eventos/event', label: 'Editor completo', title: 'Volver al editor completo' };
  const record = { ownerId: h.event.ownerId, eventId: h.event.id, creationKey: randomUUID(), snapshot: JSON.stringify(h.values), version: 0, privacyVersion: 0 };
  storeInvitationPreview(h.window.localStorage, { ...record, creationFlow: true }, token);
  const incoming = InvitationPreviewSession({ event: h.event, previewToken: token, returnLink: originalReturn });
  const show = incoming.type(incoming.props);
  assert.equal(show.props.returnLink.href, '/crear?resume=event');
  show.props.onSaved(JSON.stringify(h.values), 1, 0);
  assert.equal(parseInvitationPreview(h.window.localStorage.getItem(invitationPreviewKey(h.event.ownerId, h.event.id, token)), h.event.ownerId, h.event.id).creationFlow, true);
  show.props.onReturn();
  assert.equal(h.closes, 1);
  await h.flush();
  assert.deepEqual(h.redirects, ['/crear?resume=event']);
  storeInvitationPreview(h.window.localStorage, record, token);
  const ordinary = incoming.type(incoming.props);
  assert.equal(ordinary.props.onReturn, undefined);
  assert.deepEqual(ordinary.props.returnLink, originalReturn);
  storeInvitationPreview(h.window.localStorage, { ...record, editorFlow: true, creationFlow: false }, token);
  const editing = incoming.type(incoming.props);
  assert.equal(editing.props.returnLink.href, originalReturn.href);
  assert.equal(editing.props.returnLink.label, 'Volver a editar');
  editing.props.onReturn(); await h.flush();
  assert.equal(h.redirects.at(-1), originalReturn.href);
});

test('visual return closes immediately when clean and saves before closing when dirty', async t => {
  const h = setup(); t.after(() => h.stop());
  let ui = h.renderShow();
  ui.find(n => n.props.title === 'Volver a crear').props.onClick();
  assert.equal(h.closes, 1);
  ui.find(n => n.type?.displayName === 'CelebrationInvitation').props.onEdit({ kind: 'cover' });
  ui = h.renderShow();
  ui.find(n => n.type === 'input' && n.props.id === 'show-name').props.onChange({ target: { value: 'Diseño actualizado' } });
  ui = h.renderShow();
  ui.find(n => n.props.title === 'Volver a crear').props.onClick();
  assert.equal(h.closes, 1);
  ui = h.renderShow();
  const dialog = ui.find(n => n.type?.displayName === 'EditorLeaveDialog' && n.props.onSaveAndLeave);
  assert.ok(dialog);
  dialog.props.onSaveAndLeave(); await Promise.all(h.transitions);
  assert.equal(h.calls, 1);
  assert.equal(JSON.parse(h.saved[0].snapshot).name, 'Diseño actualizado');
  assert.equal(h.closes, 2);
});

test('dashboard design tabs return to dashboard while creation handoffs keep their own return', async t => {
  const h=setup();t.after(()=>h.stop());
  const {InvitationPreviewSession}=h.load('components/dashboard/InvitationPreviewSession.tsx');
  const returnLink={href:'/dashboard/eventos/event',title:'Editor completo',label:'Editor completo'};
  const show=InvitationPreviewSession({event:h.event,returnLink,returnToDashboard:true});
  assert.equal(show.props.returnLink.href,'/dashboard');
  assert.equal(show.props.returnLink.label,'Volver al dashboard');
  show.props.onReturn();await h.flush();
  assert.equal(h.closes,1);assert.equal(h.redirects.at(-1),'/dashboard');
  const {storeInvitationPreview}=createFixture().load('lib/invitation-preview.ts');
  const token=randomUUID();
  storeInvitationPreview(h.window.localStorage,{ownerId:h.event.ownerId,eventId:h.event.id,creationKey:randomUUID(),snapshot:JSON.stringify(h.values),version:0,creationFlow:true},token);
  const incoming=InvitationPreviewSession({event:h.event,returnLink,previewToken:token,returnToDashboard:true});
  const creation=incoming.type(incoming.props);
  assert.equal(creation.props.returnLink.href,'/crear?resume=event');
  creation.props.onReturn();await h.flush();
  assert.equal(h.redirects.at(-1),'/crear?resume=event');
});

test('a failed save keeps the visual tab open and its edits protected', async t => {
  const h = setup(); t.after(() => h.stop()); h.failSave();
  let ui = h.renderShow();
  ui.find(n => n.type?.displayName === 'CelebrationInvitation').props.onEdit({ kind: 'cover' });
  ui = h.renderShow();
  ui.find(n => n.type === 'input' && n.props.id === 'show-name').props.onChange({ target: { value: 'Pendiente de guardar' } });
  ui = h.renderShow(); ui.find(n => n.props.title === 'Volver a crear').props.onClick();
  ui = h.renderShow();
  ui.find(n => n.type?.displayName === 'EditorLeaveDialog' && n.props.onSaveAndLeave).props.onSaveAndLeave();
  await Promise.all(h.transitions);
  assert.equal(h.closes, 0);
  assert.equal(h.controller.shouldWarn(), true);
  assert.equal(h.saved.length, 0);
  assert.equal(h.controller.getSnapshot().error, 'No se pudo guardar');
});

test('creation skips visual steps and visual block controls while traversing information', t => {
  const h = setup(1); t.after(() => h.stop());
  h.render().submit();
  const ui = h.render();
  assert.equal(h.states[1], 4);
  assert.ok(ui.find(n => n.props['data-preview-label'] === '¡Vamos a celebrar!'));
  assert.equal(ui.nodes.some(n => n.type?.displayName === 'SectionQuickActions'), false);
  const inputs = ui.nodes.filter(n => typeof n.type === 'string' && n.type === 'input');
  assert.equal(inputs.some(n => n.props.type === 'file'), false);
});

test('creation and administrative examples prevent empty next steps and progress jumps, while valid location links allow continuing', async t=>{
 for (const options of [{ creation: true }, { creation: false, exampleId: 'example', exampleCreation: true }, { creation: false, exampleId: 'example' }]) {
 const h=setup(0,options);t.after(()=>h.stop());h.render();
 h.states[0]={...h.states[0],hostNames:' ',name:''};
 let ui=h.render();ui.submit();await h.flush();ui=h.render();
 assert.equal(h.states[1],0);
 assert.ok(ui.find(n=>n.props.errors?.['w-hosts']));
 ui.find(n=>n.props['aria-label']?.startsWith(`Paso ${options.creation || options.exampleCreation ? 5 : 4}:`)).props.onClick();assert.equal(h.states[1],0);
 h.states[0]={...h.states[0],name:'Mi celebración',hostNames:'Sofía',eventDate:'',eventTime:'',address:'',venue:''};
 h.render().submit();assert.equal(h.states[1],1);
 h.render().submit();await h.flush();assert.equal(h.states[1],1);
 h.states[0]={...h.states[0],eventDate:'2027-01-15',eventTime:'17:00',venue:'Salón',sections:h.states[0].sections.map(s=>s.type==='location'?{...s,link:'https://maps.app.goo.gl/location'}:s)};
 h.render().submit();assert.equal(h.states[1],4);
 const story=h.states[0].sections.find(s=>s.type==='story');
 h.states[0]={...h.states[0],sections:h.states[0].sections.map(s=>s.id===story.id?{...s,content:''}:s)};
 h.render().submit();assert.equal(h.states[1],4);assert.equal(h.states[2],story.id);
 }
});

test('gallery can be included from optional information blocks while photos are deferred to design', t => {
  const h=setup(4);t.after(()=>h.stop());h.states[2]='__more';
  let ui=h.render();
  const add=ui.find(n=>n.type==='button'&&n.props.children?.[0]?.props?.children==='Galería de fotos');
  assert.ok(add);add.props.onClick();ui=h.render();
  const gallery=h.states[0].sections.find(section=>section.type==='gallery');
  assert.equal(gallery.enabled,true);assert.equal(gallery.imageUrls.length,0);
  assert.equal(h.states[2],gallery.id);
  const fields=ui.find(n=>n.type?.displayName==='SectionFields');
  assert.equal(fields.props.deferGalleryPhotos,true);
  assert.equal(fields.props.section.id,gallery.id);
  assert.equal(ui.nodes.some(n=>n.type?.displayName==='SectionQuickActions'),false);
  ui.submit();assert.equal(h.states[2],'__more');
});

test('editing an existing administrative example only includes information and review', t => {
  const h = setup(1, { creation: false, exampleId: 'example' }); t.after(() => h.stop());
  let ui = h.render();
  assert.ok(ui.find(n => n.props['aria-label']?.includes('Paso 2 de 4')));
  ui.submit();
  assert.equal(h.states[1], 4);
  h.states[2] = '__more'; h.render().submit(); ui = h.render();
  assert.equal(h.states[1], 6);
  assert.ok(ui.find(n => n.props['aria-label']?.includes('Paso 4 de 4')));
  assert.equal(ui.find(n => n.props['aria-label'] === 'Editar diseño en una nueva pestaña'), undefined);
  assert.ok(ui.find(n => hasClass(n, 'guided-review')));
  assert.equal(ui.nodes.some(n => n.type?.displayName === 'InvitationPrivacyFields'), false);
});

test('new administrative examples traverse information before design and never offer customer payment', t => {
  const h = setup(1, { creation: false, exampleId: 'example', exampleCreation: true }); t.after(() => h.stop());
  let ui = h.render();
  assert.ok(ui.find(n => n.props['aria-label']?.includes('Paso 2 de 5')));
  ui.submit(); ui = h.render();
  assert.equal(h.states[1], 4);
  assert.equal(ui.nodes.some(n => n.type?.displayName === 'SectionQuickActions'), false);
  assert.equal(ui.find(n => n.props['aria-label'] === 'Editar diseño en una nueva pestaña'), undefined);
  h.states[2] = '__more'; h.render().submit(); ui = h.render();
  assert.equal(h.states[1], 5);
  assert.ok(ui.find(n => n.props['aria-label'] === 'Editar diseño en una nueva pestaña'));
  assert.equal(ui.find(n => hasClass(n, 'guided-review')), undefined);
  ui.submit(); ui = h.render();
  assert.equal(h.states[1], 6);
  assert.ok(ui.find(n => n.props['aria-label']?.includes('Paso 5 de 5')));
  assert.ok(ui.find(n => hasClass(n, 'guided-review')));
  assert.equal(ui.nodes.some(n => n.type?.displayName === 'InvitationPrivacyFields'), false);
  assert.equal(ui.find(n => n.props['aria-label'] === 'Guardar y continuar al pago'), undefined);
  assert.ok(ui.find(n => n.props.href === '/admin/disenos/example'));
});

test('example design handoff saves its draft and synchronizes visual edits back into administration', async t => {
  const h = setup(5, { creation: false, exampleId: 'example', exampleCreation: true }); t.after(() => h.stop());
  h.render();
  h.states[0] = { ...h.states[0], name: 'Ejemplo con información actualizada' };
  let ui = h.render();
  ui.find(n => n.props['aria-label'] === 'Editar diseño en una nueva pestaña').props.onClick(); await h.flush();
  assert.equal(h.calls, 1);
  const url = new URL(h.tab.location.href, 'http://localhost');
  assert.equal(url.pathname, '/admin/disenos/example/vista-previa');
  const { invitationPreviewKey, parseInvitationPreview, storeInvitationPreview } = h.load('lib/invitation-preview.ts');
  const token = url.searchParams.get('preview');
  const key = invitationPreviewKey(h.event.ownerId, h.event.id, token);
  const record = parseInvitationPreview(h.window.localStorage.getItem(key), h.event.ownerId, h.event.id);
  assert.equal(record.editorFlow, true);
  assert.equal(record.creationFlow, false);
  assert.equal(JSON.parse(record.snapshot).privacy, undefined);
  h.render();
  storeInvitationPreview(h.window.localStorage, { ...record, saved: true, version: 2, snapshot: JSON.stringify({ ...h.values, accent: '#123456', imageUrl: '/example-cover.jpg' }) }, token);
  h.tab.closed = true; h.intervals.at(-1)(); ui = h.render();
  assert.equal(h.states[0].accent, '#123456');
  assert.equal(h.states[0].imageUrl, '/example-cover.jpg');
  assert.equal(h.controller.getVersion(), 2);
  assert.equal(h.states[1], 5);
  assert.ok(ui.find(n => n.props['aria-label'] === 'Revisar ejemplo'));
  assert.deepEqual(h.redirects, []);
});

test('administrative visual sessions close back to the example editor and ordinary previews keep their return', async t => {
  const h = setup(5, { creation: false, exampleId: 'example' }); t.after(() => h.stop());
  const { InvitationPreviewSession } = h.load('components/dashboard/InvitationPreviewSession.tsx');
  const { storeInvitationPreview } = h.load('lib/invitation-preview.ts');
  const token = randomUUID();
  const returnLink = { href: '/admin/disenos/example/editar', title: 'Volver al editor', label: 'Editor' };
  const record = { ownerId: h.event.ownerId, eventId: h.event.id, creationKey: randomUUID(), snapshot: JSON.stringify(h.values), version: 0, privacyVersion: 0 };
  storeInvitationPreview(h.window.localStorage, { ...record, editorFlow: true, creationFlow: true }, token);
  const incoming = InvitationPreviewSession({ event: h.event, previewToken: token, returnLink });
  const show = incoming.type(incoming.props);
  assert.equal(show.props.returnLink.href, returnLink.href);
  show.props.onReturn(); await h.flush();
  assert.equal(h.closes, 1);
  assert.deepEqual(h.redirects, [returnLink.href]);
  storeInvitationPreview(h.window.localStorage, record, token);
  const ordinary = incoming.type(incoming.props);
  assert.equal(ordinary.props.onReturn, undefined);
  assert.deepEqual(ordinary.props.returnLink, returnLink);
});
