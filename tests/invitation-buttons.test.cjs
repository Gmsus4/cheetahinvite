/* eslint-disable @typescript-eslint/no-require-imports -- Load TypeScript helpers for the Node test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { defaultButtonAppearance, eventButtonAppearance, parseButtonAppearance } = require('../lib/invitation-buttons.ts');
test('existing invitations retain defined button defaults', () => {
  assert.deepEqual(eventButtonAppearance({}), defaultButtonAppearance);
  assert.deepEqual(parseButtonAppearance(new FormData()), defaultButtonAppearance);
});
test('all shape, background, border and icon combinations survive saving', () => {
  for (const shape of ['square', 'rounded', 'pill']) for (const filled of [true, false]) for (const icons of [true, false]) for (const border of [true, false]) for (const bold of [true, false]) {
    const form = new FormData();
    form.set('buttonShape', shape);
    form.set('buttonFilled', String(filled));
    form.set('buttonIcons', String(icons));
    form.set('buttonBorder', String(border));
    form.set('buttonBold', String(bold));
    assert.deepEqual(parseButtonAppearance(form), { shape, filled, icons, border, bold });
    assert.deepEqual(eventButtonAppearance({ buttonShape: shape, buttonFilled: filled, buttonIcons: icons, buttonBorder: border, buttonBold: bold }), { shape, filled, icons, border, bold });
  }
});
test('invalid appearance values cannot be persisted', () => {
  for (const [key, value] of [['buttonShape', 'unknown'], ['buttonFilled', 'yes'], ['buttonIcons', '0'], ['buttonBorder', 'maybe'], ['buttonBold', 'invalid']]) {
    const form = new FormData(); form.set(key, value);
    assert.equal(parseButtonAppearance(form), null);
  }
});
