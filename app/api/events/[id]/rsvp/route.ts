import { parseRsvp, RSVP_LIMITS, validRsvpToken } from "@/lib/rsvp";
import { readRsvp, saveRsvp, RsvpError } from "@/lib/rsvp-storage";

type Context = { params: Promise<{ id: string }> };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "3600" } : {}) } });
function failure(error: unknown) {
  if (error instanceof RsvpError) return json({ error: error.message }, error.status);
  console.error("RSVP request could not complete");
  return json({ error: "No pudimos guardar o consultar tu respuesta. Inténtalo de nuevo." }, 503);
}
export async function GET(request: Request, { params }: Context) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!validRsvpToken(token)) return json({ error: "Respuesta no disponible." }, 400);
  const { id } = await params;
  if (!/^[\w-]{1,80}$/.test(id)) return json({ error: "Invitación no disponible." }, 404);
  try { return json({ response: await readRsvp(id, token) }); } catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: Context) {
  const origin = request.headers.get("origin");
  const origins = [new URL(request.url).origin];
  if (process.env.APP_URL) origins.push(new URL(process.env.APP_URL).origin);
  if (!origin || !origins.includes(origin)) return json({ error: "Solicitud no permitida." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Formato no válido." }, 415);
  const { id } = await params;
  if (!/^[\w-]{1,80}$/.test(id)) return json({ error: "Invitación no disponible." }, 404);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Revisa tu respuesta." }, 400);
    let bytes = 0, body = "";
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > RSVP_LIMITS.bodyBytes) { await reader.cancel(); return json({ error: "Respuesta demasiado larga." }, 413); }
      body += decoder.decode(value, { stream: true });
    }
    let values;
    try { values = parseRsvp(JSON.parse(body + decoder.decode())); } catch { return json({ error: "Revisa tu respuesta." }, 400); }
    if (!values) return json({ error: "Escribe tu nombre, elige si asistirás y agrega como máximo 5 acompañantes extra." }, 400);
    return json({ response: await saveRsvp(id, values) });
  } catch (error) { return failure(error); }
}
