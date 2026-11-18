/* eslint-disable @typescript-eslint/no-require-imports -- Copy framework WASM needed after OpenNext's OG patch. */
const fs = require('node:fs');
const path = require('node:path');

function copyWorkerRuntimeAssets() {
  // Next's server references the OG renderer even without application OG routes.
  // Preserve these two framework assets while excluding unrelated CLI WASM from
  // Turbopack's broad dynamic loader trace.
  for (const name of ['resvg.wasm', 'yoga.wasm']) {
    const relative = path.join('node_modules/next/dist/compiled/@vercel/og', name);
    const destination = path.resolve('.open-next/server-functions/default', relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.resolve(relative), destination);
  }
}
module.exports = { copyWorkerRuntimeAssets };
if (require.main === module) copyWorkerRuntimeAssets();
