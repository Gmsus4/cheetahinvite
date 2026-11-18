import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Local bindings only; this does not provision or deploy Cloudflare resources.
if (process.env.NODE_ENV === "development") void initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1"],
  // pg selects this transport only in workerd; Node's trace cannot observe it.
  outputFileTracingIncludes: { "/*": ["./node_modules/pg-cloudflare/**/*"] },
  // Turbopack's WASM loader otherwise traces unrelated toolchain WASM into every
  // Prisma route. The PostgreSQL compiler is emitted under .next/server/chunks.
  outputFileTracingExcludes: { "/*": [
    "./node_modules/**/*.wasm",
    "./node_modules/prisma/**/*", "./node_modules/@prisma/dev/**/*", "./node_modules/@prisma/engines/**/*",
    "./node_modules/@embedded-postgres/**/*", "./node_modules/embedded-postgres/**/*", "./node_modules/@electric-sql/**/*",
    "./node_modules/typescript/**/*", "./node_modules/eslint/**/*", "./node_modules/@eslint/**/*",
    "./node_modules/wrangler/**/*", "./node_modules/workerd/**/*", "./node_modules/miniflare/**/*",
    "./.cloudflare-test/**/*",
  ] },
  experimental: {
    agentFeedback: true,
  },
  // Next 16.4 Cache Components hangs document requests under workerd's timers.
  // Keep normal SSR until this combination passes the Workers integration test.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        // CSS Modules must keep Next's native class-name mapping. Rewriting
        // them as generic CSS leaves imports such as styles.card undefined.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
