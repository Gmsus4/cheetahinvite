import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function cloudflareEnv() {
  return (await getCloudflareContext({ async: true })).env;
}
