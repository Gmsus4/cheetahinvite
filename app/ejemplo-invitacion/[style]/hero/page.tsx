import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import { landingEventExamples } from "@/lib/landing-invitation-example";
import { heroExampleWithImages } from "@/lib/hero-invitation-example";
import "./hero-preview.css";

export const metadata: Metadata = { title: "Demostración | Cheetah Invite", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return landingEventExamples.map(({ slug }) => ({ style: slug }));
}

export default function HeroPreviewPage({ params }: { params: Promise<{ style: string }> }) {
  return <Suspense fallback={<p role="status">Preparando ejemplo…</p>}><HeroPreview params={params} /></Suspense>;
}

async function HeroPreview({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  const example = landingEventExamples.find(example => example.slug === style);
  if (!example) notFound();
  return <main className="public-invitation-page"><CelebrationInvitation {...heroExampleWithImages(example)} preview /></main>;
}
