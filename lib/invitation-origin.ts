import "server-only";
import { headers } from "next/headers";

export async function invitationOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}
