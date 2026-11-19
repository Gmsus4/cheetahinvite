import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { prisma } from "@/prisma";

const MINUTE = 60_000;
export const AUTH_ATTEMPT_LIMITS = {
  "register-ip": { maximum: 5, windowMs: 60 * MINUTE },
  "register-email": { maximum: 3, windowMs: 60 * MINUTE },
  "login-ip": { maximum: 30, windowMs: 15 * MINUTE },
  "login-email": { maximum: 10, windowMs: 15 * MINUTE },
} as const;
export type AuthAttemptScope = keyof typeof AUTH_ATTEMPT_LIMITS;

export function authRequestAddress(request: Request) {
  // Cloudflare overwrites this header at the edge. Never trust client-supplied
  // X-Forwarded-For. Local requests without a valid edge IP share one budget.
  const address = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  return isIP(address) ? address : "unknown";
}

export async function consumeAuthAttempt(scope: AuthAttemptScope, identifier: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Authentication limits require AUTH_SECRET");
  const { maximum, windowMs } = AUTH_ATTEMPT_LIMITS[scope];
  const now = new Date();
  const bucket = Math.floor(now.getTime() / windowMs);
  const expiresAt = new Date((bucket + 1) * windowMs);
  // Separate scopes/windows and keep emails and IP addresses out of storage.
  const identity = createHmac("sha256", secret).update(JSON.stringify([scope, bucket, identifier])).digest("hex");
  const key = `${scope}:${bucket}:${identity}`;
  await prisma.authAttemptBudget.deleteMany({ where: { expiresAt: { lte: now } } });
  // Native PostgreSQL upsert increments atomically across concurrent requests
  // and Workers. Count admission before any password hashing or user lookup.
  const budget = await prisma.authAttemptBudget.upsert({
    where: { key },
    create: { key, expiresAt },
    update: { count: { increment: 1 } },
  });
  return {
    allowed: budget.count <= maximum,
    retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}
