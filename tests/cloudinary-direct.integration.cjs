/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in integration with isolated fixtures and real Cloudinary. */
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const sharp = require('sharp');
const ownerId = `__direct_upload_test_${randomUUID()}`;
const { prisma } = require('./helpers/postgres-loader.cjs')(ownerId);
const { POST, PUT } = require('../app/api/cloudinary/upload/route.ts');
const { uploadInvitationImage } = require('../lib/cloudinary-upload.ts');
const { destroyCloudinaryImage, destroyCloudinaryUploadVariants, signedCloudinaryFields } = require('../lib/cloudinary.ts');
const { ACCOUNT_LIMITS } = require('../lib/limits.ts');
const actualFetch = globalThis.fetch;
const localRequests = [];
let eventId;

async function syntheticPng(width) {
  return sharp(randomBytes(width * width * 3), { raw: { width, height: width, channels: 3 } }).png({ compressionLevel: 0 }).toBuffer();
}
function metadataRequest(body, method = 'POST') {
  return new Request('http://localhost/api/cloudinary/upload', { method, headers: { 'content-type': 'application/json', origin: 'http://localhost' }, body: JSON.stringify(body) });
}

(async () => {
  try {
    await prisma.user.create({ data: { id: ownerId, name: 'Direct upload integration fixture', invitationCount: 1 } });
    eventId = (await prisma.event.create({ data: { ownerId, name: 'Direct upload integration fixture', eventType: 'birthday' } })).id;
    globalThis.fetch = async (url, options) => {
      if (url === '/api/cloudinary/upload') {
        assert.equal(typeof options.body, 'string');
        assert.ok(Buffer.byteLength(options.body) < 4096);
        localRequests.push({ method: options.method, bytes: Buffer.byteLength(options.body) });
        return (options.method === 'PUT' ? PUT : POST)(metadataRequest(JSON.parse(options.body), options.method));
      }
      return actualFetch(url, options);
    };
    const bytes = await syntheticPng(1300);
    assert.ok(bytes.length > 4_500_000 && bytes.length <= ACCOUNT_LIMITS.imageSizeBytes);
    const url = await uploadInvitationImage(new File([bytes], 'synthetic.png', { type: 'image/png' }), eventId);
    const [asset] = await prisma.cloudinaryAsset.findMany({ where: { ownerId } });
    assert.equal(asset.state, 'READY');
    assert.equal(asset.bytes, bytes.length);
    assert.equal(asset.url, url);
    assert.ok(asset.nextAttemptAt > new Date());
    const again = await PUT(metadataRequest({ eventId, publicId: asset.publicId, version: Number(url.match(/\/v(\d+)\//)[1]),
      signature: signedCloudinaryFields({ public_id: asset.publicId, version: url.match(/\/v(\d+)\//)[1] }).signature }, 'PUT'));
    assert.equal(again.status, 200);
    assert.equal((await again.json()).secureUrl, url);
    const oversized = await syntheticPng(1350);
    assert.ok(oversized.length > ACCOUNT_LIMITS.imageSizeBytes);
    const authorization = await POST(metadataRequest({ eventId, size: 100, contentType: 'image/png' }));
    assert.equal(authorization.status, 200);
    const grant = await authorization.json();
    const form = new FormData();
    for (const [key, value] of Object.entries(grant.fields)) form.set(key, value);
    form.set('file', new File([oversized], 'oversized.png', { type: 'image/png' }));
    const upload = await actualFetch(grant.uploadUrl, { method: 'POST', body: form, signal: AbortSignal.timeout(90_000) });
    assert.equal(upload.status, 400);
    const pending = await prisma.cloudinaryAsset.findUnique({ where: { publicId: grant.publicId } });
    assert.equal(pending.state, 'UPLOADING');
    assert.equal(pending.bytes, ACCOUNT_LIMITS.imageSizeBytes);
    console.log(JSON.stringify({ passed: true, directImageBytes: bytes.length, serverRequests: localRequests, oversizedRejectedBytes: oversized.length }));
  } finally {
    globalThis.fetch = actualFetch;
    assert.ok(ownerId.startsWith('__direct_upload_test_'));
    for (const asset of await prisma.cloudinaryAsset.findMany({ where: { ownerId } })) {
      assert.ok(asset.publicId.startsWith(`cheetahinvite/${ownerId}/`));
      // Test signatures were never exposed to users; clean only this fixture.
      await Promise.all([destroyCloudinaryImage(asset.publicId), destroyCloudinaryUploadVariants(asset.publicId)]);
      await prisma.cloudinaryAsset.deleteMany({ where: { publicId: asset.publicId, ownerId } });
    }
    await prisma.imageUploadBudget.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error : error.name); process.exitCode = 1; });
