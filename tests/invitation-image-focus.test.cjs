/* eslint-disable @typescript-eslint/no-require-imports -- Exercise photo controls with isolated React state. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function fixture(component = 'InvitationMobileImageFocus', initial = 'mobile', root = null) {
  let device = initial;
  const effects = [];
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(`components/dashboard/${component}.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => {
    if (name === '@/lib/invitation-editor') return require('./helpers/cloudinary-fixture.cjs').createFixture().load('lib/invitation-editor.ts');
    if (name === 'react') return { ...React, useId: () => "photo-settings-test", useLayoutEffect: () => {}, useRef: () => ({ current: root }), useEffect: fn => effects.push(fn), useState: () => [device, value => { device = typeof value === 'function' ? value(device) : value; }] };
    if (name.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key });
    return require(name);
  }, mod, mod.exports);
  return { ...mod.exports, runEffects: () => effects.splice(0).map(fn => fn()) };
}

function nodes(tree) {
  return Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : [];
}

test('photo buttons update the preview and keep mobile and desktop framing independent', () => {
  const { InvitationImageFocusFields, InvitationMobileImageFocus } = fixture();
  let section = { id: 'story', type: 'story', imageUrl: '/photo.jpg', mobileImageFocus: 'top', desktopImageFocus: 'bottom' };
  const updates = [];
  const render = () => InvitationImageFocusFields({ section, onChange: patch => { updates.push(patch); section = { ...section, ...patch }; } });
  const control = tree => nodes(tree).find(node => node.type === InvitationMobileImageFocus);
  const image = tree => nodes(InvitationMobileImageFocus(control(tree).props)).find(node => node.props.src);
  const press = (tree, label) => nodes(InvitationMobileImageFocus(control(tree).props)).find(node => node.type === 'button' && node.props['aria-label'] === label).props.onClick();

  let tree = render();
  assert.equal(image(tree).props.src, '/photo.jpg');
  assert.equal(image(tree).props.style.objectPosition, 'center top');
  press(tree, 'Abajo derecha');
  tree = render();
  assert.deepEqual(updates.at(-1), { mobileImageFocus: 'bottom-right' });
  assert.equal(image(tree).props.style.objectPosition, 'right bottom');
  const preview = InvitationMobileImageFocus(control(tree).props);
  assert.equal(nodes(preview).filter(node => node.type === 'button').length, 9);
  assert.equal(nodes(preview).find(node => node.props['aria-pressed'] === true).props['aria-label'], 'Abajo derecha');

  nodes(tree).find(node => node.type === 'button' && node.props.children[1] === 'Escritorio').props.onClick();
  tree = render();
  assert.equal(control(tree).props.device, 'desktop');
  assert.equal(image(tree).props.style.objectPosition, 'center bottom');
  press(tree, 'Izquierda');
  assert.deepEqual(updates.at(-1), { desktopImageFocus: 'left' });
  tree = render();
  nodes(tree).find(node => node.type === 'button' && node.props.children[1] === 'Móvil').props.onClick();
  tree = render();
  assert.equal(image(tree).props.style.objectPosition, 'right bottom');
  assert.equal(section.desktopImageFocus, 'left');
});

test('cover and gallery controls use the actual uploaded image without changing the original framing on mount', () => {
  const { InvitationImageFocusFields, InvitationMobileImageFocus } = fixture();
  const updates = [];
  const cover = InvitationImageFocusFields({ section: { id: 'cover', type: 'cover', imageUrl: '' }, imageUrl: '/uploaded-cover.jpg', coverLayout: 'stacked', onChange: patch => updates.push(patch) });
  const control = nodes(cover).find(node => node.type === InvitationMobileImageFocus);
  const preview = InvitationMobileImageFocus(control.props);
  assert.equal(nodes(preview).find(node => node.props.src).props.src, '/uploaded-cover.jpg');
  assert.equal(nodes(preview).find(node => node.props.src).props.style.objectPosition, 'center 25%');
  assert.equal(nodes(preview).some(node => node.props['aria-pressed'] === true), false);
  assert.deepEqual(updates, []);
  const html = renderToStaticMarkup(preview);
  assert.match(html, /data-cover-layout="stacked"/);
  assert.match(html, /aria-label="Parte visible de la foto en móvil"/);
  assert.match(html, /Encuadre original/);

  const gallery = InvitationImageFocusFields({ section: { id: 'gallery', type: 'gallery', imageUrl: '/legacy.jpg', imageUrls: ['/first.jpg', '/second.jpg'] }, onChange() {} });
  const galleryControl = nodes(gallery).find(node => node.type === InvitationMobileImageFocus);
  assert.equal(galleryControl.props.imageUrl, '/first.jpg');
  assert.equal(nodes(InvitationMobileImageFocus(galleryControl.props)).find(node => node.props.src).props.style.objectPosition, 'center 35%');
  assert.match(renderToStaticMarkup(gallery), /todas las fotos de la galería/);
});

test('each overlaid direction remains a labelled button and emits its own focus value', () => {
  const { InvitationMobileImageFocus } = fixture();
  const changes = [];
  const tree = InvitationMobileImageFocus({ imageUrl: '/photo.jpg', value: 'center', onChange: value => changes.push(value) });
  const buttons = nodes(tree).filter(node => node.type === 'button');
  for (const button of buttons) {
    assert.equal(button.props.type, 'button');
    assert.ok(button.props['aria-label']);
    assert.ok(button.props.title);
    button.props.onClick();
  }
  assert.deepEqual(changes, ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right']);
});

test('on-photo framing opens without a dialog and updates only the chosen device', () => {
  const { InvitationPhotoFocusOverlay } = fixture('InvitationPhotoFocusOverlay', false);
  const updates = [];
  const props = { section: { id: 'photo', title: 'Historia', mobileImageFocus: 'top', desktopImageFocus: 'bottom' }, disabled: false, onChange: patch => updates.push(patch) };
  let tree = InvitationPhotoFocusOverlay(props);
  assert.equal(nodes(tree).filter(node => node.props.role === 'group').length, 0);
  nodes(tree).find(node => node.type === 'button').props.onClick();
  tree = InvitationPhotoFocusOverlay(props);
  assert.equal(nodes(tree).some(node => node.type === 'dialog'), false);
  const groups = nodes(tree).filter(node => node.props.role === 'group');
  assert.equal(groups.length, 2);
  nodes(groups[0]).find(node => node.props['aria-label'] === 'Derecha').props.onClick();
  nodes(groups[1]).find(node => node.props['aria-label'] === 'Izquierda').props.onClick();
  assert.deepEqual(updates, [{ mobileImageFocus: 'right' }, { desktopImageFocus: 'left' }]);
  assert.equal(nodes(InvitationPhotoFocusOverlay({ ...props, disabled: true })).some(node => node.props.role === 'group'), false);
});

test('photo shape and fit persist through saves and restore in the editor; invalid values are rejected', async () => {
 const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
 const f = createFixture();
 const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
 const base = { id:'story',type:'story',title:'Historia',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true };
 for (const photoShape of ['auto','square','landscape','original']) {
  for (const photoFit of ['cover','contain','fill','none','scale-down']) {
   const form = f.saveForm('', [{...base,photoShape,photoFit}]);
   assert.equal((await f.actions.updateEvent('event',form)).ok,true);
   const restored = initialGuidedValues(f.state.events.get('event')).sections.find(item => item.id === 'story');
   assert.equal(restored.photoShape,photoShape);
   assert.equal(restored.photoFit,photoFit);
  }
 }
 for (const invalid of [{photoShape:'circle'},{photoFit:'invalid'}]) {
  assert.equal((await f.actions.updateEvent('event',f.saveForm('',[{...base,...invalid}]))).code,'validation');
 }
});

test('on-photo format controls update the selected shape and fit without a modal', () => {
 const { InvitationPhotoFocusOverlay } = fixture('InvitationPhotoFocusOverlay',false);
 const updates=[];
 const tree=InvitationPhotoFocusOverlay({section:{id:'story',title:'Historia',photoShape:'square',photoFit:'contain'},mode:'settings',disabled:false,onChange:patch=>updates.push(patch)});
 const selects=nodes(tree).filter(node=>node.type==='select');
 assert.equal(selects[0].props.value,'square'); assert.equal(selects[1].props.value,'contain');
 selects[0].props.onChange({target:{value:'original'}});
 selects[1].props.onChange({target:{value:'scale-down'}});
 assert.deepEqual(updates,[{photoShape:'original'},{photoFit:'scale-down'}]);
 selects[0].props.onChange({target:{value:'bad'}}); assert.equal(updates.length,2);
});

test('framing temporarily makes photo tools and carousel inert and restores their previous state', () => {
 const controls=[{inert:false},{inert:true}];
 const root={parentElement:{querySelectorAll:()=>controls}};
 const {InvitationPhotoFocusOverlay,runEffects}=fixture('InvitationPhotoFocusOverlay',true,root);
 InvitationPhotoFocusOverlay({section:{id:'gallery',title:'Fotos'},disabled:false,onChange(){}});
 const cleanups=runEffects();
 assert.deepEqual(controls.map(item=>item.inert),[true,true]);
 cleanups.forEach(cleanup=>cleanup?.());
 assert.deepEqual(controls.map(item=>item.inert),[false,true]);
});

test('format icon targets a native popover, tracks opening and positions it within the viewport', () => {
 const anchor={style:{},scrollHeight:200,getBoundingClientRect:()=>({right:360,bottom:270})};
 const {InvitationPhotoFocusOverlay}=fixture('InvitationPhotoFocusOverlay',false,anchor);
 const props={mode:'settings',section:{id:'photo',title:'Foto'},disabled:false,onChange(){}};
 let tree=InvitationPhotoFocusOverlay(props);
 const button=nodes(tree).find(node=>node.type==='button');
 const panel=nodes(tree).find(node=>node.props.popover==='auto');
 assert.equal(button.props.popoverTarget,panel.props.id);
 assert.equal(button.props.type,'button');
 const previous=global.window;global.window={innerWidth:375,innerHeight:300};
 try {panel.props.onBeforeToggle({newState:'open'});} finally {if(previous===undefined)delete global.window;else global.window=previous;}
 assert.equal(anchor.style.left,'80px');assert.equal(anchor.style.top,'88px');
 panel.props.onToggle({newState:'open'});
 tree=InvitationPhotoFocusOverlay(props);
 assert.equal(nodes(tree).find(node=>node.type==='button').props['aria-expanded'],true);
 panel.props.onToggle({newState:'closed'});
 tree=InvitationPhotoFocusOverlay(props);
 assert.equal(nodes(tree).find(node=>node.type==='button').props['aria-expanded'],false);
});
