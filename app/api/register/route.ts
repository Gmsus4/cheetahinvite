import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/prisma";

export const runtime = "nodejs";

type RegistrationPayload = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let payload: RegistrationPayload;
  try {
    payload = (await request.json()) as RegistrationPayload;
  } catch {
    return NextResponse.json({ error: "Revisa los datos ingresados." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Escribe tu nombre para crear la cuenta." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Ingresa un correo electrónico válido." }, { status: 400 });
  }
  if (password.length < 12 || password.length > 128) {
    return NextResponse.json(
      { error: "La contraseña debe tener entre 12 y 128 caracteres." },
      { status: 400 },
    );
  }

  try {
    await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "No fue posible registrar esa cuenta. Revisa el correo o inicia sesión." },
        { status: 409 },
      );
    }
    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "No pudimos crear tu cuenta. Inténtalo de nuevo más tarde." },
      { status: 500 },
    );
  }
}
