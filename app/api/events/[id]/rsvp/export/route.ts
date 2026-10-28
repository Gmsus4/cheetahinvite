import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { rsvpCsv, RSVP_LIMITS } from "@/lib/rsvp";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const headers = { "Cache-Control": "no-store" };
  if (!session?.user?.id) return Response.json({ error: "Inicia sesión para consultar las respuestas." }, { status: 401, headers });
  const { id } = await params;
  const event = await prisma.event.findFirst({ where: { id, ownerId: session.user.id }, select: { id: true } });
  if (!event) return Response.json({ error: "Invitación no encontrada." }, { status: 404, headers });
  const responses = await prisma.rsvpResponse.findMany({ where: { eventId: id }, select: { name: true, attending: true, companions: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: RSVP_LIMITS.responsesPerEvent });
  return new Response(rsvpCsv(responses), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="asistencias.csv"', "X-Content-Type-Options": "nosniff" } });
}
