/* eslint-disable @typescript-eslint/no-require-imports -- Isolated service fixture for the Node test runner. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');

function matches(row, where = {}) {
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'OR') return expected.some(item => matches(row, item));
    if (key === 'AND') return expected.every(item => matches(row, item));
    const value = row[key];
    if (expected instanceof Date) return value?.getTime() === expected.getTime();
    if (expected && typeof expected === 'object') return Object.entries(expected).every(([op, target]) => {
      if (op === 'in') return target.includes(value);
      if (op === 'notIn') return !target.includes(value);
      if (value == null) return false;
      if (op === 'lte') return value <= target;
      if (op === 'gt') return value > target;
      if (op === 'gte') return value >= target;
      if (op === 'lt') return value < target;
      if (op === 'not') return value !== target;
      throw Error('Unsupported matcher: ' + op);
    });
    return (value ?? null) === expected;
  });
}

function createFixture() {
  const state = { users: new Map([['owner', { id: 'owner', invitationCount: 1 }]]), events: new Map([['event', { id: 'event', ownerId: 'owner', contentVersion: 0, status: 'DRAFT', paidAt: null, name: 'Celebración', imageUrl: '', sections: [] }]]), assets: new Map(), budgets: new Map() };
  const jobs = [], requests = [];
  let tail = Promise.resolve();
  const fixture = { state, jobs, requests, clientCalls: [], providerAssets: new Map(), owner: 'owner', failure: null, responseOverride: null, locks: 0,
    preset: { unsigned: false, settings: { allowed_formats: ['jpg', 'png', 'webp', 'avif'] } } };
  function table(name, primaryKey, defaults = {}) {
    const values = () => [...state[name].values()];
    function change(row, data) {
      for (const [key, value] of Object.entries(data)) row[key] = value?.increment ? (row[key] || 0) + value.increment : value?.decrement ? row[key] - value.decrement : value;
      row.updatedAt = new Date();
      return structuredClone(row);
    }
    const api = {
      async findMany({ where, orderBy, take } = {}) {
        const found = values().filter(row => matches(row, where));
        if (orderBy) { const [key, dir] = Object.entries(orderBy)[0]; found.sort((a, b) => (a[key] - b[key]) * (dir === 'asc' ? 1 : -1)); }
        return structuredClone(take ? found.slice(0, take) : found);
      },
      async findFirst({ where } = {}) { return structuredClone(values().find(row => matches(row, where)) ?? null); },
      async findUnique({ where }) { return api.findFirst({ where }); },
      async create({ data }) {
        if (state[name].has(data[primaryKey])) throw Object.assign(Error('Duplicate key'), { code: 'P2002' });
        const row = { ...defaults, createdAt: new Date(), updatedAt: new Date(), ...data };
        state[name].set(row[primaryKey], row);
        return structuredClone(row);
      },
      async createMany({ data, skipDuplicates }) {
        for (const row of data) if (!skipDuplicates || !state[name].has(row[primaryKey])) await api.create({ data: row });
      },
      async update({ where, data }) { const row = values().find(row => matches(row, where)); assert.ok(row, 'Row must exist'); return change(row, data); },
      async updateMany({ where, data }) { const found = values().filter(row => matches(row, where)); for (const row of found) change(row, data); return { count: found.length }; },
      async deleteMany({ where }) { const found = values().filter(row => matches(row, where)); for (const row of found) state[name].delete(row[primaryKey]); return { count: found.length }; },
      async upsert({ where, create, update }) { return values().some(row => matches(row, where)) ? api.update({ where, data: update }) : api.create({ data: create }); },
      async aggregate({ where }) { const found = values().filter(row => matches(row, where)); return { _count: found.length, _sum: { bytes: found.reduce((sum, row) => sum + row.bytes, 0) } }; },
    };
    return api;
  }
  const prisma = {
    event: table('events', 'id', { contentVersion: 0, status: 'DRAFT', paidAt: null }), user: table('users', 'id'),
    cloudinaryAsset: table('assets', 'publicId', { state: 'UPLOADING', expiresAt: null, nextAttemptAt: null, attempts: 0, url: null }),
    imageUploadBudget: table('budgets', 'key', { count: 1 }),
    async $queryRaw(query) {
      const sql = query.strings.join('?');
      if (sql.includes('FOR UPDATE')) { fixture.locks++; return state.users.has(query.values[0]) ? [{ id: query.values[0] }] : []; }
      assert.match(sql, /SELECT EXISTS/);
      return [{ used: [...state.events.values()].some(event => JSON.stringify([
        event.imageUrl, ...(event.sections ?? []).flatMap(section => [section.imageUrl, ...(section.imageUrls ?? [])]),
      ]).includes(query.values[0])) }];
    },
    async $transaction(work) {
      const previous = tail; let unlock; tail = new Promise(resolve => { unlock = resolve; }); await previous;
      const snapshot = structuredClone(state);
      try { return await work(prisma); }
      catch (error) { Object.assign(state, snapshot); throw error; }
      finally { unlock(); }
    },
  };
  const cache = new Map();
  fixture.load = function load(file) {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const mod = { exports: {} }; cache.set(absolute, mod);
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const requireMock = name => {
      if (name === 'server-only') return {};
      if (name === 'next/server') return { NextResponse: Response, after: job => jobs.push(job) };
      if (name === 'next/cache') return { revalidatePath() {} };
      if (name === 'next/navigation') return { redirect: url => { throw Object.assign(Error('redirect'), { url }); } };
      if (name === '@/auth') return { auth: async () => fixture.owner ? { user: { id: fixture.owner } } : null };
      if (name === '@/prisma') return { prisma };
      if (name === '@/generated/prisma/client') return { Prisma: { sql: (strings, ...values) => ({ strings, values }) } };
      if (name.startsWith('@/')) return load(path.resolve(name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), name) + '.ts');
      return require(name);
    };
    new Function('require', 'module', 'exports', 'fetch', source)(requireMock, mod, mod.exports, async (url, options = {}) => {
      if (url === '/api/cloudinary/upload') {
        fixture.clientCalls.push({ url, ...options });
        const response = await fixture.route[options.method](new Request('http://localhost' + url, { ...options, headers: { ...options.headers, origin: 'http://localhost' } }));
        if (options.method === 'PUT' && fixture.loseConfirmationResponse) { fixture.loseConfirmationResponse = false; throw new TypeError('Connection lost after confirmation'); }
        return response;
      }
      requests.push({ url, form: options.body, ...options });
      if (fixture.failure) throw Error(fixture.failure);
      if (url.includes('/upload_presets/')) return Response.json(fixture.preset);
      if (url.endsWith('/destroy')) return Response.json({ result: 'ok' });
      if (url.includes('/resources/image/upload/')) {
        const id = decodeURIComponent(url.split('/resources/image/upload/')[1]);
        return fixture.responseOverride ? fixture.responseOverride(id) : fixture.providerAssets.has(id) ? Response.json(fixture.providerAssets.get(id)) : Response.json({ error: 'Not found' }, { status: 404 });
      }
      assert.equal(url, 'https://api.cloudinary.com/v1_1/test/image/upload');
      const id = options.body.get('public_id');
      assert.equal(options.body.get('overwrite'), 'false');
      const uploaded = fixture.providerAssets.get(id) ?? { public_id: id, secure_url: fixture.url(id), version: 123, signature: fixture.signature(id), bytes: options.body.get('file').size, format: 'png', resource_type: 'image', type: 'upload' };
      fixture.providerAssets.set(id, uploaded);
      return Response.json(uploaded);
    });
    return mod.exports;
  };
  fixture.url = id => `https://res.cloudinary.com/test/image/upload/v123/${id}.png`;
  fixture.uploadRequest = (extras = {}, file = new File(['image'], 'photo.png', { type: 'image/png' })) => {
    return fixture.jsonRequest({ eventId: 'event', size: file.size, contentType: file.type, ...extras });
  };
  fixture.jsonRequest = (body, method = 'POST') => new Request('http://localhost/api/cloudinary/upload', { method,
    headers: { 'content-type': 'application/json', origin: 'http://localhost' }, body: JSON.stringify(body) });
  fixture.signature = (id, version = 123) => require('node:crypto').createHash('sha1').update(`public_id=${id}&version=${version}${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
  fixture.confirmRequest = (id, extras = {}) => fixture.jsonRequest({ eventId: 'event', publicId: id, version: 123, signature: fixture.signature(id), ...extras }, 'PUT');
  fixture.issue = async () => { const response = await fixture.route.POST(fixture.uploadRequest()); assert.equal(response.status, 200); return response.json(); };
  fixture.putProviderAsset = (id, extras = {}) => fixture.providerAssets.set(id, { public_id: id, secure_url: fixture.url(id), version: 123, bytes: 100, format: 'png', resource_type: 'image', type: 'upload', ...extras });
  fixture.addAsset = (overrides = {}) => {
    const id = overrides.publicId ?? `cheetahinvite/${overrides.ownerId ?? 'owner'}/${overrides.eventId ?? 'event'}/${require('node:crypto').randomUUID()}`;
    const asset = { publicId: id, ownerId: 'owner', eventId: 'event', url: fixture.url(id), bytes: 1024, state: 'READY', expiresAt: null, nextAttemptAt: null, attempts: 0, createdAt: new Date(), updatedAt: new Date(), ...overrides };
    state.assets.set(id, asset); return asset;
  };
  fixture.saveForm = (imageUrl = '', sections = []) => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ name: 'Celebración', eventType: 'wedding', sections: JSON.stringify(sections), imageUrl, contentVersion: String(state.events.get('event')?.contentVersion ?? 0) })) form.set(key, value);
    return form;
  };
  fixture.prisma = prisma;
  fixture.storage = fixture.load('lib/cloudinary-storage.ts');
  fixture.route = fixture.load('app/api/cloudinary/upload/route.ts');
  fixture.client = fixture.load('lib/cloudinary-upload.ts');
  fixture.actions = fixture.load('app/dashboard/eventos/[id]/actions.ts');
  return fixture;
}

module.exports = { createFixture };
