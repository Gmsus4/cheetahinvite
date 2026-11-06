/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

test('hero copies retain all content and use small assets without changing full invitations', () => {
  const fixture = createFixture();
  const { landingEventExamples } = fixture.load('lib/landing-invitation-example.ts');
  const { exampleWithImages } = fixture.load('lib/invitation-example-images.ts');
  const { heroExampleWithImages } = fixture.load('lib/hero-invitation-example.ts');
  for (const example of landingEventExamples) {
    const full = exampleWithImages(example);
    const original = structuredClone(full);
    const preview = heroExampleWithImages(example);
    assert.equal(preview.hostNames, full.hostNames);
    assert.equal(preview.sections.length, full.sections.length);
    const images = data => [data.imageUrl, data.backgroundImageUrl, ...data.sections.flatMap(section => [section.imageUrl, ...(section.imageUrls ?? [])])].filter(Boolean);
    assert.equal(images(preview).length, images(full).length);
    for (const url of images(preview)) assert.ok(url.startsWith('/hero-preview/'), url);
    assert.deepEqual(exampleWithImages(example), original);
  }
});

test('hero images are WebP, at most 640px wide, and save at least 90 percent overall', async () => {
  const { heroPreviewImages } = createFixture().load('lib/hero-preview-images.ts');
  let originalBytes = 0;
  let previewBytes = 0;
  for (const [original, preview] of Object.entries(heroPreviewImages)) {
    const source = path.join('public', original);
    const output = path.join('public', preview);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, 'webp');
    assert.ok(metadata.width <= 640 && metadata.height <= 1280);
    originalBytes += fs.statSync(source).size;
    previewBytes += fs.statSync(output).size;
  }
  assert.ok(originalBytes > 0);
  assert.ok(previewBytes < originalBytes * 0.1);
});
