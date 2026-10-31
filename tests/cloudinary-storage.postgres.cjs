/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in integration test with real PostgreSQL; Cloudinary is replaced. */
// Run explicitly: node tests/cloudinary-storage.postgres.cjs
// Creates a unique test account, verifies real row locks/transactions, then removes
// only that account's fixtures. Never uploads or deletes a provider asset.
require('dotenv/config');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(
  fs.readFileSync(file, 'utf8').replaceAll('import.meta.url', JSON.stringify(pathToFileURL(file).href)),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } },
).outputText, file);
let destroys = 0;
const load = Module._load;
Module._load = function(name, parent, isMain) {
  if (name === 'server-only') return {};
  if (name === 'next/server') return { after() {} };
  if (name.startsWith('@/')) {
    const result = load.call(this, path.resolve(__dirname, '..', name.slice(2)), parent, isMain);
    if (name === '@/lib/cloudinary') return { ...result, destroyCloudinaryImage: async () => { destroys++; }, destroyCloudinaryUploadVariants: async () => {} };
    return result;
  }
  return load.call(this, name, parent, isMain);
};
const { prisma } = require('../prisma.ts');
const storage = require('../lib/cloudinary-storage.ts');
const ownerId = `__storage_test_${randomUUID()}`;
const eventId = `__storage_test_${randomUUID()}`;

(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, name: 'Storage integration fixture' } });
    await prisma.event.create({ data: { id: eventId, ownerId, name: 'Storage integration fixture', eventType: 'wedding' } });
    // Use the storage boundary rather than a clock window: the test is valid even
    // when requests straddle an hour/day boundary on the real database.
    const existing = Array.from({ length: 19 }, () => ({ publicId: `cheetahinvite/${ownerId}/${eventId}/${randomUUID()}`, ownerId, eventId, bytes: 5 * 1024 * 1024, state: 'READY' }));
    await prisma.cloudinaryAsset.createMany({ data: existing });
    const simultaneous = await Promise.allSettled([
      storage.reserveCloudinaryImage(ownerId, eventId), storage.reserveCloudinaryImage(ownerId, eventId),
    ]);
    assert.equal(simultaneous.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(simultaneous.find(result => result.status === 'rejected').reason.status, 409);
    assert.equal(await prisma.cloudinaryAsset.count({ where: { ownerId } }), 20);
    assert.equal((await prisma.imageUploadBudget.findMany({ where: { ownerId } })).every(row => row.count === 1), true);
    await prisma.cloudinaryAsset.deleteMany({ where: { ownerId, publicId: { in: existing.map(row => row.publicId) } } });
    const asset = simultaneous.find(result => result.status === 'fulfilled').value;
    const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v123/${asset.publicId}.png`;
    await storage.finishCloudinaryImage(ownerId, eventId, asset.publicId, url, 100);
    await storage.withImageLock(ownerId, async tx => {
      const previous = await tx.event.findUnique({ where: { id: eventId } });
      await storage.syncCloudinaryImages(tx, ownerId, eventId, previous, { imageUrl: url });
      await tx.event.update({ where: { id: eventId }, data: { imageUrl: url } });
    });
    assert.equal((await prisma.cloudinaryAsset.findUnique({ where: { publicId: asset.publicId } })).expiresAt, null);
    await prisma.cloudinaryAsset.update({ where: { publicId: asset.publicId }, data: { expiresAt: new Date(0) } });
    assert.equal((await storage.runCloudinaryCleanup(ownerId)).retained, 1);
    assert.equal(destroys, 0);
    await storage.withImageLock(ownerId, async tx => {
      const previous = await tx.event.findUnique({ where: { id: eventId } });
      await storage.syncCloudinaryImages(tx, ownerId, eventId, previous, { imageUrl: '' });
      await tx.event.update({ where: { id: eventId }, data: { imageUrl: null } });
    });
    const results = await Promise.all([storage.runCloudinaryCleanup(ownerId), storage.runCloudinaryCleanup(ownerId)]);
    assert.equal(results.reduce((sum, result) => sum + result.deleted, 0), 1);
    assert.equal(destroys, 1);
    assert.equal(await prisma.cloudinaryAsset.count({ where: { ownerId } }), 0);
    console.log('PostgreSQL integration passed: concurrent quotas, saved references, SQL cleanup checks and single deletion claims.');
  } finally {
    assert.ok(ownerId.startsWith('__storage_test_'));
    await prisma.cloudinaryAsset.deleteMany({ where: { ownerId } });
    await prisma.imageUploadBudget.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => {
  console.error('PostgreSQL storage integration failed:', error instanceof assert.AssertionError ? error : error.name);
  process.exitCode = 1;
});
