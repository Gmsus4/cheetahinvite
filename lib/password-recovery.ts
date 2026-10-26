import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/prisma";
import { hashPassword } from "@/lib/password";
import { sendRecoveryEmail } from "@/lib/recovery-email";

export const RECOVERY_MESSAGE = "Si el correo está asociado a una cuenta con contraseña, recibirás un enlace para restablecerla. Revisa también tu carpeta de spam.";
export const INVALID_RESET_MESSAGE = "Este enlace no es válido o ya venció. Solicita uno nuevo.";
const HOUR = 60 * 60 * 1000;
export const recoveryTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export const validRecoveryToken = (token: unknown): token is string => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

export async function requestPasswordRecovery(email: string) {
  const now = new Date();
  // Persistent limits also apply to unknown accounts and survive server restarts.
  await prisma.passwordRecoveryLimit.deleteMany({ where: { expiresAt: { lte: now } } });
  const bucket = Math.floor(now.getTime() / HOUR);
  const limit = await prisma.passwordRecoveryLimit.upsert({
    where: { key: `${recoveryTokenHash(email)}:${bucket}` },
    create: { key: `${recoveryTokenHash(email)}:${bucket}`, expiresAt: new Date((bucket + 1) * HOUR) },
    update: { count: { increment: 1 } },
  });
  if (limit.count > 3) return;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  if (!user?.passwordHash) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = recoveryTokenHash(token);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetHash: tokenHash, passwordResetExpiresAt: new Date(now.getTime() + 30 * 60 * 1000) },
  });
  try {
    await sendRecoveryEmail(email, token, tokenHash);
  } catch (error) {
    // Do not clear a newer link if another request completed in the meantime.
    await prisma.user.updateMany({ where: { id: user.id, passwordResetHash: tokenHash }, data: { passwordResetHash: null, passwordResetExpiresAt: null } });
    throw error;
  }
}

export async function resetPassword(token: string, password: string) {
  if (!validRecoveryToken(token)) return false;
  const tokenHash = recoveryTokenHash(token);
  const user = await prisma.user.findFirst({ where: { passwordResetHash: tokenHash, passwordResetExpiresAt: { gt: new Date() }, passwordHash: { not: null } }, select: { id: true } });
  if (!user) return false;
  const passwordHash = await hashPassword(password);
  // Consume the token and change the password atomically: only one submission wins.
  const changed = await prisma.user.updateMany({
    where: { id: user.id, passwordResetHash: tokenHash, passwordResetExpiresAt: { gt: new Date() }, passwordHash: { not: null } },
    data: { passwordHash, passwordResetHash: null, passwordResetExpiresAt: null, sessionVersion: { increment: 1 } },
  });
  return changed.count === 1;
}
