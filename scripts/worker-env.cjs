/* eslint-disable @typescript-eslint/no-require-imports -- Keep local runtime secrets out of deployment artifacts. */
const fs = require('node:fs');
const path = require('node:path');
const modes = ['production', 'development', 'test'];

function readWorkerEnv(outputDir) {
  const file = path.join(outputDir, 'cloudflare', 'next-env.mjs');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(line => line.trim());
  const result = {};
  for (const line of lines) {
    const match = /^export const (production|development|test) = (.+);$/.exec(line);
    if (!match || result[match[1]]) throw Error('Unexpected OpenNext environment module; refusing deployment');
    const values = JSON.parse(match[2]);
    if (!values || Array.isArray(values) || typeof values !== 'object' || Object.values(values).some(value => typeof value !== 'string')) {
      throw Error('Invalid OpenNext environment module; refusing deployment');
    }
    result[match[1]] = values;
  }
  if (modes.some(mode => !result[mode])) throw Error('Missing OpenNext environment mode; refusing deployment');
  return { file, values: result };
}

function functionEnvFiles(outputDir) {
  const directory = path.join(outputDir, 'server-functions');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory())
    .flatMap(entry => {
      const root = path.join(directory, entry.name);
      return fs.readdirSync(root, { withFileTypes: true })
        .filter(file => file.isFile() && /^\.env(?:\.|$)/.test(file.name))
        .map(file => path.join(root, file.name));
    });
}

function sanitizeWorkerEnv(outputDir = path.resolve('.open-next')) {
  const { file, values } = readWorkerEnv(outputDir);
  let removed = 0;
  const content = modes.map(mode => {
    const entries = Object.entries(values[mode]);
    const publicValues = Object.fromEntries(entries.filter(([key]) => key.startsWith('NEXT_PUBLIC_')));
    removed += entries.length - Object.keys(publicValues).length;
    return `export const ${mode} = ${JSON.stringify(publicValues)};\n`;
  }).join('');
  fs.writeFileSync(file, content);
  // These copies belong to generated function roots, never the source .env.
  for (const copy of functionEnvFiles(outputDir)) fs.unlinkSync(copy);
  assertWorkerEnvIsPublic(outputDir);
  return removed;
}

function assertWorkerEnvIsPublic(outputDir = path.resolve('.open-next')) {
  const { values } = readWorkerEnv(outputDir);
  if (modes.some(mode => Object.keys(values[mode]).some(key => !key.startsWith('NEXT_PUBLIC_'))) || functionEnvFiles(outputDir).length) {
    throw Error('Local runtime variables remain in the Worker artifact; run npm run build:workers');
  }
}

module.exports = { sanitizeWorkerEnv, assertWorkerEnvIsPublic };
if (require.main === module) {
  console.log(`Removed ${sanitizeWorkerEnv()} local runtime variable entries from the generated Worker; runtime values use Cloudflare bindings and secrets.`);
}
