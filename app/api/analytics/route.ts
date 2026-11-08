import { createHmac } from "node:crypto";
import { after } from "next/server";
import { prisma } from "@/prisma";
import { landingEventExamples } from "@/lib/landing-invitation-example";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const response = () => new Response(null, { status: 204 });
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return response();
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || Number(request.headers.get("content-length") || 0) > 1024) return response();
  try {
    if ((await auth())?.user?.role === "ADMIN") return response();
    const text = await request.text();
    if (text.length > 1024) return response();
    const { kind, exampleSlug = "", visitor } = JSON.parse(text);
    if (!["landing_view", "example_select"].includes(kind) || typeof visitor !== "string" || !/^[a-f0-9-]{36}$/i.test(visitor) || typeof exampleSlug !== "string" || !/^[a-z0-9-]{0,80}$/.test(exampleSlug) || (kind === "landing_view" && exampleSlug)) return response();
    if (kind === "example_select" && !landingEventExamples.some(e => e.slug === exampleSlug) && !await prisma.showcaseExample.findFirst({ where: { slug: exampleSlug, publishedAt: { not: null }, showInHero: true }, select: { id: true } })) return response();
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
    const identity = hash(`${day}:${visitor}`);
    const dedupeKey = hash(`${identity}:${kind}:${exampleSlug}`);
    await prisma.$transaction(async tx => {
      const existing = await tx.analyticsEvent.findUnique({ where: { dedupeKey }, select: { id: true } });
      if (existing) return;
      const expiresAt = new Date(now.getTime() + 2 * 86400000);
      const global = await tx.analyticsBudget.upsert({ where: { key: `all:${day}` }, create: { key: `all:${day}`, expiresAt }, update: { count: { increment: 1 } } });
      if (global.count > 100000) return;
      const budget = await tx.analyticsBudget.upsert({ where: { key: identity }, create: { key: identity, expiresAt }, update: { count: { increment: 1 } } });
      if (budget.count > 100) return;
      await tx.analyticsEvent.createMany({ data: [{ kind, exampleSlug, dedupeKey }], skipDuplicates: true });
    });
    if (Math.random() < .01) after(async () => {
      try {
        await prisma.analyticsBudget.deleteMany({ where: { expiresAt: { lte: new Date() } } });
        await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86400000) } } });
      } catch { /* Retried opportunistically on a subsequent event. */ }
    });
  } catch { /* Analytics is best effort; no visitor data is logged. */ }
  return response();
}
