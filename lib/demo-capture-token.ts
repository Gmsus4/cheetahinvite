import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function signature(id: string, version: number, expires: number) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for demo captures");
  return createHmac("sha256", secret).update(`demo-capture:${id}:${version}:${expires}`).digest("hex");
}

export function demoCaptureToken(id: string, version: number, now = Date.now()) {
  const expires = now + 120_000;
  return { expires: String(expires), token: signature(id, version, expires) };
}

export function validDemoCaptureToken(id: string, version: number, expires: string, token: string, now = Date.now()) {
  if (!Number.isSafeInteger(version) || version < 0 || !/^\d{13}$/.test(expires) || !/^[a-f0-9]{64}$/.test(token)) return false;
  const until = Number(expires);
  if (until <= now || until > now + 120_000 || !process.env.AUTH_SECRET) return false;
  return timingSafeEqual(Buffer.from(signature(id, version, until)), Buffer.from(token));
}
