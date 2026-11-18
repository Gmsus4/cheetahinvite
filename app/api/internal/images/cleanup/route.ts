import { timingSafeEqual } from "node:crypto";
import { runImageCleanup } from "@/lib/image-storage";
import { runInvitationLifecycle } from "@/lib/invitation-lifecycle-storage";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Cleanup is not configured" }, { status: 503 });
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const invitations = await runInvitationLifecycle();
    const images = await runImageCleanup();
    return Response.json({ ...images, invitations }, { status: invitations.failed || images.failed ? 500 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Scheduled R2 cleanup could not complete");
    return Response.json({ error: "Cleanup failed; retry required" }, { status: 500 });
  }
}
