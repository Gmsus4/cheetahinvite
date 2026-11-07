/* eslint-disable @typescript-eslint/no-require-imports -- Run browser preference logic with isolated storage and media events. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function browser({ saved = null, dark = false, blockRead = false, blockWrite = false } = {}) {
  const storage = new Map();
  const key = 'cheetah-invite-theme';
  if (saved !== null) storage.set(key, saved);
  const media = new EventTarget();
  media.matches = dark;
  const window = new EventTarget();
  window.matchMedia = query => { assert.equal(query, '(prefers-color-scheme: dark)'); return media; };
  const document = { documentElement: { dataset: {} } };
  const localStorage = {
    getItem(key) { if (blockRead) throw new Error('Storage disabled'); return storage.get(key) ?? null; },
    setItem(key, value) { if (blockWrite) throw new Error('Storage full'); storage.set(key, value); },
  };
  const context = vm.createContext({ window, document, localStorage, Event });
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const mod = { exports: {} }; cache.set(absolute, mod);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(name => load(path.resolve(path.dirname(absolute), name + '.ts')), mod, mod.exports);
    return mod.exports;
  }
  const theme = load('lib/theme.ts');
  return {
    key, storage, document, theme, client: load('lib/theme-client.ts'),
    get effective() { return document.documentElement.dataset.theme; },
    initialize() { vm.runInContext(theme.themeInitializationScript, context); },
    system(value) { media.matches = value; media.dispatchEvent(new Event('change')); },
    anotherTab(value, eventKey = key) {
      if (value === null) storage.delete(eventKey); else storage.set(eventKey, value);
      const event = new Event('storage'); event.key = eventKey; window.dispatchEvent(event);
    },
  };
}

test('first paint respects saved choices and validates storage before applying a theme', () => {
  for (const dark of [false, true]) {
    for (const saved of [null, 'system', 'light', 'dark', 'invalid', '<script>']) {
      const b = browser({ dark, saved });
      b.initialize();
      assert.equal(b.effective, saved === 'light' || saved === 'dark' ? saved : dark ? 'dark' : 'light');
    }
  }
  const b = browser({ dark: true, blockRead: true });
  assert.doesNotThrow(() => b.initialize());
  assert.equal(b.effective, 'dark');
});

test('manual choices update the page and subscribers, persist, and survive system changes', t => {
  const b = browser();
  t.after(b.client.syncThemeWithBrowser());
  const notices = [];
  t.after(b.client.subscribeThemePreference(() => notices.push(b.client.readThemePreference())));
  b.client.setThemePreference('dark');
  assert.equal(b.effective, 'dark');
  assert.equal(b.storage.get(b.key), 'dark');
  b.system(true); b.system(false);
  assert.equal(b.effective, 'dark');
  b.client.setThemePreference('light');
  assert.equal(b.effective, 'light');
  assert.deepEqual(notices, ['dark', 'light']);
});

test('system mode follows live changes and stays selected after a previous explicit choice', t => {
  const b = browser({ saved: 'dark' });
  t.after(b.client.syncThemeWithBrowser());
  b.client.setThemePreference('system');
  assert.equal(b.effective, 'light');
  b.system(true);
  assert.equal(b.effective, 'dark');
  b.system(false);
  assert.equal(b.effective, 'light');
  assert.equal(b.storage.get(b.key), 'system');
});

test('another tab can change or remove the preference, while unrelated storage is ignored', t => {
  const b = browser({ saved: 'light', dark: true });
  t.after(b.client.syncThemeWithBrowser());
  b.anotherTab('dark', 'some-other-setting');
  assert.equal(b.effective, 'light');
  b.anotherTab('dark');
  assert.equal(b.effective, 'dark');
  b.anotherTab('light');
  assert.equal(b.effective, 'light');
  b.anotherTab(null);
  assert.equal(b.client.readThemePreference(), 'system');
  assert.equal(b.effective, 'dark');
});

test('blocked storage still allows choosing light, dark and system for the current session', t => {
  const b = browser({ blockRead: true, blockWrite: true });
  t.after(b.client.syncThemeWithBrowser());
  for (const value of ['dark', 'light', 'system']) {
    assert.doesNotThrow(() => b.client.setThemePreference(value));
    assert.equal(b.client.readThemePreference(), value);
    assert.equal(b.effective, value === 'dark' ? 'dark' : 'light');
  }
  b.system(true);
  assert.equal(b.effective, 'dark');
});

test('a failed write overrides an older readable preference instead of reverting the choice', t => {
  const b = browser({ saved: 'light', blockWrite: true });
  t.after(b.client.syncThemeWithBrowser());
  b.client.setThemePreference('dark');
  assert.equal(b.storage.get(b.key), 'light');
  assert.equal(b.client.readThemePreference(), 'dark');
  b.system(false);
  assert.equal(b.effective, 'dark');
});

test('unmounting removes browser listeners so remounts do not accumulate theme effects', () => {
  const b = browser();
  const stop = b.client.syncThemeWithBrowser();
  stop();
  b.system(true); b.anotherTab('dark');
  assert.equal(b.effective, 'light');
  const stopAgain = b.client.syncThemeWithBrowser();
  assert.equal(b.effective, 'dark');
  stopAgain();
});
