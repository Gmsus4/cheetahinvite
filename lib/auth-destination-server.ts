import "server-only";
import { headers } from "next/headers";
import { safeAuthDestination } from "./auth-destination";

export async function authDestinationFromRequest(value: unknown): Promise<string> {
  if (typeof value !== "string" || value.startsWith("/")) return safeAuthDestination(value);
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")?.split(",")[0].trim()
    || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim()
    || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return safeAuthDestination(value, `${protocol}://${host}`);
}
