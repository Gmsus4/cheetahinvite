import { prisma } from "@/prisma";
import type { InvitationProps } from "@/lib/invitation-editor";
import { readDemoPreview } from "@/lib/demo-preview";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; key: string }> }) {
  const { slug, key } = await params;
  if (!/^[a-f0-9]{24}$/.test(key)) return new Response(null, { status: 404 });
  const example = await prisma.showcaseExample.findUnique({ where: { slug }, select: { publishedAt: true, publishedContent: true } });
  const preview = example?.publishedAt && example.publishedContent ? readDemoPreview(example.publishedContent as unknown as InvitationProps) : null;
  if (!preview || preview.key !== key) return new Response(null, { status: 404 });
  return new Response(Buffer.from(preview.webp, "base64"), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
