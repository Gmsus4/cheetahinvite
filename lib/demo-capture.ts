import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import type { InvitationProps } from "./invitation-editor";
import { createDemoPreview, demoPreviewKey } from "./demo-preview";
import { demoCaptureToken } from "./demo-capture-token";

async function browserOptions() {
  if (process.env.CHROMIUM_EXECUTABLE_PATH) return { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--hide-scrollbars"] };
  if (process.platform === "linux") {
    const { default: chromium } = await import("@sparticuz/chromium");
    return { executablePath: await chromium.executablePath(), args: chromium.args, headless: "shell" as const };
  }
  const candidates = process.platform === "win32" ? [
    path.join(process.env.PROGRAMFILES || "C:/Program Files", "Google/Chrome/Application/chrome.exe"),
    path.join(process.env.PROGRAMFILES || "C:/Program Files", "BraveSoftware/Brave-Browser/Application/brave.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:/Program Files (x86)", "Microsoft/Edge/Application/msedge.exe"),
  ] : ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
  const executablePath = candidates.find(file => existsSync(file));
  if (!executablePath) throw new Error("Configure CHROMIUM_EXECUTABLE_PATH for demo captures");
  return { executablePath, args: ["--hide-scrollbars"] };
}

export async function captureDemoPreview(id: string, version: number, invitation: InvitationProps) {
  const origin = new URL(process.env.APP_URL || "http://localhost:3000");
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid APP_URL");
  const { expires, token } = demoCaptureToken(id, version);
  const url = new URL(`/demo-capture/${encodeURIComponent(id)}`, origin);
  url.search = new URLSearchParams({ version: String(version), expires, token }).toString();
  const { default: puppeteer } = await import("puppeteer-core");
  const browser = await puppeteer.launch({ headless: true, ...await browserOptions(), defaultViewport: { width: 390, height: 830, deviceScaleFactor: 1 }, timeout: 20_000 });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30_000);
    await page.setRequestInterception(true);
    page.on("request", request => {
      const resource = new URL(request.url());
      if (resource.origin === origin.origin || resource.protocol === "data:" || resource.hostname === "res.cloudinary.com") void request.continue();
      else void request.abort();
    });
    const response = await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 40_000 });
    if (!response?.ok()) throw new Error("Demo capture page was unavailable");
    await page.waitForSelector(`main[data-preview-key="${demoPreviewKey(invitation)}"]`);
    await page.waitForFunction(() => document.fonts.status === "loaded" && Array.from(document.images)
      .filter(image => { const bounds = image.getBoundingClientRect(); return bounds.top < 830 && bounds.bottom > 0; })
      .every(image => image.complete && image.naturalWidth > 0));
    const image = await page.screenshot({ type: "webp", quality: 80, fullPage: false });
    return createDemoPreview(invitation, image);
  } finally {
    await browser.close();
  }
}
