/* eslint-disable @typescript-eslint/no-require-imports -- Exercise calendar buttons and event handlers with isolated React hooks. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function nodes(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function calendar(value = '') {
  const f = { values: [], refs: [], changes: [], now: new Date('2026-11-17T18:00:00Z') };
  const dates = createFixture().load('lib/invitation-date.ts');
  let slot = 0, ref = 0;
  const mock = name => {
    if (name === 'react') return { ...React, useId: () => 'calendar', useSyncExternalStore: (_, snapshot) => snapshot(),
      useState(initial) { const index = slot++; if (!(index in f.values)) f.values[index] = initial; return [f.values[index], value => { f.values[index] = value; }]; },
      useRef() { const index = ref++; return f.refs[index] ||= { current: null }; },
    };
    if (name === '@/lib/invitation-date') return { invitationToday: () => dates.invitationToday(f.now), invitationDateIssue: value => dates.invitationDateIssue(value, f.now) };
    if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    return require(name);
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('components/dashboard/InvitationDateInput.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'exports', source)(mock, exports);
  f.render = () => { slot = 0; ref = 0; f.tree = exports.InvitationDateInput({ id: 'date', value, onValueChange: date => f.changes.push(date) }); };
  f.render();
  f.refs[0].current = { getBoundingClientRect: () => ({ left: 10, bottom: 100 }), focus() {} };
  f.refs[1].current = { hidePopover() {} };
  f.open = () => {
    const previous = global.window;
    global.window = { innerWidth: 390, innerHeight: 830 };
    try { nodes(f.tree, node => node.props?.id === 'date')[0].props.onClick(); f.render(); } finally { global.window = previous; }
  };
  f.day = key => nodes(f.tree, node => node.props?.['data-date'] === key)[0];
  f.button = label => nodes(f.tree, node => node.props?.['aria-label'] === label)[0];
  return f;
}

test('calendar disables every past day, allows today and blocks navigation into past months', () => {
  const f = calendar('2026-11-11'); f.open();
  const days = nodes(f.tree, node => node.props?.['data-date']);
  assert.equal(days.length, 42);
  for (const day of days) assert.equal(day.props.disabled, day.props['data-date'] < '2026-11-17');
  assert.equal(f.day('2026-11-11').props.disabled, true);
  assert.equal(f.day('2026-11-17').props.disabled, false);
  assert.equal(f.button('Mes anterior').props.disabled, true);
  f.day('2026-11-11').props.onClick(); assert.deepEqual(f.changes, []);
  f.day('2026-11-17').props.onClick(); assert.deepEqual(f.changes, ['2026-11-17']);
});

test('calendar supports future months and selected future dates', () => {
  const f = calendar('2027-01-15'); f.open();
  assert.equal(f.day('2027-01-15').props['aria-pressed'], true);
  assert.equal(f.button('Mes anterior').props.disabled, false);
  f.button('Mes siguiente').props.onClick(); f.render();
  assert.ok(f.day('2027-02-15'));
  f.day('2027-02-15').props.onClick(); assert.deepEqual(f.changes, ['2027-02-15']);
});

test('a calendar left open across midnight cannot select yesterday', () => {
  const f = calendar(); f.open();
  f.now = new Date('2026-11-18T06:00:00Z');
  f.day('2026-11-17').props.onClick(); f.render();
  assert.deepEqual(f.changes, []);
  assert.equal(f.day('2026-11-17').props.disabled, true);
  assert.equal(f.day('2026-11-18').props.disabled, false);
});
