type Env = { APP_ORIGIN: string; CRON_SECRET: string };
type ScheduledContext = { waitUntil(task: Promise<unknown>): void };

export async function cleanup(env: Env) {
  if (!env.APP_ORIGIN || !env.CRON_SECRET) throw new Error("Cleanup worker is not configured");
  const origin = new URL(env.APP_ORIGIN);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("APP_ORIGIN must be an HTTPS origin");
  }
  const response = await fetch(new URL("/api/internal/cloudinary/cleanup", origin), {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    redirect: "error", signal: AbortSignal.timeout(50_000),
  });
  if (!response.ok) throw new Error(`Cleanup endpoint returned ${response.status}`);
  const result = await response.json() as { deleted?: number; retained?: number; failed?: number };
  if (![result.deleted, result.retained, result.failed].every(value => typeof value === "number" && Number.isInteger(value) && value >= 0)) {
    throw new Error("Cleanup endpoint returned an invalid result");
  }
  if (result.failed) throw new Error("Image deletions remain queued for retry");
  console.log("Image cleanup completed", { deleted: result.deleted, retained: result.retained });
}

const worker = {
  scheduled(_controller: unknown, env: Env, context: ScheduledContext) {
    context.waitUntil(cleanup(env));
  },
};

export default worker;
