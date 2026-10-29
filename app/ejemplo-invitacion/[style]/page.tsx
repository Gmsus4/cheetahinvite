import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InvitationCanvas } from "@/components/dashboard/EventEditor";
import { landingEventExamples, landingInvitationExample, landingInvitationStyles } from "@/lib/landing-invitation-example";
import "./example.css";
import { WeddingInvitation } from "@/components/invitation/WeddingInvitation";
import { weddingDesignExamples, weddingExample } from "@/lib/wedding-design-examples";

export const metadata: Metadata = {
  title: "Invitación de ejemplo | Cheetah Invite",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return [...landingInvitationStyles, ...landingEventExamples, ...weddingDesignExamples].map(({ slug }) => ({ style: slug }));
}

type ExampleProps = {
  params: Promise<{ style: string }>;
  searchParams: Promise<{ vista?: string | string[]; paleta?: string | string[]; foto?: string | string[]; nombres?: string | string[] }>;
};

export default function InvitationExamplePage(props: ExampleProps) {
  return <Suspense fallback={<p role="status">Preparando invitación de ejemplo…</p>}>
    <InvitationExampleData {...props} />
  </Suspense>;
}

async function InvitationExampleData({ params, searchParams }: ExampleProps) {
  const [{ style }, query] = await Promise.all([params, searchParams]);
  const wedding = weddingDesignExamples.find(({ slug }) => slug === style);
  if (wedding) {
    const requestedPalette = typeof query.paleta === "string" ? query.paleta.toLowerCase() : "";
    const palette = wedding.design.palettes.find(p => p.accent.slice(1).toLowerCase() === requestedPalette) ?? wedding.design.palettes[0];
    const names = typeof query.nombres === "string" ? query.nombres.slice(0, 100) : "";
    return <main className="public-invitation-page invitation-example-page"><WeddingInvitation {...weddingExample} templateId={wedding.design.id} accent={palette.accent} imageUrl={query.foto === "no" ? "" : weddingExample.imageUrl} hostNames={names || weddingExample.hostNames} /></main>;
  }
  const example = landingInvitationStyles.find(({ slug }) => slug === style);
  const eventExample = landingEventExamples.find(({ slug }) => slug === style);
  if (!example && !eventExample) notFound();

  const invitation = eventExample?.invitation ?? {
    ...landingInvitationExample,
    templateId: example!.template.id,
    accent: example!.template.accent ?? "#E9560A",
  };

  return <main className={`public-invitation-page invitation-example-page${query.vista === "decoracion" ? " invitation-example-decoration" : ""}`}>
    <InvitationCanvas {...invitation} />
  </main>;
}
