import { after, NextResponse } from "next/server";
import { recoveryEmailConfig } from "@/lib/recovery-email";
import { RECOVERY_MESSAGE, requestPasswordRecovery } from "@/lib/password-recovery";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ingresa un correo electrónico válido." }, { status: 400 });
  }
  try {
    recoveryEmailConfig();
  } catch {
    return NextResponse.json({ error: "La recuperación por correo no está disponible por el momento. Intenta más tarde." }, { status: 503 });
  }
  // Respond before account lookup/email delivery to avoid exposing account existence.
  after(async () => {
    try { await requestPasswordRecovery(email); }
    catch { console.error("Password recovery could not be completed. Check database connectivity and Resend delivery/configuration."); }
  });
  return NextResponse.json({ message: RECOVERY_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
}
