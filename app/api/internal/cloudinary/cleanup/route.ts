import { timingSafeEqual } from "node:crypto";
import { runCloudinaryCleanup } from "@/lib/cloudinary-storage";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Cleanup is not configured" }, { status: 503 });
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await runCloudinaryCleanup(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Scheduled Cloudinary cleanup could not complete");
    return Response.json({ error: "Cleanup failed; retry required" }, { status: 500 });
  }
}
