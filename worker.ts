// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- The module is absent before build and present afterwards.
// @ts-ignore OpenNext generates this module during build:workers.
import handler, { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
import { scheduledCleanup } from "./lib/scheduled-cleanup";

export { DOQueueHandler, DOShardedTagCache };
const worker = {
  fetch: handler.fetch,
  scheduled(_event: unknown, env: Parameters<typeof scheduledCleanup>[0], ctx: { waitUntil(task: Promise<unknown>): void }) {
    ctx.waitUntil(scheduledCleanup(env));
  },
};
export default worker;
