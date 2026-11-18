import type { R2Bucket } from "@cloudflare/workers-types";
import type puppeteer from "@cloudflare/puppeteer";

declare global {
  interface CloudflareEnv {
    INVITATION_IMAGES: R2Bucket;
    IMAGES?: ImagesBinding;
    BROWSER: Parameters<typeof puppeteer.launch>[0];
    APP_URL: string;
    CRON_SECRET: string;
  }
}
export {};
