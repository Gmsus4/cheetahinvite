/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in integration tooling, never imported by the application. */
module.exports = function loadPostgres(ownerId) {
  require('dotenv/config');
  const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), Module = require('node:module');
  const { pathToFileURL } = require('node:url');
  require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(
    fs.readFileSync(file, 'utf8').replaceAll('import.meta.url', JSON.stringify(pathToFileURL(file).href)),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } },
  ).outputText, file);
  const original = Module._load;
  Module._load = function(name, parent, isMain) {
    if (name === 'server-only') return {};
    if (name === 'next/server') return { after() {} };
    if (name === 'next/cache') return { revalidatePath() {} };
    if (name === '@/auth') return { auth: async () => ({ user: { id: ownerId } }) };
    if (name.startsWith('@/')) name = path.resolve(__dirname, '../..', name.slice(2));
    return original.call(this, name, parent, isMain);
  };
  return { prisma: require('../../prisma.ts').prisma };
};
