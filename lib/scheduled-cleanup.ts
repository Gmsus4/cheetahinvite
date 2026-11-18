type CleanupEnv = { APP_URL: string; CRON_SECRET: string; WORKER_SELF_REFERENCE: { fetch(request: Request): Promise<Response> } };

export async function scheduledCleanup(env: CleanupEnv) {
  if (!env.CRON_SECRET) throw new Error("Cleanup secret is not configured");
  const response = await env.WORKER_SELF_REFERENCE.fetch(new Request(new URL("/api/internal/images/cleanup", env.APP_URL), {
    headers: { authorization: `Bearer ${env.CRON_SECRET}` }, redirect: "error", signal: AbortSignal.timeout(50_000),
  }));
  if (!response.ok) throw new Error(`Cleanup failed (${response.status})`);
  const result = await response.json() as { failed?: number; invitations?: { failed?: number } };
  if (result.failed !== 0 || result.invitations?.failed !== 0) throw new Error("Cleanup has pending failures");
}
