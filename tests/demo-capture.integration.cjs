/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in, read-only check against a running app and its configured database. */
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');
require('dotenv').config({ quiet: true });

async function main() {
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET || !process.env.APP_URL) throw new Error('Configure DATABASE_URL, AUTH_SECRET and APP_URL, then start the app');
  const f = createFixture();
  const pool = new Pool({ connectionString: f.load('postgres-url.ts').useExplicitSslMode(process.env.DATABASE_URL), connectionTimeoutMillis: 10_000 });
  try {
    const { rows } = await pool.query('SELECT e.*, s.id AS "exampleId" FROM "ShowcaseExample" s JOIN "Event" e ON e.id=s."eventId" WHERE s."publishedAt" IS NOT NULL ORDER BY s.position LIMIT 1');
    if (!rows.length) throw new Error('Publish at least one example before this read-only check');
    const event = rows[0];
    const invitation = f.load('lib/showcase.ts').showcaseContent(event);
    const capture = await f.load('lib/demo-capture.ts').captureDemoPreview(event.exampleId, event.contentVersion, invitation);
    const image = Buffer.from(capture.webp, 'base64');
    const info = await require('sharp')(image).metadata();
    assert.equal(info.width, 390); assert.equal(info.height, 830); assert.equal(info.format, 'webp');
    const stats = await require('sharp')(image).stats();
    assert.ok(stats.channels.some(channel => channel.stdev > 5), 'The capture must contain visible invitation content, not a blank screen');
    assert.equal(capture.contentKey, f.load('lib/demo-preview.ts').demoPreviewKey(invitation));
    const output = path.join(os.tmpdir(), 'cheetahinvite-automatic-demo-capture.webp');
    await fs.writeFile(output, image);
    console.log(JSON.stringify({ width: info.width, height: info.height, format: info.format, bytes: image.length, databaseChanges: 0, output }));
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
