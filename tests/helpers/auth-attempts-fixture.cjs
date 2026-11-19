/* eslint-disable @typescript-eslint/no-require-imports -- Load real auth handlers with isolated dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function createAuthFixture(options = {}) {
  const cache = new Map();
  const f = { budgets: new Map(), users: new Map(), hashes: 0, verifications: 0, lookups: 0, creates: 0,
    now: Date.now(), storageFailure: false, messages: [], ...options };
  const prisma = f.prisma ?? {
    authAttemptBudget: {
      deleteMany: async ({ where }) => {
        if (f.storageFailure) throw Error('Storage unavailable');
        for (const [key, row] of f.budgets) if (row.expiresAt <= where.expiresAt.lte) f.budgets.delete(key);
      },
      upsert: async ({ where, create }) => {
        if (f.storageFailure) throw Error('Storage unavailable');
        const previous = f.budgets.get(where.key);
        const row = previous ? { ...previous, count: previous.count + 1 } : { ...create, count: 1 };
        f.budgets.set(where.key, row);
        return { ...row };
      },
    },
    user: {
      create: async ({ data }) => {
        f.creates++;
        if (f.users.has(data.email)) throw Object.assign(Error('Duplicate'), { code: 'P2002' });
        const user = { id: data.email, sessionVersion: 0, ...data };
        f.users.set(data.email, user);
        return user;
      },
      findUnique: async ({ where }) => { f.lookups++; return f.users.get(where.email) ?? null; },
    },
  };
  f.prisma = prisma;
  f.load = file => {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const mod = { exports: {} }; cache.set(absolute, mod);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    function requireMock(name) {
      if (name === 'server-only') return {};
      if (name === '@/prisma') return { prisma };
      if (name === 'next/server') return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name === 'next-auth') return {
        __esModule: true,
        default: config => { f.config = config; return {}; },
        CredentialsSignin: class CredentialsSignin extends Error {},
      };
      if (name === '@auth/prisma-adapter') return { PrismaAdapter: () => ({}) };
      if (name === 'next-auth/providers/credentials') return config => config;
      if (name === 'next-auth/providers/google') return {};
      if (name === '@/lib/password') return {
        hashPassword: async () => { f.hashes++; return 'fixture-hash'; },
        verifyPassword: async password => { f.verifications++; return password === 'correct-password'; },
      };
      if (name.startsWith('@/')) return f.load(`${name.slice(2)}.ts`);
      return require(name);
    }
    class Clock extends Date {
      constructor(...args) { super(...(args.length ? args : [f.now])); }
      static now() { return f.now; }
    }
    new Function('require', 'module', 'exports', 'Date', code)(requireMock, mod, mod.exports, Clock);
    return mod.exports;
  };
  f.load('auth.ts');
  f.register = f.load('app/api/register/route.ts').POST;
  f.limits = f.load('lib/auth-attempts.ts');
  f.request = (body, address = '192.0.2.1', headers = {}) => new Request('https://site.test/api/register', {
    method: 'POST', headers: { ...(address ? { 'cf-connecting-ip': address } : {}), ...headers }, body: JSON.stringify(body),
  });
  f.login = (email = 'user@example.invalid', password = 'wrong-password', address = '192.0.2.1') =>
    f.config.providers[1].authorize({ email, password }, f.request({}, address));
  return f;
}

module.exports = { createAuthFixture };
