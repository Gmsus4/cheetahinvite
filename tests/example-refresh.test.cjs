/* eslint-disable @typescript-eslint/no-require-imports -- Verify tab-return events without a browser or database. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('returning from design editing refreshes publication revisions once and cleans up listeners', () => {
  const effects = [], frames = new Map(), windowEvents = new Map(), documentEvents = new Map();
  let refreshed = 0, nextFrame = 0;
  const router = { refresh() { refreshed++; } };
  const window = {
    addEventListener: (name, handler) => windowEvents.set(name, handler),
    removeEventListener: (name, handler) => { if (windowEvents.get(name) === handler) windowEvents.delete(name); },
    requestAnimationFrame: handler => { frames.set(++nextFrame, handler); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const document = {
    visibilityState: 'visible',
    addEventListener: (name, handler) => documentEvents.set(name, handler),
    removeEventListener: (name, handler) => { if (documentEvents.get(name) === handler) documentEvents.delete(name); },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('components/admin/ExampleRefreshOnReturn.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const requireMock = name => {
    if (name === 'react') return { useEffect: effect => effects.push(effect) };
    if (name === 'next/navigation') return { useRouter: () => router };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', 'window', 'document', code)(requireMock, mod, mod.exports, window, document);
  assert.equal(mod.exports.ExampleRefreshOnReturn(), null);
  const cleanup = effects[0]();
  assert.equal(refreshed, 0);
  document.visibilityState = 'hidden';
  documentEvents.get('visibilitychange')();
  windowEvents.get('focus')();
  assert.equal(frames.size, 0);
  document.visibilityState = 'visible';
  documentEvents.get('visibilitychange')();
  windowEvents.get('focus')();
  assert.equal(frames.size, 1);
  const pending = [...frames.values()]; frames.clear(); pending.forEach(frame => frame());
  assert.equal(refreshed, 1);
  windowEvents.get('focus')();
  assert.equal(frames.size, 1);
  cleanup();
  assert.equal(frames.size, 0);
  assert.equal(windowEvents.size, 0);
  assert.equal(documentEvents.size, 0);
});
