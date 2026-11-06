import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

export const ACCESS_SECONDS = 12 * 60 * 60;
export const validInvitationPin = (pin: string) => /^\d{6}$/.test(pin);
export const generateInvitationPin = () => randomInt(1_000_000).toString().padStart(6, "0");
export const accessTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export const accessCookieName = (eventId: string) => `ci-access-${eventId}`;
export const createAccessToken = () => randomBytes(32).toString("hex");
const derive = (pin: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(pin, salt, 32, (error, key) => error ? reject(error) : resolve(key));
});
export async function hashInvitationPin(pin: string) {
  if (!validInvitationPin(pin)) throw new Error("Invalid PIN");
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await derive(pin, salt)).toString("hex")}`;
}
export async function verifyInvitationPin(pin: string, hash: string) {
  if (!validInvitationPin(pin) || !/^[a-f0-9]{32}:[a-f0-9]{64}$/.test(hash)) return false;
  const [salt, expected] = hash.split(":");
  return timingSafeEqual(await derive(pin, salt), Buffer.from(expected, "hex"));
}
