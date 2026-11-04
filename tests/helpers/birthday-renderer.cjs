/* eslint-disable @typescript-eslint/no-require-imports -- Load real TSX components in Node's test runner. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

function loadBirthdayComponent(name, fixture, hooks) {
  const filename = path.resolve('components/invitation', `${name}.tsx`);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exported = {};
  const load = dependency => {
    if (dependency === 'react' && hooks) return hooks;
    if (dependency === 'next/image') return { __esModule: true, default: props => {
      const clean = { ...props };
      delete clean.unoptimized;
      return React.createElement('img', clean);
    } };
    if (dependency === '@/lib/invitation-links') return fixture.load('lib/invitation-links.ts');
    if (dependency === '@/lib/birthday-gamer') return fixture.load('lib/birthday-gamer.ts');
    if (dependency === './BirthdayGallery') return loadBirthdayComponent('BirthdayGallery', fixture);
    if (dependency === './RsvpForm') return { RsvpForm: ({ eventId }) => React.createElement('form', { 'data-event-id': eventId }) };
    if (dependency === './CountdownTimer') return { CountdownTimer: () => React.createElement('time') };
    return require(dependency);
  };
  new Function('require', 'exports', source)(load, exported);
  return exported;
}

module.exports = { loadBirthdayComponent };
