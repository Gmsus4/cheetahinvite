import { cookies } from "next/headers";
import { accessCookieName, ACCESS_SECONDS, validInvitationPin } from "@/lib/invitation-pin";
import { unlockPrivateInvitation } from "@/lib/invitation-privacy-storage";

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "900" } : {}) } });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  const allowed = [new URL(request.url).origin];
  if (process.env.APP_URL) allowed.push(new URL(process.env.APP_URL).origin);
  if (!origin || !allowed.includes(origin)) return json({ error: "Solicitud no permitida." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Formato no válido." }, 415);
  const { id } = await params;
  if (!/^[\w-]{1,80}$/.test(id)) return json({ error: "Invitación no disponible." }, 404);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Escribe un PIN de seis dígitos." }, 400);
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); return json({ error: "Solicitud demasiado larga." }, 413); }
      chunks.push(value);
    }
    let pin: unknown;
    try { pin = JSON.parse(Buffer.concat(chunks).toString("utf8")).pin; } catch { return json({ error: "Escribe un PIN de seis dígitos." }, 400); }
    if (typeof pin !== "string" || !validInvitationPin(pin)) return json({ error: "Escribe un PIN de seis dígitos." }, 400);
    const address = request.headers.get(process.env.VERCEL ? "x-vercel-forwarded-for" : "x-forwarded-for")?.split(",")[0].trim().slice(0, 100) || "unknown";
    const result = await unlockPrivateInvitation(id, pin, address);
    if (result.status !== 200) return json({ error: result.error }, result.status);
    (await cookies()).set(accessCookieName(id), result.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: ACCESS_SECONDS, path: "/" });
    return json({ ok: true }, 200);
  } catch {
    return json({ error: "No pudimos comprobar el PIN. Inténtalo de nuevo." }, 503);
  }
}
