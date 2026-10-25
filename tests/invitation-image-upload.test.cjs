/* eslint-disable @typescript-eslint/no-require-imports -- Compile the route with isolated service mocks. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('app/api/cloudinary/upload/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function route(owner = true) {
  let uploads = 0;
  const mod = { exports: {} };
  const mockRequire = (name) => {
    if (name === 'node:crypto') return require(name);
    if (name === 'next/server') return { NextResponse: Response };
    if (name === '@/auth') return { auth: async () => ({ user: { id: 'owner' } }) };
    if (name === '@/lib/limits') return { ACCOUNT_LIMITS: { imagesPerGallery: 12, imageSizeBytes: 5 * 1024 * 1024 } };
    if (name === '@/prisma') return { prisma: { event: { findFirst: async () => owner ? { id: 'event', imageUploads: 12 } : null } } };
    throw new Error(name);
  };
  new Function('require', 'module', 'exports', 'process', 'fetch', source)(mockRequire, mod, mod.exports,
    { env: { CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'test', CLOUDINARY_API_SECRET: 'test', CLOUDINARY_UPLOAD_PRESET: 'test' } },
    async () => { uploads++; return Response.json({ secure_url: 'https://example.com/image/upload/photo.jpg' }); });
  return { post: mod.exports.POST, uploads: () => uploads };
}
function request(count, scope = "gallery") {
  const body = new FormData();
  body.set('eventId', 'event');
  body.set('imageScope', scope);
  body.set('file', new File(['image'], 'photo.jpg', { type: 'image/jpeg' }));
  if (count !== undefined) body.set('activeImageCount', String(count));
  return new Request('http://localhost/api/cloudinary/upload', { method: 'POST', body });
}
test('historical uploads do not block an emptied gallery', async () => {
  const api = route();
  assert.equal((await api.post(request(0))).status, 200);
  assert.equal(api.uploads(), 1);
});
test('the last slot can be filled or used for a replacement at capacity', async () => {
  const api = route();
  assert.equal((await api.post(request(11))).status, 200);
});
test('a full draft is rejected before uploading', async () => {
  const api = route();
  assert.equal((await api.post(request(12))).status, 409);
  assert.equal(api.uploads(), 0);
});
test('invalid counts and another owner cannot upload', async () => {
  const api = route();
  for (const count of [undefined, -1, 'invalid']) assert.equal((await api.post(request(count))).status, 400);
  const other = route(false);
  assert.equal((await other.post(request(0))).status, 404);
  assert.equal(other.uploads(), 0);
});

test('cover and other section uploads are independent of a full gallery', async () => {
  const api = route();
  assert.equal((await api.post(request(12, 'single'))).status, 200);
  assert.equal(api.uploads(), 1);
});
