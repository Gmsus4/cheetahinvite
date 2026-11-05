/* eslint-disable @typescript-eslint/no-require-imports -- Verify real bundled resources without starting a server. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

test('public assets have no missing references or unused bundled files after retiring the collections', () => {
  const root = path.resolve(__dirname, '..');
  const source = ['app', 'components', 'lib'].flatMap(directory => filesIn(path.join(root, directory)))
    .filter(file => /\.(?:tsx?|css)$/.test(file)).map(file => fs.readFileSync(file, 'utf8')).join('\n');
  const referenced = new Set([...source.matchAll(/["'(](\/[\w/-]+\.(?:webp|png|jpe?g|svg|ico|avif))/g)].map(match => match[1]));
  for (const match of source.matchAll(/["']@\/public(\/[\w/-]+\.(?:webp|png|jpe?g|svg|ico|avif))/g)) referenced.add(match[1]);
  for (const reference of referenced) assert.ok(fs.existsSync(path.join(root, 'public', reference)), `Missing asset: ${reference}`);
  const { landingEventExamples } = createFixture().load('lib/landing-invitation-example.ts');
  const manualFolders = new Set(landingEventExamples.map(example => example.imageFolder));
  for (const file of filesIn(path.join(root, 'public'))) {
    const reference = '/' + path.relative(path.join(root, 'public'), file).split(path.sep).join('/');
    const folder = reference.slice(0, reference.lastIndexOf('/'));
    const manual = manualFolders.has(folder) && /\/(?:fondo|principal|historia|lugar|programa|familias|galeria-(?:[1-9]|1[0-2]))\.(?:webp|jpe?g|png|avif)$/.test(reference);
    assert.ok(referenced.has(reference) || manual, `Unused public asset: ${reference}`);
  }
});
