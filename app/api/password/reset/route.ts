import { NextResponse } from "next/server";
import { INVALID_RESET_MESSAGE, resetPassword, validRecoveryToken } from "@/lib/password-recovery";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!validRecoveryToken(payload?.token)) return NextResponse.json({ error: INVALID_RESET_MESSAGE }, { status: 400 });
  const password = payload?.password;
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: "La contraseña debe tener entre 12 y 128 caracteres." }, { status: 400 });
  }
  if (password !== payload.confirmPassword) return NextResponse.json({ error: "Las contraseñas no coinciden." }, { status: 400 });
  try {
    if (!await resetPassword(payload.token, password)) return NextResponse.json({ error: INVALID_RESET_MESSAGE }, { status: 400 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Password reset could not be completed.");
    return NextResponse.json({ error: "No pudimos cambiar tu contraseña. Intenta nuevamente." }, { status: 500 });
  }
}
