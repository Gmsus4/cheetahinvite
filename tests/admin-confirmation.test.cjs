/* eslint-disable @typescript-eslint/no-require-imports -- Exercise the actual submit handlers without making administrative changes. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript'), React = require('react');

function fixture(options = {}) {
  const f = { pending: false, valid: true, confirming: false, submits: [], effects: [], refs: new Map(), ...options };
  const document = { body: { style: { overflow: 'auto' } } };
  f.document = document;
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('components/admin/AdminSubmit.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  let index = 0, scope = 'submit';
  function requireMock(name) {
    if (name === 'react') return { ...React, useId: () => 'confirmation-test', useState: () => [f.confirming, value => { f.confirming = value; }],
      useRef(initial) { const key = `${scope}:${index++}`; if (!f.refs.has(key)) f.refs.set(key, { current: initial }); return f.refs.get(key); },
      useEffect: effect => f.effects.push(effect),
    };
    if (name === 'react-dom') return { useFormStatus: () => ({ pending: f.pending }), createPortal: child => React.createElement('test-portal', null, child) };
    if (name.endsWith('.css')) return { default: {} };
    return require(name);
  }
  new Function('require', 'module', 'exports', 'document', code)(requireMock, mod, mod.exports, document);
  f.form = { reportValidity: () => f.valid, requestSubmit: submitter => f.submits.push(submitter) };
  f.render = (props = {}) => {
    scope = 'submit'; index = 0;
    const result = mod.exports.AdminSubmit({ children: 'Otorgar cortesía', confirmMessage: 'Publicación sin cobro.', ...props });
    f.button = result.props.children[0];
    f.button.props.ref.current = { form: f.form };
    f.portal = result.props.children[1];
    return result;
  };
  f.click = () => { const event = { currentTarget: { form: f.form }, prevented: false, preventDefault() { this.prevented = true; } }; f.button.props.onClick(event); return event; };
  f.modal = () => { f.render(); scope = 'modal'; index = 0; const child = f.portal.props.children; return child.type(child.props); };
  f.render();
  return f;
}

test('administrative confirmations validate first and do not submit when opened or canceled', () => {
  const f = fixture({ valid: false });
  assert.equal(f.click().prevented, true); assert.equal(f.confirming, false); assert.equal(f.submits.length, 0);
  f.valid = true; f.click();
  assert.equal(f.confirming, true); assert.equal(f.submits.length, 0);
  const dialog = f.modal();
  let prevented = false;
  dialog.props.onCancel({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(f.confirming, false); assert.equal(f.submits.length, 0);
});

test('confirmation submits the original form exactly once and respects pending actions', () => {
  const f = fixture(); f.click(); f.render();
  const onConfirm = f.portal.props.children.props.onConfirm;
  onConfirm(); onConfirm();
  assert.equal(f.submits.length, 1); assert.equal(f.submits[0], f.button.props.ref.current);
  assert.equal(f.confirming, false);
  f.pending = true; f.render(); assert.equal(f.button.props.disabled, true);
  onConfirm(); assert.equal(f.submits.length, 1);
});

test('dialog opens modally, restores scrolling on close and includes accessible labels', () => {
  const f = fixture(); f.click(); const dialog = f.modal();
  let opened = 0, closed = 0;
  dialog.props.ref.current = { showModal() { opened++; }, close() { closed++; } };
  const cleanup = f.effects[0]();
  assert.equal(opened, 1);
  assert.equal(f.document.body.style.overflow, 'hidden');
  assert.equal(dialog.type, 'dialog');
  assert.equal(dialog.props['aria-labelledby'], 'confirmation-test-title');
  assert.equal(dialog.props['aria-describedby'], 'confirmation-test-description');
  const content = dialog.props.children;
  const actions = content.props.children.at(-1);
  assert.equal(actions.props.children[0].props.autoFocus, true);
  cleanup(); assert.equal(closed, 1);
  assert.equal(f.document.body.style.overflow, 'auto');
});

test('ordinary submit buttons preserve normal form submission without showing a modal', () => {
  const f = fixture(); f.render({ confirmMessage: undefined });
  assert.equal(f.button.props.type, 'submit');
  assert.equal(f.button.props['aria-haspopup'], undefined);
  assert.equal(f.click().prevented, false); assert.equal(f.confirming, false);
});
