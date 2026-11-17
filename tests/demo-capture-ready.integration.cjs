/* eslint-disable @typescript-eslint/no-require-imports -- Opt-in real-browser regression; no database or running app required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

async function main() {
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/chromium',
  ].find(file => fs.existsSync(file));
  assert.ok(executablePath, 'Configure CHROMIUM_EXECUTABLE_PATH');
  const browser = await require('puppeteer-core').launch({ headless: true, executablePath, defaultViewport: { width: 390, height: 830 } });
  try {
    const page = await browser.newPage();
    const key = 'a'.repeat(24);
    await page.setContent(`<div hidden><main data-preview-key="${key}"><img width="390" height="830"></main></div>`);
    // As with streamed Suspense, the element exists but is not painted yet.
    await page.waitForSelector(`main[data-preview-key="${key}"]`);
    const pending = createFixture().load('lib/demo-capture.ts').waitForDemoCapture(page, key);
    let ready = false;
    pending.then(() => { ready = true; });
    await new Promise(resolve => setTimeout(resolve, 200));
    assert.equal(ready, false, 'Must wait for the streamed container to become visible');
    await page.evaluate(() => { document.querySelector('[hidden]').hidden = false; });
    await new Promise(resolve => setTimeout(resolve, 200));
    assert.equal(ready, false, 'Must wait for the newly visible image to load');
    await page.evaluate(() => {
      document.querySelector('img').src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="390" height="830"><path fill="orange" d="M0 0h390v415H0z"/><path fill="navy" d="M0 415h390v415H0z"/></svg>');
    });
    await pending;
    const stats = await require('sharp')(await page.screenshot({ type: 'webp' })).stats();
    assert.ok(stats.channels.some(channel => channel.stdev > 5));
    console.log('Passed: capture waits for streamed content and visible images.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
