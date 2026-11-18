import { cloudflareEnv } from "@/lib/cloudflare";
import { ownedImageKey, imageUrl } from "@/lib/r2";
import { prisma } from "@/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params;
  const key = segments.join("/");
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  try { if (ownedImageKey(imageUrl(key), segments[1], segments[2]) !== key) return missing(); }
  catch { return missing(); }
  // These retain Cloudinary's public, unguessable delivery URL semantics.
  // A verified image queued by its original owner may still be referenced by a
  // shared invitation. Keep delivering until reference-aware cleanup deletes it.
  const asset = await prisma.cloudinaryAsset.findFirst({ where: { publicId: key, provider: "R2", url: imageUrl(key), state: { in: ["READY", "DELETE_PENDING"] } } });
  if (!asset) return missing();
  const object = await (await cloudflareEnv()).INVITATION_IMAGES.get(key);
  if (!object) return missing();
  return new Response(object.body as unknown as ReadableStream, { headers: {
    "Content-Type": "image/webp", "Content-Length": String(object.size),
    "Cache-Control": "public, max-age=0, must-revalidate", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox", ETag: object.httpEtag,
  } });
}
