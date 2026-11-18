import "server-only";
import puppeteer, { type Page } from "@cloudflare/puppeteer";
import { cloudflareEnv } from "./cloudflare";
import type { InvitationProps } from "./invitation-editor";
import { createDemoPreview, demoPreviewKey } from "./demo-preview";
import { demoCaptureToken } from "./demo-capture-token";

export async function waitForDemoCapture(page: Page, key: string) {
  // Streamed Suspense content can exist inside a hidden container before React
  // reveals it. Its images have no bounds yet, so image checks alone pass early.
  await page.waitForSelector(`main[data-preview-key="${key}"]`, { visible: true });
  await page.waitForFunction(() => document.fonts.status === "loaded" && Array.from(document.images)
    .filter(image => { const bounds = image.getBoundingClientRect(); return bounds.top < 830 && bounds.bottom > 0 && bounds.width > 0; })
    .every(image => image.complete && image.naturalWidth > 0));
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images)
      .filter(image => { const bounds = image.getBoundingClientRect(); return bounds.top < 830 && bounds.bottom > 0 && bounds.width > 0; })
      .map(image => image.decode()));
  });
}

export async function captureDemoPreview(id: string, version: number, invitation: InvitationProps) {
  const origin = new URL(process.env.APP_URL || "http://localhost:3000");
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid APP_URL");
  const { expires, token } = demoCaptureToken(id, version);
  const url = new URL(`/demo-capture/${encodeURIComponent(id)}`, origin);
  url.search = new URLSearchParams({ version: String(version), expires, token }).toString();
  const browser = await puppeteer.launch((await cloudflareEnv()).BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 830, deviceScaleFactor: 1 });
    page.setDefaultTimeout(30_000);
    await page.setRequestInterception(true);
    page.on("request", request => {
      const resource = new URL(request.url());
      if (resource.origin === origin.origin || resource.protocol === "data:" || resource.hostname === "res.cloudinary.com") void request.continue();
      else void request.abort();
    });
    const response = await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 40_000 });
    if (!response?.ok()) throw new Error("Demo capture page was unavailable");
    await waitForDemoCapture(page, demoPreviewKey(invitation));
    const image = await page.screenshot({ type: "webp", quality: 80, fullPage: false });
    return createDemoPreview(invitation, image);
  } finally {
    await browser.close();
  }
}
